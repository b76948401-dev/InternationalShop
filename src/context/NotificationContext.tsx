import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    if (!token || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
          setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
        }
      } else if (res.status === 401 || res.status === 403) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      // Gracefully handle offline or network connectivity transitions
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000); // Check for updates every 15s
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
