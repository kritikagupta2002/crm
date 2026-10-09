import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AppNotification } from '../types';
import { mobileStorage } from '../storage';
import { INITIAL_NOTIFICATIONS } from '../constants';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    let list = await mobileStorage.getNotifications();
    if (!list || list.length === 0 || !list.some((n) => n.id === 'alert-1')) {
      list = INITIAL_NOTIFICATIONS;
      await mobileStorage.setNotifications(list);
    }
    setNotifications(list);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAsRead = useCallback(async (id: string) => {
    const list = await mobileStorage.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      await mobileStorage.setNotifications(list);
      setNotifications([...list]);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const list = await mobileStorage.getNotifications();
    list.forEach((n) => (n.read = true));
    await mobileStorage.setNotifications(list);
    setNotifications([...list]);
  }, []);

  const addNotification = useCallback(async (title: string, message: string, type: AppNotification['type'] = 'info') => {
    const list = await mobileStorage.getNotifications();
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    list.unshift(newNotif);
    await mobileStorage.setNotifications(list);
    setNotifications([...list]);
  }, []);

  const value = useMemo<NotificationContextType>(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  }), [
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
