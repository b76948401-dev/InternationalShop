import React, { useState } from 'react';
import { Bell, Check, CheckCheck, ArrowLeft, Package, Clock, ShieldAlert } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { EmptyState } from '../components/common/EmptyState';

interface NotificationsScreenProps {
  onNavigate: (route: string, param?: string) => void;
}

export function NotificationsScreen({ onNavigate }: NotificationsScreenProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    if (n.orderId) {
      onNavigate('order-details', n.orderId);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => onNavigate('my-account')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Account</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            Notifications
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time updates regarding your orders, proof verifications, and delivery statuses
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 transition-colors shadow-xs"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                !n.isRead
                  ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'order_status'
                    ? 'bg-indigo-100 text-indigo-600'
                    : n.type === 'delivery_verified'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {n.type === 'order_status' ? (
                  <Package className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-neutral-900 font-['Outfit',sans-serif]">
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-neutral-400 shrink-0">
                    {new Date(n.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{n.message}</p>
                {n.orderId && (
                  <span className="inline-block text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 mt-2">
                    View Order #{n.orderId} →
                  </span>
                )}
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description={
            filter === 'unread'
              ? "You've read all your notifications!"
              : 'You do not have any notifications yet.'
          }
        />
      )}
    </div>
  );
}
