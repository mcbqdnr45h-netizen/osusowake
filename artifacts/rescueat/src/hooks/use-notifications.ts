import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authedFetch } from '@/lib/authed-fetch';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

export interface AppNotification {
  id: number;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  storeId: number | null;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await authedFetch(`${BASE}/api/notifications`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.warn('[use-notifications] fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const markRead = useCallback(async (id: number) => {
    if (!session?.access_token) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await authedFetch(`${BASE}/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.warn('[use-notifications] markRead failed', err);
    }
  }, [session?.access_token]);

  const markAllRead = useCallback(async () => {
    if (!session?.access_token) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await authedFetch(`${BASE}/api/notifications/read-all`, { method: 'PATCH' });
    } catch (err) {
      console.warn('[use-notifications] markAllRead failed', err);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead };
}
