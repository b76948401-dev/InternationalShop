import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, User, Mail, Phone, Lock, Calendar, Globe2, ArrowRight, ChevronDown, Search, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SupportedCountry } from '../types';
import { COUNTRY_CURRENCIES, SUPPORTED_COUNTRIES } from '../config/countries';

interface RegisterScreenProps {
  onNavigate: (route: string) => void;
}

interface CountryOption {
  name: SupportedCountry;
  flag: string;
  phoneCode: string;
  code: string;
}

const AVAILABLE_COUNTRIES: CountryOption[] = [
  { name: 'Bangladesh', flag: '🇧🇩', phoneCode: '+880', code: 'BD' },
  { name: 'India', flag: '🇮🇳', phoneCode: '+91', code: 'IN' },
  { name: 'Pakistan', flag: '🇵🇰', phoneCode: '+92', code: 'PK' },
];

export function RegisterScreen({ onNavigate }: RegisterScreenProps) {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [country, setCountry] = useState<SupportedCountry>('Bangladesh');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileDigits, setMobileDigits] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('2000-01-01');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phoneCode = COUNTRY_CURRENCIES[country]?.phoneCode || '+880';
  const selectedCountryObj =
    AVAILABLE_COUNTRIES.find((c) => c.name === country) || AVAILABLE_COUNTRIES[0];

  const filteredCountries = AVAILABLE_COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.phoneCode.toLowerCase().includes(q) ||
      c.phoneCode.replace('+', '').includes(q)
    );
  });

  // Handle clicking outside country dropdown & Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsCountryOpen(false);
      }
    }
    if (isCountryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCountryOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validations
    if (!fullName.trim()) {
      setErrorMessage('Full Name is required');
      return;
    }
    if (!username.trim() || !/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      setErrorMessage('Username must be 3-20 alphanumeric characters or underscores');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please provide a valid email address');
      return;
    }
    if (!mobileDigits.trim() || mobileDigits.trim().length < 8) {
      setErrorMessage('Please enter a valid mobile number');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service to create an account');
      return;
    }

    const fullMobile = `${phoneCode}${mobileDigits.trim()}`;

    setIsSubmitting(true);
    const result = await register({
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      mobile: fullMobile,
      password,
      confirmPassword,
      dob,
      gender,
      country,
    });
    setIsSubmitting(false);

    if (result.success) {
      showToast('Account registered successfully! Welcome.', 'success');
      onNavigate('home');
    } else {
      setErrorMessage(result.error || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-200">
            <Globe2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            Create Customer Account
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Register for cross-border shopping in Bangladesh, India, or Pakistan
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country Selection */}
          <div className="relative" ref={countryDropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
              Select Your Country
            </label>
            <button
              type="button"
              id="country-select-dropdown-button"
              onClick={() => setIsCountryOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm bg-white transition-all text-left outline-hidden cursor-pointer ${
                isCountryOpen
                  ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-xs'
                  : 'border-neutral-200 hover:border-neutral-300 text-neutral-800'
              }`}
              aria-haspopup="listbox"
              aria-expanded={isCountryOpen}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl leading-none select-none">{selectedCountryObj.flag}</span>
                <span className="font-semibold text-neutral-900 truncate">{selectedCountryObj.name}</span>
                <span className="text-xs font-mono font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                  {selectedCountryObj.phoneCode}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${
                  isCountryOpen ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </button>

            {/* Searchable Country Dropdown Menu */}
            {isCountryOpen && (
              <div
                id="country-dropdown-menu"
                className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden py-2"
              >
                {/* Search Input */}
                <div className="px-3 pb-2 pt-1 border-b border-neutral-100">
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search country or code (e.g. BD, +91)..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:bg-white focus:border-indigo-600 outline-hidden transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Country List */}
                <div className="max-h-56 overflow-y-auto px-1 py-1 space-y-0.5">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((c) => {
                      const isSelected = country === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setCountry(c.name);
                            setIsCountryOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-900 font-semibold'
                              : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl leading-none select-none">{c.flag}</span>
                            <span className="truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono text-neutral-400">{c.phoneCode}</span>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      No country found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                  required
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. tanvir_01"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                  required
                />
                <span className="text-neutral-400 absolute left-3.5 top-2.5 font-mono text-sm">@</span>
              </div>
            </div>
          </div>

          {/* Email & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                  required
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Mobile Number
              </label>
              <div className="relative flex">
                <span
                  id="mobile-phone-code-badge"
                  className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-neutral-200 bg-neutral-100 text-xs font-bold text-neutral-700 select-none font-mono"
                >
                  {phoneCode}
                </span>
                <input
                  id="mobile-number-input"
                  type="tel"
                  value={mobileDigits}
                  onChange={(e) => setMobileDigits(e.target.value.replace(/\D/g, ''))}
                  placeholder={
                    country === 'Bangladesh'
                      ? '1712345678'
                      : country === 'India'
                      ? '9876543210'
                      : '3001234567'
                  }
                  className="w-full pl-3 pr-3 py-2.5 rounded-r-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                  required
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                  required
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden cursor-pointer"
                  required
                />
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
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
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
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

          {/* Terms checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 text-xs text-neutral-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 rounded-sm mt-0.5"
              />
              <span>
                I agree to the International Shop Terms of Service, Privacy Policy, and Cash on Delivery order verification rules.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}
