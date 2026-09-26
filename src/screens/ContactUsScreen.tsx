import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  CheckCircle2,
  Paperclip,
  X,
  AlertCircle,
  ArrowLeft,
  HelpCircle,
  Clock,
  ExternalLink,
  ImageIcon,
  Loader2,
  FileQuestion,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { SupportTicket } from '../types';

interface ContactUsScreenProps {
  onNavigate?: (route: string, param?: string) => void;
  initialCategory?: string;
}

const SUPPORT_CATEGORIES = [
  'Order Issue / Not Received',
  'Payment Verification (bKash / Nagad / Bank / Crypto)',
  'Courier & Delivery Tracking',
  'Damaged or Defective Item (Replacement)',
  'Account & Login Assistance',
  'Product Specification or Stock Inquiry',
  'General Feedback / Other',
];

export function ContactUsScreen({ onNavigate, initialCategory }: ContactUsScreenProps) {
  const { showToast } = useToast();
  const { user, activeCountry } = useAuth();

  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.mobile || '');
  const [category, setCategory] = useState(initialCategory || SUPPORT_CATEGORIES[0]);
  const [orderId, setOrderId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Screenshot upload state (OPTIONAL)
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [screenshotFileSize, setScreenshotFileSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  // Customer's submitted tickets history
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'tickets'>('form');

  // Keep form synced with logged in user details if available
  useEffect(() => {
    if (user) {
      if (!name) setName(user.fullName);
      if (!email) setEmail(user.email);
      if (!phone && user.mobile) setPhone(user.mobile);
    }
  }, [user]);

  // Load user tickets
  const loadTickets = async () => {
    if (!user?.email && !email) return;
    setIsLoadingTickets(true);
    try {
      const tickets = await dataService.getSupportMessages({ email: user?.email || email });
      setMyTickets(tickets);
    } catch {
      // ignore
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadTickets();
    }
  }, [user]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, JPEG, WEBP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Screenshot file size exceeds 5MB limit. Please upload a smaller image.', 'warning');
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setScreenshot(reader.result);
        setScreenshotFileName(file.name);
        setScreenshotFileSize(sizeFormatted);
        showToast('Screenshot attached. It will be sent with your support report.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotFileName(null);
    setScreenshotFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please provide your name.', 'warning');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showToast('Please provide a valid email address.', 'warning');
      return;
    }

    if (!message.trim()) {
      showToast('Please write your problem or message.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const computedSubject = subject.trim() || `${category} - Inquiry from ${name.trim()}`;

      const res = await dataService.submitSupportMessage({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        country: activeCountry,
        subject: computedSubject,
        category,
        message: message.trim(),
        screenshotUrl: screenshot || undefined,
        orderId: orderId.trim() || undefined,
      });

      if (res.success && res.ticket) {
        setSubmittedTicket(res.ticket);
        showToast('Support message submitted successfully! Our team is reviewing your report.', 'success');
        // Clear input form
        setMessage('');
        setSubject('');
        setOrderId('');
        handleRemoveScreenshot();
        loadTickets();
      } else {
        showToast(res.message || 'Submitted successfully', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit support message. Please check connection and retry.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Top Breadcrumb / Back button */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping</span>
        </button>
      )}

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Help & Support Center</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 font-['Outfit',sans-serif] tracking-tight mb-3">
          Customer Support & Problem Reporting
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
          Need assistance verifying an advance payment, tracking a courier dispatch, or reporting an issue with an item?
          Send a direct message below. You can optionally attach a screenshot to show the problem visually.
        </p>
      </div>

      {/* Tabs for customer if has tickets */}
      {myTickets.length > 0 && (
        <div className="flex items-center justify-center gap-3 mb-8 border-b border-neutral-200 pb-4">
          <button
            onClick={() => {
              setActiveTab('form');
              setSubmittedTicket(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Send Support Message
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tickets'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <span>My Submitted Reports</span>
            <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-mono">
              {myTickets.length}
            </span>
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      {activeTab === 'tickets' ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="font-bold text-base text-neutral-900 font-['Outfit',sans-serif]">
                Your Submitted Support Reports
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Track status and review messages sent to customer service
              </p>
            </div>
            <button
              onClick={() => setActiveTab('form')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              + New Message
            </button>
          </div>

          {isLoadingTickets ? (
            <div className="py-12 text-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              <p className="text-xs">Loading support tickets...</p>
            </div>
          ) : myTickets.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <FileQuestion className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
              <p className="text-xs">No previous support messages found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myTickets.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-mono font-bold">
                        #{t.ticketNumber}
                      </span>
                      <span className="font-semibold text-xs text-neutral-900">{t.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 whitespace-pre-wrap leading-relaxed">
                    {t.message}
                  </p>

                  {t.screenshotUrl && (
                    <div className="pt-2 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <a
                        href={t.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <span>View Attached Screenshot</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {t.orderId && (
                    <div className="text-[11px] text-neutral-400">
                      Order Reference: <span className="font-mono text-neutral-600">{t.orderId}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Help & Support Contact Details (Prompt Requirements 2 & 3) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Contact Email Card */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">
                  Help & Support Contact
                </div>
                <h3 className="font-bold text-neutral-900 text-sm font-['Outfit',sans-serif]">
                  Support Email
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Direct support inbox for tickets & verifications
                </p>
                <a
                  href="mailto:mdayunlhaque844@gmail.com"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mt-2 block break-all font-mono"
                >
                  mdayunlhaque844@gmail.com
                </a>
              </div>
            </div>

            {/* Phone Numbers Card (Show both phone numbers as requested) */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
                  Direct Phone Support
                </div>
                <h3 className="font-bold text-neutral-900 text-sm font-['Outfit',sans-serif]">
                  Support Phone Numbers
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Active customer helplines for phone & messaging
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:+8801856024163"
                      className="text-xs font-bold text-neutral-900 hover:text-indigo-600 font-mono"
                    >
                      +8801856024163
                    </a>
                    <a
                      href="https://wa.me/8801856024163"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200"
                    >
                      WhatsApp
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:+8801727764515"
                      className="text-xs font-bold text-neutral-900 hover:text-indigo-600 font-mono"
                    >
                      +8801727764515
                    </a>
                    <a
                      href="https://wa.me/8801727764515"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Card (Clean English version as requested) */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">
                  Office & Logistics
                </div>
                <h3 className="font-bold text-neutral-900 text-sm font-['Outfit',sans-serif]">
                  Physical Address
                </h3>
                <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                  Uttar Badda, Ali'r Mor, Purbachal 1, Dhaka 1212, Bangladesh
                </p>
              </div>
            </div>

            {/* Quick Assurance */}
            <div className="bg-neutral-900 text-neutral-300 p-5 rounded-3xl border border-neutral-800 text-xs leading-relaxed space-y-2.5">
              <div className="flex items-center gap-2 text-white font-semibold font-['Outfit',sans-serif]">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Response Time Commitment</span>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Support messages and reported problems are logged directly into our system.
                Payment verification inquiries are prioritized to ensure rapid order dispatch.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Support & Problem Reporting Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs">
            {submittedTicket ? (
              /* Success Confirmation Card */
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs mb-2">
                    Ticket #{submittedTicket.ticketNumber}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 font-['Outfit',sans-serif]">
                    Your Problem Report Has Been Received
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mt-2 leading-relaxed">
                    Thank you, <span className="font-semibold text-neutral-700">{submittedTicket.name}</span>.
                    Our support team has received your message and will follow up with you via{' '}
                    <span className="font-semibold text-neutral-700">{submittedTicket.email}</span>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left max-w-lg mx-auto text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-2 border-b border-neutral-200">
                    <span>Category: <strong className="text-neutral-700">{submittedTicket.category}</strong></span>
                    <span>Status: <strong className="text-indigo-600 uppercase font-bold">{submittedTicket.status}</strong></span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 block">Reported Message:</span>
                    <p className="text-neutral-700 mt-0.5 line-clamp-3 leading-relaxed">
                      {submittedTicket.message}
                    </p>
                  </div>
                  {submittedTicket.screenshotUrl && (
                    <div className="pt-2 border-t border-neutral-200 flex items-center gap-2 text-emerald-700 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Screenshot successfully attached to support report</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmittedTicket(null)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Submit Another Inquiry
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('home')}
                      className="px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Back to Shopping
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Support Message Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                    Send a Support Message
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Fill out the form below to report a problem or reach our support specialists directly.
                  </p>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden bg-neutral-50/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden bg-neutral-50/30"
                      required
                    />
                  </div>
                </div>

                {/* Phone & Order ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Phone / Mobile Number <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +880 1856-024163"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden bg-neutral-50/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Order Reference ID <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. ORD-17898912"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden bg-neutral-50/30"
                    />
                  </div>
                </div>

                {/* Problem Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Problem Category / Topic <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden bg-white cursor-pointer"
                  >
                    {SUPPORT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Subject / Summary <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your question or issue..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden bg-neutral-50/30"
                  />
                </div>

                {/* Problem Details / Message */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Problem Details or Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please explain the issue in detail (e.g. payment transaction details, tracking inquiries, product condition)..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-hidden bg-neutral-50/30 leading-relaxed"
                    required
                  />
                </div>

                {/* OPTIONAL SCREENSHOT UPLOAD SECTION */}
                <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Attach Screenshot</span>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600 text-[10px] font-semibold lowercase">
                        optional
                      </span>
                    </label>
                  </div>
                  <p className="text-[11px] text-neutral-500 mb-3">
                    If you want to show the problem visually, attach an error screenshot, payment slip, or parcel photo (PNG, JPG, WEBP, max 5MB).
                  </p>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    ref={fileInputRef}
                    onChange={handleScreenshotChange}
                    className="hidden"
                    id="support-screenshot-upload"
                  />

                  {screenshot ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-200 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={screenshot}
                          alt="Screenshot preview"
                          className="w-12 h-12 object-cover rounded-lg border border-neutral-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-800 truncate">
                            {screenshotFileName || 'Screenshot.png'}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            {screenshotFileSize || 'Image attached'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove screenshot"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="support-screenshot-upload"
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-neutral-300 hover:border-indigo-400 hover:bg-indigo-50/40 text-neutral-600 hover:text-indigo-600 text-xs font-semibold transition-all cursor-pointer bg-white"
                    >
                      <ImageIcon className="w-4 h-4 text-indigo-500" />
                      <span>Click to attach a screenshot (optional)</span>
                    </label>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Support Report...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Support Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
