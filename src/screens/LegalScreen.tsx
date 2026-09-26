import React, { useState } from 'react';
import { Shield, FileText, Truck, ArrowLeft } from 'lucide-react';

interface LegalScreenProps {
  initialTab?: 'terms' | 'privacy' | 'cod-policy';
  onNavigate?: (route: string) => void;
}

export function LegalScreen({ initialTab = 'terms', onNavigate }: LegalScreenProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'cod-policy'>(initialTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {onNavigate && (
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-neutral-200/80 pb-4">
        <button
          onClick={() => setActiveTab('terms')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'terms'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'privacy'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('cod-policy')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cod-policy'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Cash on Delivery (COD) Policy</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-xs prose prose-neutral max-w-none text-neutral-700 text-xs sm:text-sm leading-relaxed">
        {activeTab === 'terms' && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-['Outfit',sans-serif] mb-4">
              Terms and Conditions of Service
            </h1>
            <p className="text-neutral-400 text-xs mb-6">Last updated: October 2026</p>

            <h3 className="text-base font-bold text-neutral-900 mt-6 mb-2">1. Scope of Operations</h3>
            <p>
              International Shop acts as a direct-to-consumer cross-border platform fulfilling authentic consumer electronics, personal tech, and computing hardware for residents of Bangladesh, India, and Pakistan.
            </p>

            <h3 className="text-base font-bold text-neutral-900 mt-6 mb-2">2. Pricing and Currency Calculations</h3>
            <p>
              Product baseline pricing is maintained in Bangladeshi Taka (BDT) and automatically calculated into Indian Rupee (INR) and Pakistani Rupee (PKR) at benchmark exchange rates. All prices shown in the customer storefront are final with import customs handling covered.
            </p>

            <h3 className="text-base font-bold text-neutral-900 mt-6 mb-2">3. Genuine Goods Warranty</h3>
            <p>
              All products sold on our platform are 100% brand new, authentic, and backed by international manufacturer warranty or our 7-day direct replacement guarantee for transit defects.
            </p>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-['Outfit',sans-serif] mb-4">
              Privacy Policy & Data Protection
            </h1>
            <p className="text-neutral-400 text-xs mb-6">Last updated: October 2026</p>

            <h3 className="text-base font-bold text-neutral-900 mt-6 mb-2">1. Information We Collect</h3>
            <p>
              When placing an international order, we collect delivery recipient names, mobile contact numbers, regional addresses (divisions, districts, provinces), and advance payment transaction identifiers to facilitate verification and customs transit.
            </p>

            <h3 className="text-base font-bold text-neutral-900 mt-6 mb-2">2. Security of Payment Proofs</h3>
            <p>
              Submitted payment receipts, transaction IDs, and sender numbers are strictly encrypted and used only for verifying genuine intent against our merchant accounts. We never sell or share customer contact data with third-party telemarketers.
            </p>
          </div>
        )}

        {activeTab === 'cod-policy' && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-['Outfit',sans-serif] mb-4">
              Advance Delivery Charge Cash on Delivery (COD) Policy
            </h1>
            <p className="text-neutral-400 text-xs mb-6">Last updated: October 2026</p>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs mb-6">
              <strong>Important Policy Rule: </strong>
              To prevent fraudulent bookings, fictitious addresses, and uncollected international air freight shipments, all Cash on Delivery orders require an advance payment of the minimal local delivery charge.
            </div>

            <h3 className="text-base font-bold text-neutral-900 mt-6 mb-2">1. Regional Delivery Charge Schedule</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li><strong>Bangladesh:</strong> ৳100 base advance fee (payable via bKash, Nagad, or Upay).</li>
              <li><strong>India:</strong> ₹150 base advance fee (payable via Binance Pay / USDT).</li>
              <li><strong>Pakistan:</strong> ₨450 base advance fee (payable via Binance Pay / USDT).</li>
            </ul>

            <h3 className="text-base font-bold text-neutral-900 mt-6 mb-2">2. Remaining Order Balance Collection</h3>
            <p>
              The entire product subtotal remains due only upon physical doorstep handover by the courier agent in the respective local currency cash.
            </p>

            <h3 className="text-base font-bold text-neutral-900 mt-6 mb-2">3. Verification & Dispatch Timeline</h3>
            <p>
              Upon order placement, your submitted Transaction ID is verified against our merchant ledger within 30-60 minutes. Once confirmed, the order moves to "Processing" and is cleared for air courier packaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
