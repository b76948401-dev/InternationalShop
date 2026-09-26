import { Request, Response, NextFunction } from 'express';
import { UserRecord, validateSession } from '../db';
import { supabaseServer } from '../supabase';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  
  // 1. Try local session store
  const localUser = validateSession(token);
  if (localUser) {
    req.user = localUser;
    return next();
  }

  // 2. Try Supabase Auth token
  try {
    const { data: { user: supaUser }, error } = await supabaseServer.auth.getUser(token);
    if (!error && supaUser) {
      const email = supaUser.email?.toLowerCase() || '';
      const isAdminEmail = email === 'admin@shop.com' || email === 'b76948401@gmail.com';

      // Check profile in Supabase
      const { data: profile } = await supabaseServer
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .maybeSingle();

      const isAdmin = profile?.role === 'admin' || isAdminEmail || (supaUser.app_metadata?.role === 'admin');

      req.user = {
        id: supaUser.id,
        fullName: profile?.full_name || supaUser.user_metadata?.full_name || 'Customer',
        username: profile?.username || supaUser.user_metadata?.username || email.split('@')[0],
        email: email,
        mobile: profile?.mobile || supaUser.user_metadata?.mobile || '',
        country: profile?.country || supaUser.user_metadata?.country || 'Bangladesh',
        dob: profile?.dob || supaUser.user_metadata?.dob || '1995-01-01',
        gender: profile?.gender || supaUser.user_metadata?.gender || 'Male',
        createdAt: profile?.created_at || supaUser.created_at || new Date().toISOString(),
        passwordHash: '',
        passwordSalt: '',
        isAdmin: Boolean(isAdmin),
      };
    }
  } catch (err) {
    // Non-blocking, continue
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in to your account.' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Server-side strict authorization check
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({
      error: 'Access denied. Administrative authorization required. You do not have permission to perform this action.',
    });
    return;
  }
  next();
}
