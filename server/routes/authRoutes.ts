import { Router, Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';
import {
  createSession,
  deleteSession,
  findUserByIdentifier,
  findUserById,
  generateResetCode,
  getDb,
  hashPassword,
  sanitizeUser,
  saveDatabase,
  UserRecord,
  verifyPassword,
} from '../db';
import { SupportedCountry } from '../../src/types';
import { supabaseServer } from '../supabase';

const router = Router();

const VALID_COUNTRIES: SupportedCountry[] = ['Bangladesh', 'India', 'Pakistan'];

// POST /api/auth/register
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      username,
      email,
      mobile,
      password,
      confirmPassword,
      dob,
      gender,
      country,
    } = req.body;

    // 1. Check required fields
    if (!fullName || !username || !email || !mobile || !password || !confirmPassword || !dob || !gender || !country) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    // 2. Validate country
    if (!VALID_COUNTRIES.includes(country)) {
      res.status(400).json({ error: 'Selected country is not supported at this stage. Supported countries are Bangladesh, India, and Pakistan.' });
      return;
    }

    // 3. Validate gender
    if (gender !== 'Male' && gender !== 'Female') {
      res.status(400).json({ error: 'Gender must be either Male or Female.' });
      return;
    }

    // 4. Validate passwords
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Password and Confirm Password do not match.' });
      return;
    }

    // 5. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    // 6. Validate mobile format
    const cleanMobile = mobile.trim();
    if (cleanMobile.length < 7 || cleanMobile.length > 16) {
      res.status(400).json({ error: 'Please enter a valid mobile number with country code.' });
      return;
    }

    // 7. Validate Date of Birth
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
      res.status(400).json({ error: 'Please provide a valid date of birth in the past.' });
      return;
    }

    const db = getDb();

    // 8. Check duplicate email
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // 9. Check duplicate username
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      res.status(409).json({ error: 'This username is already taken. Please choose another.' });
      return;
    }

    // 10. Check duplicate mobile
    if (db.users.some((u) => u.mobile.replace(/\D/g, '') === cleanMobile.replace(/\D/g, ''))) {
      res.status(409).json({ error: 'An account with this mobile number already exists.' });
      return;
    }

    // 11. Supabase Auth Sign Up & User ID Resolution
    let supabaseUserId: string | null = null;
    let supaUserToken: string | null = null;
    try {
      const { data: supaAuth, error: supaErr } = await supabaseServer.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
            username: username.trim(),
            phone: cleanMobile,
            mobile: cleanMobile,
            country,
            gender,
            dob,
            date_of_birth: dob,
            role: 'customer',
          },
        },
      });

      if (supaAuth?.user?.id) {
        supabaseUserId = supaAuth.user.id;
        supaUserToken = supaAuth.session?.access_token || null;
      }
    } catch (err: any) {
      console.warn('[Supabase Auth Warning]:', err.message);
    }

    const { salt, hash } = hashPassword(password);
    // Use the Supabase Auth UUID or generate a RFC 4122 compliant UUID so foreign key references to UUID columns succeed
    const userId = supabaseUserId || crypto.randomUUID();

    const newUser: UserRecord = {
      id: userId,
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      mobile: cleanMobile,
      country,
      dob,
      gender,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
      isAdmin: email.trim().toLowerCase() === 'admin@shop.com' || email.trim().toLowerCase() === 'b76948401@gmail.com',
    };

    db.users.push(newUser);

    // Initial welcome notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: newUser.id,
      title: 'Welcome to International Shop!',
      message: `Your customer account has been created for ${country}. Explore our catalog with localized pricing and reliable delivery.`,
      type: 'account',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Add admin notification to local persistent database
    db.notifications.unshift({
      id: `notif-admin-${Date.now()}`,
      userId: 'admin',
      title: 'New Customer Registered',
      message: `${newUser.fullName} (${newUser.email}) registered from ${newUser.country}.`,
      type: 'account',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();

    // Sync to Supabase public.customers & public.profiles
    (async () => {
      try {
        const customerPhone = newUser.mobile || (newUser as any).phone || '+8801700000000';
        // 1. Sync to public.customers table
        const customerRow: any = {
          id: newUser.id,
          full_name: newUser.fullName,
          username: newUser.username,
          email: newUser.email,
          phone: customerPhone,
          mobile: customerPhone,
          country: newUser.country,
          date_of_birth: newUser.dob,
          gender: newUser.gender,
          role: newUser.isAdmin ? 'admin' : 'customer',
          status: 'active',
          created_at: newUser.createdAt,
          updated_at: new Date().toISOString(),
        };
        if (supabaseUserId) {
          customerRow.auth_user_id = supabaseUserId;
        }

        let { error: custErr } = await supabaseServer
          .from('customers')
          .upsert(customerRow, { onConflict: 'id' });

        if (custErr) {
          // Retry without optional columns in case of column discrepancies
          const minimalRow = {
            id: newUser.id,
            email: newUser.email,
            phone: customerPhone,
            full_name: newUser.fullName,
            country: newUser.country,
            role: newUser.isAdmin ? 'admin' : 'customer',
            status: 'active',
          };
          const { error: retryErr } = await supabaseServer
            .from('customers')
            .upsert(minimalRow, { onConflict: 'id' });
          if (!retryErr) {
            console.log('[Supabase Customers Sync Minimal Success]:', newUser.id);
          } else {
            console.log('[Supabase Customers Sync Note]:', retryErr.message);
          }
        } else {
          console.log('[Supabase Customers Sync Success]: Customer', newUser.id, 'stored in public.customers');
        }

        // 2. Sync to public.profiles table
        const profileRow = {
          id: newUser.id,
          full_name: newUser.fullName,
          username: newUser.username,
          email: newUser.email,
          phone: customerPhone,
          country: newUser.country,
          role: newUser.isAdmin ? 'admin' : 'customer',
          created_at: newUser.createdAt,
          updated_at: new Date().toISOString(),
        };

        try {
          await supabaseServer
            .from('profiles')
            .upsert(profileRow, { onConflict: 'id' });
        } catch {
          // Non-blocking
        }

        // 3. Create Admin Notification in Supabase notifications table
        const adminNotif = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: 'New Customer Registered',
          message: `${newUser.fullName} (${newUser.email}) registered from ${newUser.country}.`,
          type: 'system_alert',
          recipient_type: 'all',
          target_country: newUser.country,
          recipient_customer_id: newUser.id,
          recipient_customer_name: newUser.fullName,
          link: '/admin',
          is_read: false,
          created_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
        };

        const { error: notifErr } = await supabaseServer.from('notifications').insert(adminNotif);
        if (notifErr) {
          console.warn('[Supabase Notification Warning]:', notifErr.message);
        } else {
          console.log('[Supabase Notification]: Admin alert dispatched for new customer registration');
        }
      } catch (syncErr: any) {
        console.warn('[Supabase Registration Sync Error]:', syncErr.message);
      }
    })();

    const token = createSession(newUser.id);

    res.status(201).json({
      message: 'Registration successful! Welcome to International Shop.',
      user: sanitizeUser(newUser),
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please provide your email or mobile number and password.' });
      return;
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    let emailToTry = cleanIdentifier;

    // If identifier is mobile or username, look up matching email
    if (!cleanIdentifier.includes('@')) {
      // Check local db
      const localUser = findUserByIdentifier(identifier);
      if (localUser?.email) {
        emailToTry = localUser.email;
      } else {
        // Try looking up in Supabase profiles
        const { data: prof } = await supabaseServer
          .from('profiles')
          .select('email')
          .or(`username.eq.${identifier},mobile.eq.${identifier}`)
          .maybeSingle();
        if (prof?.email) {
          emailToTry = prof.email;
        }
      }
    }

    // 1. Attempt Supabase Auth login
    let supaSuccess = false;
    let supaToken = '';
    let supaUserId = '';
    try {
      const { data: supaAuth, error: supaErr } = await supabaseServer.auth.signInWithPassword({
        email: emailToTry,
        password,
      });

      if (!supaErr && supaAuth?.user && supaAuth?.session) {
        supaSuccess = true;
        supaToken = supaAuth.session.access_token;
        supaUserId = supaAuth.user.id;
      }
    } catch {
      // Continue to local fallback
    }

    // If Supabase Auth succeeded
    if (supaSuccess && supaUserId) {
      // Fetch or sync profile
      let user = findUserById(supaUserId);
      if (!user) {
        const { data: prof } = await supabaseServer
          .from('profiles')
          .select('*')
          .eq('id', supaUserId)
          .maybeSingle();

        const isAdmin = prof?.role === 'admin' || emailToTry === 'admin@shop.com' || emailToTry === 'b76948401@gmail.com';

        user = {
          id: supaUserId,
          fullName: prof?.full_name || 'Customer',
          username: prof?.username || emailToTry.split('@')[0],
          email: emailToTry,
          mobile: prof?.mobile || '',
          country: prof?.country || 'Bangladesh',
          dob: prof?.dob || '1995-01-01',
          gender: prof?.gender || 'Male',
          createdAt: prof?.created_at || new Date().toISOString(),
          passwordHash: '',
          passwordSalt: '',
          isAdmin,
        };
        getDb().users.push(user);
        saveDatabase();
      }

      const token = supaToken || createSession(user.id);
      res.json({
        message: 'Login successful via Supabase Auth.',
        user: sanitizeUser(user),
        token,
      });
      return;
    }

    // 2. Fallback to local user database
    const user = findUserByIdentifier(identifier);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. No account found with this email or mobile number.' });
      return;
    }

    const isMatch = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
      return;
    }

    const token = createSession(user.id);

    res.json({
      message: 'Login successful.',
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: sanitizeUser(req.user) });
});

// POST /api/auth/logout
router.post('/logout', (req: AuthenticatedRequest, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    deleteSession(token);
  }
  res.json({ message: 'Logged out successfully.' });
});

// POST /api/auth/forgot-password/request
router.post('/forgot-password/request', (req, res: Response): void => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Please enter your registered email address.' });
      return;
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'No account registered with this email address.' });
      return;
    }

    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Clear existing codes for this email
    db.resetCodes = db.resetCodes.filter((r) => r.email.toLowerCase() !== email.toLowerCase());
    db.resetCodes.push({
      email: user.email,
      code,
      expiresAt,
    });
    saveDatabase();

    res.json({
      success: true,
      message: `A 6-digit password reset verification code has been issued for ${user.email}.`,
      verificationCode: code, // Provided directly so the user can complete the reset in the UI
    });
  } catch (err) {
    console.error('Forgot password request error:', err);
    res.status(500).json({ error: 'Internal server error during password reset request.' });
  }
});

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', (req, res: Response): void => {
  try {
    const { email, code, newPassword, confirmNewPassword } = req.body;

    if (!email || !code || !newPassword || !confirmNewPassword) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      res.status(400).json({ error: 'New password and confirmation do not match.' });
      return;
    }

    const db = getDb();
    const resetEntry = db.resetCodes.find(
      (r) => r.email.toLowerCase() === email.trim().toLowerCase() && r.code === code.trim()
    );

    if (!resetEntry) {
      res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
      return;
    }

    if (new Date(resetEntry.expiresAt) < new Date()) {
      res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
      return;
    }

    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const { salt, hash } = hashPassword(newPassword);
    user.passwordSalt = salt;
    user.passwordHash = hash;

    // Remove used reset code
    db.resetCodes = db.resetCodes.filter((r) => r.email.toLowerCase() !== email.toLowerCase());

    // Invalidate old sessions for security
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);

    // Create notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: 'Password Changed Successfully',
      message: 'Your account password was updated. If you did not make this change, contact support immediately.',
      type: 'account',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Internal server error during password reset.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { fullName, username, mobile, dob, gender, country, avatarUrl } = req.body;

    const db = getDb();
    const liveUser = findUserById(user.id);
    if (!liveUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (fullName) liveUser.fullName = fullName.trim();
    if (gender && (gender === 'Male' || gender === 'Female')) liveUser.gender = gender;
    if (dob) liveUser.dob = dob;
    if (country && VALID_COUNTRIES.includes(country)) liveUser.country = country;
    if (avatarUrl !== undefined) liveUser.avatarUrl = avatarUrl;

    if (username && username.trim().toLowerCase() !== liveUser.username.toLowerCase()) {
      const exists = db.users.some(
        (u) => u.id !== user.id && u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (exists) {
        res.status(409).json({ error: 'This username is already taken.' });
        return;
      }
      liveUser.username = username.trim();
    }

    if (mobile && mobile.trim() !== liveUser.mobile) {
      const exists = db.users.some(
        (u) => u.id !== user.id && u.mobile.replace(/\D/g, '') === mobile.replace(/\D/g, '')
      );
      if (exists) {
        res.status(409).json({ error: 'An account with this mobile number already exists.' });
        return;
      }
      liveUser.mobile = mobile.trim();
    }

    saveDatabase();

    // Async sync updated profile to Supabase public.profiles
    (async () => {
      try {
        await supabaseServer.from('profiles').upsert({
          id: liveUser.id,
          full_name: liveUser.fullName,
          username: liveUser.username,
          email: liveUser.email,
          mobile: liveUser.mobile,
          country: liveUser.country,
          dob: liveUser.dob,
          gender: liveUser.gender,
          avatar_url: liveUser.avatarUrl || null,
        });
      } catch (err: any) {
        console.log('[Supabase Sync Error]:', err.message);
      }
    })();

    res.json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(liveUser),
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal server error during profile update.' });
  }
});

// PUT /api/auth/password
router.put('/password', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      res.status(400).json({ error: 'All password fields are required.' });
      return;
    }

    const liveUser = findUserById(user.id);
    if (!liveUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = verifyPassword(currentPassword, liveUser.passwordSalt, liveUser.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      res.status(400).json({ error: 'New password and confirmation do not match.' });
      return;
    }

    const { salt, hash } = hashPassword(newPassword);
    liveUser.passwordSalt = salt;
    liveUser.passwordHash = hash;

    const db = getDb();
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: user.id,
      title: 'Password Changed',
      message: 'Your account password was successfully updated.',
      type: 'account',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Internal server error during password update.' });
  }
});

export default router;
