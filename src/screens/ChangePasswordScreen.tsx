import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ChangePasswordScreenProps {
  onNavigate: (route: string) => void;
}

export function ChangePasswordScreen({ onNavigate }: ChangePasswordScreenProps) {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(currentPassword, newPassword, confirmNewPassword);
    setIsSubmitting(false);

    if (result.success) {
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      onNavigate('my-account');
    } else {
      setErrorMessage(result.error || 'Failed to change password. Please check your current password.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-neutral-500 mb-4">Please log in to update your password.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => onNavigate('my-account')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Account</span>
      </button>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-xs">
        <div className="mb-8 pb-6 border-b border-neutral-100">
          <h1 className="text-2xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            Change Password
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Ensure your account is using a strong, unique password
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                required
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                required
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                required
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => onNavigate('my-account')}
              className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
