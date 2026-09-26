import React from 'react';
import { Globe2, ShieldCheck, Truck, Headphones, Award, CheckCircle2 } from 'lucide-react';

interface AboutUsScreenProps {
  onNavigate: (route: string) => void;
}

export function AboutUsScreen({ onNavigate }: AboutUsScreenProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-4">
          <Globe2 className="w-4 h-4" />
          <span>Cross-Border Direct Commerce</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 font-['Outfit',sans-serif] tracking-tight mb-4">
          Bringing Global Tech Directly to South Asia
        </h1>
        <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
          International Shop bridges consumers across Bangladesh, India, and Pakistan directly with genuine global manufacturers. No counterfeit stock, transparent localized pricing, and secure Cash on Delivery fulfillment.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif] mb-2">
            100% Genuine Guaranteed
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Every smartphone, camera, laptop, and audio accessory is sourced through authenticated international distributors with verifiable serial numbers.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif] mb-2">
            Regional Air Cargo Logistics
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Dedicated air corridors to Dhaka, Mumbai, Delhi, Lahore, and Karachi ensure speedy transit within 7 to 10 business days with end-to-end tracking.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif] mb-2">
            Advance Charge COD Model
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Eliminating customer risk: pay only the minimal local delivery charge online to confirm genuine intent, and settle the main order value in cash upon handover.
          </p>
        </div>
      </div>

      {/* Country Hubs */}
      <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] mb-4 text-center">
          Our Regional Fulfillment Network
        </h2>
        <p className="text-neutral-400 text-xs sm:text-sm text-center max-w-xl mx-auto mb-10">
          Local operations offices ensure customs clearance compliance and prompt last-mile doorstep courier dispatch.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
            <span className="text-xl mb-2 block">🇧🇩</span>
            <h4 className="font-bold text-white text-sm mb-1">Bangladesh Hub</h4>
            <p className="text-neutral-400">Banani C/A, Dhaka 1213</p>
            <p className="text-neutral-500 mt-1">Payment: bKash, Nagad, Upay</p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
            <span className="text-xl mb-2 block">🇮🇳</span>
            <h4 className="font-bold text-white text-sm mb-1">India Hub</h4>
            <p className="text-neutral-400">Bandra Kurla Complex, Mumbai 400051</p>
            <p className="text-neutral-500 mt-1">Payment: Binance Pay / USDT</p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60">
            <span className="text-xl mb-2 block">🇵🇰</span>
            <h4 className="font-bold text-white text-sm mb-1">Pakistan Hub</h4>
            <p className="text-neutral-400">Gulberg III, Lahore 54000</p>
            <p className="text-neutral-500 mt-1">Payment: Binance Pay / USDT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
