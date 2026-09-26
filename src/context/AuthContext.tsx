import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedCountry, User } from '../types';

interface RegisterData {
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  dob: string;
  gender: 'Male' | 'Female';
  country: SupportedCountry;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  activeCountry: SupportedCountry;
  setActiveCountry: (country: SupportedCountry) => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; verificationCode?: string; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string, confirmNewPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'international_shop_token';
const COUNTRY_KEY = 'international_shop_country';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCountry, setActiveCountryState] = useState<SupportedCountry>(() => {
    const saved = localStorage.getItem(COUNTRY_KEY) as SupportedCountry;
    if (saved === 'Bangladesh' || saved === 'India' || saved === 'Pakistan') {
      return saved;
    }
    return 'Bangladesh';
  });

  const setActiveCountry = (country: SupportedCountry) => {
    if (country === 'Bangladesh' || country === 'India' || country === 'Pakistan') {
      setActiveCountryState(country);
      localStorage.setItem(COUNTRY_KEY, country);
    }
  };

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Sync active country with user's registered country if not manually overridden
        if (data.user?.country) {
          setActiveCountryState(data.user.country);
          localStorage.setItem(COUNTRY_KEY, data.user.country);
        }
      } else {
        // Invalid session
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in.' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user?.country) {
        setActiveCountry(data.user.country);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (regData: RegisterData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user?.country) {
        setActiveCountry(data.user.country);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update profile.' };
      }

      setUser(data.user);
      if (data.user?.country) {
        setActiveCountry(data.user.country);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to change password.' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send reset code.' };
      }

      return { success: true, verificationCode: data.verificationCode };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string, confirmNewPassword: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword, confirmNewPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Password reset failed.' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        activeCountry,
        setActiveCountry,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        requestPasswordReset,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
