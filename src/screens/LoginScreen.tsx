import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, User as UserIcon, ArrowRight, Globe2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LoginScreenProps {
  onNavigate: (route: string, param?: string) => void;
  redirectAfterLogin?: string;
}

export function LoginScreen({ onNavigate, redirectAfterLogin }: LoginScreenProps) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or mobile number');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password');
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      showToast('Signed in successfully! Welcome back.', 'success');
      onNavigate(redirectAfterLogin || 'home');
    } else {
      setErrorMessage(result.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-200">
            <Globe2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            Customer Sign In
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Access your cross-border orders, wishlist, and verified addresses
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Mobile */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Email or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. user@domain.com or +8801712..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:bg-white focus:border-indigo-600 outline-hidden transition-all"
                required
              />
              <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:bg-white focus:border-indigo-600 outline-hidden transition-all"
                required
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 rounded-sm"
              />
              <span>Remember my session</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link to Register */}
        <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-500">
          Don't have a customer account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Create an Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
