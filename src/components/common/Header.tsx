import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe2,
  Search,
  Heart,
  ShoppingBag,
  Bell,
  User,
  Menu,
  X,
  Tag,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotifications } from '../../context/NotificationContext';
import { AccountDropdown } from './AccountDropdown';
import { SUPPORTED_COUNTRIES, COUNTRY_CURRENCIES } from '../../config/countries';
import { SupportedCountry, Product } from '../../types';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
}

export function Header({ currentRoute, onNavigate }: HeaderProps) {
  const { user, activeCountry, setActiveCountry } = useAuth();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Scroll detection for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search suggestions auto-fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchSuggestions((data.products || []).slice(0, 5));
          setIsSearching(true);
        }
      } catch {
        setSearchSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(false);
      setIsSearchOpenMobile(false);
      onNavigate('search', searchQuery.trim());
    }
  };

  const handleSelectSuggestion = (product: Product) => {
    setIsSearching(false);
    setIsSearchOpenMobile(false);
    setSearchQuery('');
    onNavigate('product-details', product.slug || product.id);
  };

  const navLinks = [
    { label: 'Home', route: 'home' },
    { label: 'All Products', route: 'all-products' },
    { label: 'Offers / Discounts', route: 'offers', icon: Tag },
    { label: 'Budget Finder', route: 'budget-finder', icon: SlidersHorizontal },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white transition-all duration-200 ${
        isScrolled ? 'shadow-sm border-b border-neutral-200/90' : 'border-b border-neutral-200/60'
      }`}
    >
      {/* Top Banner with Delivery & Country Notice */}
      <div className="bg-neutral-900 text-neutral-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Serving Bangladesh, India & Pakistan with Cash on Delivery & Express Courier</span>
          </div>

          {/* Active Country & Currency Selector */}
          <div className="relative" ref={countryDropdownRef}>
            <button
              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 font-medium text-white hover:text-indigo-300 transition-colors cursor-pointer py-0.5 px-2 rounded-md hover:bg-neutral-800"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{activeCountry}</span>
              <span className="text-neutral-400 text-[11px]">
                ({COUNTRY_CURRENCIES[activeCountry]?.code} {COUNTRY_CURRENCIES[activeCountry]?.symbol})
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            <AnimatePresence>
              {isCountryDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl py-1.5 min-w-[200px] z-50 text-xs"
                >
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Select Your Country
                  </div>
                  {SUPPORTED_COUNTRIES.map((c) => {
                    const cfg = COUNTRY_CURRENCIES[c];
                    const isSelected = c === activeCountry;
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          setActiveCountry(c);
                          setIsCountryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                          isSelected ? 'text-indigo-400 font-semibold bg-neutral-800/60' : 'text-neutral-200'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {c === 'Bangladesh' && '🇧🇩'}
                          {c === 'India' && '🇮🇳'}
                          {c === 'Pakistan' && '🇵🇰'}
                          {c}
                        </span>
                        <span className="text-neutral-400 font-mono">
                          {cfg.code} ({cfg.symbol})
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 lg:gap-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo (Brand visual) */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
              <Globe2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-xl sm:text-2xl text-neutral-900 tracking-tight font-['Outfit',sans-serif] block leading-none">
                International<span className="text-indigo-600">Shop</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Cross-Border Commerce
              </span>
            </div>
          </div>

          {/* Desktop Search Bar with Suggestions */}
          <div className="hidden md:flex flex-1 max-w-xl relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Search phones, laptops, audio, electronics, home..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchSuggestions.length > 0) setIsSearching(true);
                }}
                className="w-full pl-11 pr-24 py-2.5 rounded-full bg-neutral-100/90 hover:bg-neutral-100 focus:bg-white text-sm text-neutral-900 placeholder:text-neutral-400 border border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-hidden transition-all duration-200"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Search
              </button>
            </form>

            {/* Instant Suggestions Dropdown */}
            <AnimatePresence>
              {isSearching && searchSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-neutral-200/90 py-3 z-50 overflow-hidden"
                >
                  <div className="px-4 py-1 text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Products Matching "{searchQuery}"</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="mt-1 divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                    {searchSuggestions.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectSuggestion(product)}
                        className="p-3 hover:bg-neutral-50 flex items-center gap-3 cursor-pointer transition-colors"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{product.name}</p>
                          <p className="text-xs text-neutral-500">{product.category}</p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">
                          {COUNTRY_CURRENCIES[activeCountry]?.symbol}
                          {Math.round(product.basePriceBDT * (COUNTRY_CURRENCIES[activeCountry]?.exchangeRateFromBDT || 1)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 bg-neutral-50 border-t border-neutral-100 text-center">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      View all search results →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Action Icons: Wishlist, Cart, Notifications, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpenMobile((prev) => !prev)}
              className="md:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="Open search bar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="relative p-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="View Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Notifications Button (for logged-in customer) */}
            {user && (
              <button
                onClick={() => onNavigate('notifications')}
                className="relative p-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="View Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-neutral-900 text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile / Account Trigger */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-neutral-200 hover:border-indigo-300 hover:bg-neutral-50 transition-all cursor-pointer"
                  aria-label="Open customer account menu"
                >
                  <span className="text-xs font-bold text-neutral-800 max-w-[90px] truncate hidden sm:inline">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      user.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Customer Account Dropdown */}
              <AccountDropdown
                isOpen={isAccountMenuOpen}
                onClose={() => setIsAccountMenuOpen(false)}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        <AnimatePresence>
          {isSearchOpenMobile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden pb-3"
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-neutral-100 text-sm text-neutral-900 border border-neutral-200 outline-hidden focus:border-indigo-600"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Go
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Secondary Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-8 py-2.5 border-t border-neutral-100 text-sm font-medium text-neutral-600">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.route;
            const Icon = link.icon;
            return (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                className={`flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer ${
                  isActive ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{link.label}</span>
              </button>
            );
          })}

          {user && (
            <button
              onClick={() => onNavigate('my-orders')}
              className={`hover:text-indigo-600 transition-colors ml-auto cursor-pointer ${
                currentRoute === 'my-orders' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              My Orders
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed top-0 bottom-0 left-0 w-4/5 max-w-sm bg-white z-50 shadow-2xl p-6 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-lg text-neutral-900 font-['Outfit',sans-serif]">
                    InternationalShop
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-6 flex flex-col gap-2 flex-1 overflow-y-auto">
                {navLinks.map((link) => (
                  <button
                    key={link.route}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate(link.route);
                    }}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-semibold transition-colors ${
                      currentRoute === link.route
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {link.icon && <link.icon className="w-4 h-4" />}
                    <span>{link.label}</span>
                  </button>
                ))}

                {user && (
                  <>
                    <div className="my-2 border-t border-neutral-100 pt-2 text-xs font-bold uppercase text-neutral-400 px-3">
                      My Account
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigate('my-account');
                      }}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <User className="w-4 h-4 text-neutral-400" />
                      <span>Account Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigate('my-orders');
                      }}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <ShoppingBag className="w-4 h-4 text-neutral-400" />
                      <span>My Orders</span>
                    </button>
                  </>
                )}
              </div>

              {/* Footer in Drawer */}
              <div className="pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-400 text-center">
                  International Shop © 2026. All rights reserved.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
