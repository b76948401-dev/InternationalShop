import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, Calendar, Globe2, Upload, Trash2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SupportedCountry } from '../types';
import { SUPPORTED_COUNTRIES } from '../config/countries';

interface ProfileSettingsScreenProps {
  onNavigate: (route: string) => void;
}

export function ProfileSettingsScreen({ onNavigate }: ProfileSettingsScreenProps) {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [gender, setGender] = useState<'Male' | 'Female'>(user?.gender || 'Male');
  const [country, setCountry] = useState<SupportedCountry>(user?.country || 'Bangladesh');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Username is required');
      return;
    }

    setIsSubmitting(true);
    const result = await updateProfile({
      fullName: fullName.trim(),
      username: username.trim(),
      mobile: mobile.trim(),
      dob,
      gender,
      country,
      avatarUrl,
    });
    setIsSubmitting(false);

    if (result.success) {
      showToast('Profile updated successfully!', 'success');
    } else {
      setErrorMessage(result.error || 'Failed to update profile');
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-neutral-500 mb-4">Please log in to manage your profile.</p>
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
            Profile Settings
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Update your customer account details, regional residency, and contact information
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60">
            <div className="w-20 h-20 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-2xl overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 block mb-1">
                Profile Photo
              </span>
              <p className="text-xs text-neutral-400 mb-3">JPG, GIF or PNG. Max size of 2MB.</p>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                required
              />
            </div>
          </div>

          {/* Email (Read only) & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Email Address (Primary)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono"
                required
              />
            </div>
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Male', 'Female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      gender === g
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Country Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Country of Residence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_COUNTRIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCountry(c)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    country === c
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span>{c === 'Bangladesh' ? '🇧🇩' : c === 'India' ? '🇮🇳' : '🇵🇰'}</span>
                  <span>{c}</span>
                </button>
              ))}
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
              {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
