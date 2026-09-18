// /mobile/context/NotificationsContext.tsx
// Keeps the unread badge live while the app is in the foreground.
// Polls GET /api/notifications/unread-count every POLL_MS and immediately on
// foreground/resume. Cheap: one indexed COUNT query per poll.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { get, patch } from '../../shared/api-client';
import { API_ENDPOINTS } from '../../shared/constants';
import { ApiResponse, AppNotification } from '../../shared/types';
import { useAuth } from './AuthContext';

const POLL_MS = 15_000;

interface NotificationsContextValue {
  unreadCount: number;
  items: AppNotification[];
  loadingInbox: boolean;
  refreshCount: () => Promise<void>;
  loadInbox: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await get<ApiResponse<{ count: number }>>(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
      setUnreadCount(res.data.count);
    } catch {
      // Keep the last known count; a failed poll is not worth surfacing.
    }
  }, [isAuthenticated]);

  const loadInbox = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingInbox(true);
    try {
      const res = await get<ApiResponse<AppNotification[]>>(API_ENDPOINTS.NOTIFICATIONS);
      setItems(res.data);
      setUnreadCount(res.data.filter((n) => !n.readAt).length);
    } catch {
      // leave previous items
    } finally {
      setLoadingInbox(false);
    }
  }, [isAuthenticated]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await patch<ApiResponse<unknown>>(API_ENDPOINTS.NOTIFICATION_READ(id));
    } catch {
      // optimistic update stays; next poll corrects it
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnreadCount(0);
    try {
      await patch<ApiResponse<unknown>>(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
    } catch {
      // same as above
    }
  }, []);

  // Poll while foregrounded
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setItems([]);
      return;
    }
    void refreshCount();
    const start = () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => { void refreshCount(); }, POLL_MS);
    };
    const stop = () => {
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
    };
    start();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') { void refreshCount(); start(); } else { stop(); }
    });
    return () => { stop(); sub.remove(); };
  }, [isAuthenticated, refreshCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, items, loadingInbox, refreshCount, loadInbox, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
