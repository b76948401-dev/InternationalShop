import React from 'react';
import { Globe2, ShieldCheck, Truck, Headphones, RotateCcw, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { COUNTRY_CURRENCIES } from '../../config/countries';

interface FooterProps {
  onNavigate: (route: string, param?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { activeCountry } = useAuth();
  const config = COUNTRY_CURRENCIES[activeCountry];

  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-12 border-t border-neutral-800">
      {/* Trust & Service Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-neutral-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm font-['Outfit',sans-serif]">Secure Payments</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Encrypted transactions, verified mobile banking (bKash/Nagad/Upay), and Binance Pay security.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm font-['Outfit',sans-serif]">Reliable Express Delivery</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Fast courier dispatch covering all 64 districts of Bangladesh, India, and Pakistan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm font-['Outfit',sans-serif]">Easy Replacements</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Hassle-free 7-day inspection and replacement for verified manufacturing defects.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm font-['Outfit',sans-serif]">Dedicated Customer Support</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Real human assistance for order tracking, payment verifications, and warranty inquiries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-800 text-sm">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Globe2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white font-['Outfit',sans-serif] tracking-tight">
                International<span className="text-indigo-400">Shop</span>
              </span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm mb-5">
              The premier cross-border shopping destination designed specifically for Bangladesh, India, and Pakistan.
              Enjoy transparent localized pricing, dedicated Cash on Delivery options, and verified international brands.
            </p>
            <div className="flex flex-col gap-3 text-xs text-neutral-300">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-neutral-400 block text-[11px] font-medium">Help & Support Email:</span>
                  <a
                    href="mailto:mdayunlhaque844@gmail.com"
                    className="text-white hover:text-indigo-400 transition-colors font-medium break-all"
                  >
                    mdayunlhaque844@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-neutral-400 block text-[11px] font-medium">Phone Numbers:</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-neutral-200">
                    <a href="tel:+8801856024163" className="hover:text-white transition-colors">
                      +8801856024163
                    </a>
                    <span className="text-neutral-600 hidden sm:inline">•</span>
                    <a href="tel:+8801727764515" className="hover:text-white transition-colors">
                      +8801727764515
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-neutral-400 block text-[11px] font-medium">Address:</span>
                  <span className="text-neutral-300 leading-relaxed">
                    Uttar Badda, Ali'r Mor, Purbachal 1, Dhaka 1212, Bangladesh
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm font-['Outfit',sans-serif]">Customer Service</h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button onClick={() => onNavigate('help')} className="hover:text-white transition-colors">
                  Help & Support Center
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('help')} className="hover:text-white transition-colors">
                  Cash on Delivery Guide
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('help')} className="hover:text-white transition-colors">
                  Delivery Charge Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('help')} className="hover:text-white transition-colors">
                  Returns & Replacements
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('help')} className="hover:text-white transition-colors">
                  Payment Verification FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Shop Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm font-['Outfit',sans-serif]">Shop Catalog</h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button onClick={() => onNavigate('all-products')} className="hover:text-white transition-colors">
                  All Products
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('offers')} className="hover:text-white transition-colors">
                  Special Offers & Discounts
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('budget-finder')} className="hover:text-white transition-colors">
                  Budget Product Finder
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-products', 'Audio & Gadgets')} className="hover:text-white transition-colors">
                  Audio & Headphones
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('all-products', 'Computers & Laptops')} className="hover:text-white transition-colors">
                  Laptops & Computers
                </button>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm font-['Outfit',sans-serif]">Customer Account</h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button onClick={() => onNavigate('my-account')} className="hover:text-white transition-colors">
                  My Profile & Settings
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-orders')} className="hover:text-white transition-colors">
                  Track Your Orders
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('wishlist')} className="hover:text-white transition-colors">
                  My Wishlist
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('saved-addresses')} className="hover:text-white transition-colors">
                  Saved Delivery Addresses
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('notifications')} className="hover:text-white transition-colors">
                  Order Notifications
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Supported Countries */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            © {new Date().getFullYear()} International Shop Inc. All rights reserved. English-only customer interface.
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Operating in:</span>
            <span className="text-neutral-200">Bangladesh 🇧🇩</span>
            <span>•</span>
            <span className="text-neutral-200">India 🇮🇳</span>
            <span>•</span>
            <span className="text-neutral-200">Pakistan 🇵🇰</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
