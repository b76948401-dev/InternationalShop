import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ForgotPasswordScreenProps {
  onNavigate: (route: string) => void;
}

export function ForgotPasswordScreen({ onNavigate }: ForgotPasswordScreenProps) {
  const { requestPasswordReset, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receivedCodeNotice, setReceivedCodeNotice] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address');
      return;
    }

    setIsSubmitting(true);
    const result = await requestPasswordReset(email.trim());
    setIsSubmitting(false);

    if (result.success) {
      setStep(2);
      if (result.verificationCode) {
        setReceivedCodeNotice(result.verificationCode);
        showToast(`Verification code: ${result.verificationCode}`, 'info');
      } else {
        showToast('Reset code sent to your email', 'success');
      }
    } else {
      setErrorMessage(result.error || 'Failed to request reset code');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code.trim()) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(email.trim(), code.trim(), newPassword, confirmNewPassword);
    setIsSubmitting(false);

    if (result.success) {
      showToast('Password reset successfully! Please sign in with your new password.', 'success');
      onNavigate('login');
    } else {
      setErrorMessage(result.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-lg"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            Reset Password
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {step === 1
              ? 'Enter your registered email address to receive a verification code'
              : 'Enter the verification code and your new password'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {receivedCodeNotice && (
          <div className="mb-6 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800">
            <strong>Verification Code: </strong>
            <span className="font-mono font-bold text-sm">{receivedCodeNotice}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                  required
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Sending code...' : 'Send Reset Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-mono tracking-widest text-center focus:border-indigo-600 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                  required
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                  required
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Updating password...' : 'Update Password'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <button
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
