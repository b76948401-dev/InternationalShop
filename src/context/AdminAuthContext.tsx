import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AdminAuthContextType {
  isAdmin: boolean;
  adminUser: User | null;
  adminToken: string | null;
  isLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_TOKEN_KEY = 'international_shop_admin_token';
const ADMIN_USER_KEY = 'international_shop_admin_user';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(ADMIN_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => Boolean(adminToken));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate admin status on mount or token change
  useEffect(() => {
    let isMounted = true;

    async function checkAdminSession() {
      setIsLoading(true);
      try {
        // 1. Check if Supabase session is active
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userEmail = session.user.email?.toLowerCase() || '';

          // Check if admin by email or role in profiles
          const isEmailAdmin = userEmail === 'admin@shop.com' || userEmail === 'b76948401@gmail.com';

          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, email, country, mobile')
            .eq('id', session.user.id)
            .maybeSingle();

          const hasAdminRole = profile?.role === 'admin' || isEmailAdmin;

          if (hasAdminRole && isMounted) {
            const adminModel: User = {
              id: session.user.id,
              fullName: profile?.full_name || 'System Administrator',
              username: 'admin',
              email: session.user.email || 'admin@shop.com',
              mobile: profile?.mobile || '+8801700000000',
              country: profile?.country || 'Bangladesh',
              dob: '1990-01-01',
              gender: 'Male',
              createdAt: new Date().toISOString(),
            };

            setAdminToken(session.access_token);
            setAdminUser(adminModel);
            setIsAdmin(true);
            localStorage.setItem(ADMIN_TOKEN_KEY, session.access_token);
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminModel));
            setIsLoading(false);
            return;
          }
        }

        // 2. Check local admin token from Express session
        const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (storedToken) {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const d = await res.json();
              if (d.user?.role === 'admin' || d.user?.email === 'admin@shop.com' || d.user?.email === 'b76948401@gmail.com') {
                if (isMounted) {
                  setAdminUser(d.user);
                  setIsAdmin(true);
                  setIsLoading(false);
                  return;
                }
              }
            }
          } catch {
            // network error
          }
        }

        // If neither valid, check if stored admin is default
        if (storedToken && isMounted) {
          setIsAdmin(true);
        } else if (isMounted) {
          setIsAdmin(false);
          setAdminUser(null);
        }
      } catch (err) {
        console.error('[AdminAuth] Error checking session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginAdmin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Try Supabase Auth first
      const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (!supaErr && supaAuth.user) {
        const isEmailAdmin = cleanEmail === 'admin@shop.com' || cleanEmail === 'b76948401@gmail.com';

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supaAuth.user.id)
          .maybeSingle();

        if (profile?.role === 'admin' || isEmailAdmin) {
          const adminModel: User = {
            id: supaAuth.user.id,
            fullName: profile?.full_name || 'System Administrator',
            username: profile?.username || 'admin',
            email: supaAuth.user.email || cleanEmail,
            mobile: profile?.mobile || '',
            country: profile?.country || 'Bangladesh',
            dob: profile?.dob || '1990-01-01',
            gender: profile?.gender || 'Male',
            createdAt: profile?.created_at || new Date().toISOString(),
          };

          const token = supaAuth.session.access_token;
          setAdminToken(token);
          setAdminUser(adminModel);
          setIsAdmin(true);
          localStorage.setItem(ADMIN_TOKEN_KEY, token);
          localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminModel));
          setIsLoading(false);
          return { success: true };
        } else {
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: 'Access denied: User account does not have administrative privileges.' };
        }
      }

      // 2. Fallback to Express backend auth
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanEmail, password: pass }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        if (data.user?.role === 'admin' || cleanEmail === 'admin@shop.com' || cleanEmail === 'b76948401@gmail.com') {
          setAdminToken(data.token);
          setAdminUser(data.user);
          setIsAdmin(true);
          localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
          localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          return { success: false, error: 'Access denied: This account lacks administrative permissions.' };
        }
      }

      setIsLoading(false);
      return { success: false, error: data.error || supaErr?.message || 'Invalid administrator credentials.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network error during admin authentication.' };
    }
  };

  const logoutAdmin = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setAdminToken(null);
    setAdminUser(null);
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin,
        adminUser,
        adminToken,
        isLoading,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
