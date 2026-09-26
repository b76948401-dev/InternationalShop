import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  Heart,
  MapPin,
  Bell,
  Settings,
  KeyRound,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import { Order } from '../types';

interface MyAccountScreenProps {
  onNavigate: (route: string, param?: string) => void;
}

export function MyAccountScreen({ onNavigate }: MyAccountScreenProps) {
  const { user, token } = useAuth();
  const { wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const ct = res.headers.get('content-type');
          if (ct && ct.includes('application/json')) {
            const data = await res.json();
            setOrders(data.orders || []);
          }
        }
      } catch {
        // Graceful network error handling
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-neutral-500 mb-4">Please log in to view your customer account.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
        >
          Sign In
        </button>
      </div>
    );
  }

  const inTransitCount = orders.filter((o) => o.orderStatus === 'Processing' || o.orderStatus === 'Shipped').length;
  const completedCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-extrabold text-2xl overflow-hidden shrink-0 shadow-sm">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              user.fullName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
                {user.fullName}
              </h1>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                {user.country}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              @{user.username} • {user.email} • {user.mobile}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Customer Account</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('profile-settings')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div
          onClick={() => onNavigate('my-orders')}
          className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <Package className="w-5 h-5 group-hover:text-indigo-600 transition-colors" />
            <span className="text-xs font-semibold">All Time</span>
          </div>
          <div className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
            {orders.length}
          </div>
          <span className="text-xs text-neutral-500">Total Orders</span>
        </div>

        <div
          onClick={() => onNavigate('my-orders')}
          className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-semibold">Active</span>
          </div>
          <div className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
            {inTransitCount}
          </div>
          <span className="text-xs text-neutral-500">In Transit / Processing</span>
        </div>

        <div
          onClick={() => onNavigate('my-orders')}
          className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <Package className="w-5 h-5" />
            <span className="text-xs font-semibold">Delivered</span>
          </div>
          <div className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
            {completedCount}
          </div>
          <span className="text-xs text-neutral-500">Completed Orders</span>
        </div>

        <div
          onClick={() => onNavigate('wishlist')}
          className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <Heart className="w-5 h-5" />
            <span className="text-xs font-semibold">Saved</span>
          </div>
          <div className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
            {wishlistCount}
          </div>
          <span className="text-xs text-neutral-500">Wishlist Items</span>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Quick Actions Menu */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
          <h2 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif] mb-4">
            Account Management
          </h2>
          <div className="space-y-1">
            {[
              { label: 'My Orders', desc: 'Track, inspect & download invoices', icon: Package, route: 'my-orders' },
              { label: 'Saved Addresses', desc: 'Manage home & office delivery spots', icon: MapPin, route: 'saved-addresses' },
              { label: 'Notifications', desc: 'Order status & payment updates', icon: Bell, route: 'notifications', badge: unreadCount },
              { label: 'Profile Settings', desc: 'Personal details & avatar', icon: Settings, route: 'profile-settings' },
              { label: 'Change Password', desc: 'Update customer account security', icon: KeyRound, route: 'change-password' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.route}
                  onClick={() => onNavigate(item.route)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-neutral-900 group-hover:text-indigo-600 transition-colors block">
                        {item.label}
                      </span>
                      <span className="text-xs text-neutral-400">{item.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge ? (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {item.badge}
                      </span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Orders */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-base font-bold text-neutral-900 font-['Outfit',sans-serif]">
                Recent Orders
              </h2>
              <p className="text-xs text-neutral-500">Latest activity on your account</p>
            </div>
            <button
              onClick={() => onNavigate('my-orders')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              View All Orders →
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onNavigate('order-details', order.id)}
                  className="p-4 rounded-2xl border border-neutral-100 hover:border-indigo-200 hover:bg-neutral-50/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold font-mono text-neutral-800">{order.id}</span>
                    <span className="text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-600">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'} •{' '}
                        <span className="font-semibold text-neutral-900">
                          {order.currencySymbol}
                          {order.totalAmount.toLocaleString()}
                        </span>
                      </p>
                      <span className="text-[11px] text-neutral-400">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        order.orderStatus === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.orderStatus === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-6 text-center">
              You haven't placed any orders yet. When you place an order, it will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
