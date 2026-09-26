import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Package,
  Heart,
  MapPin,
  Bell,
  Settings,
  KeyRound,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useWishlist } from '../../context/WishlistContext';

interface AccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export function AccountDropdown({ isOpen, onClose, onNavigate }: AccountDropdownProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { wishlistCount } = useWishlist();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleAction = (route: string) => {
    onClose();
    onNavigate(route);
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
    onNavigate('home');
  };

  const menuItems = [
    { label: 'My Account', icon: User, route: 'my-account' },
    { label: 'My Orders', icon: Package, route: 'my-orders' },
    { label: 'Wishlist', icon: Heart, route: 'wishlist', badge: wishlistCount > 0 ? wishlistCount : undefined },
    { label: 'Saved Addresses', icon: MapPin, route: 'saved-addresses' },
    { label: 'Notifications', icon: Bell, route: 'notifications', badge: unreadCount > 0 ? unreadCount : undefined },
    { label: 'Profile Settings', icon: Settings, route: 'profile-settings' },
    { label: 'Change Password', icon: KeyRound, route: 'change-password' },
    { label: 'Help & Support', icon: HelpCircle, route: 'help' },
  ];

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-neutral-200/80 py-3 z-50 overflow-hidden"
    >
      {/* Customer Header Info */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            user.fullName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-neutral-900 truncate font-['Outfit',sans-serif]">{user.fullName}</p>
          <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
          <span className="inline-block text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1">
            {user.country}
          </span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="py-2 px-1 max-h-80 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.route}
              onClick={() => handleAction(item.route)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50 hover:text-indigo-600 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <div className="pt-2 px-2 border-t border-neutral-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
}
