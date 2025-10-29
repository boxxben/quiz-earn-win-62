import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification, Announcement } from '@/types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  announcements: Announcement[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create a default context value for fallback
const defaultContextValue: NotificationContextType = {
  notifications: [],
  announcements: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  createAnnouncement: () => {},
};

// Mock initial notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to Quiz2cash!',
    message: 'Start playing quizzes and earning money today',
    type: 'system',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: 'New Quiz Available!',
    message: 'General Knowledge Quiz with ₦5,000 prize pool is now live',
    type: 'quiz',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  }
];

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Platform Maintenance',
    message: 'The platform will be under maintenance on Sunday from 2AM to 4AM',
    type: 'warning',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdBy: 'admin'
  }
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);

  // Load notifications from localStorage on mount (only after auth hydration)
  useEffect(() => {
    if (hydrated && user) {
      const saved = localStorage.getItem(`notifications_${user.id}`);
      if (saved) {
        try {
          const parsedNotifications = JSON.parse(saved);
          // Convert createdAt strings back to Date objects
          const notificationsWithDates = parsedNotifications.map((notification: any) => ({
            ...notification,
            createdAt: new Date(notification.createdAt)
          }));
          setNotifications(notificationsWithDates);
        } catch (error) {
          console.error('Failed to parse notifications from localStorage:', error);
          // If parsing fails, reset to default notifications
          setNotifications(mockNotifications);
        }
      }
    }
  }, [user, hydrated]);

  // Save notifications to localStorage when they change (only if user exists)
  useEffect(() => {
    if (hydrated && user) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user, hydrated]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const createAnnouncement = (announcement: Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: Date.now().toString(),
      createdAt: new Date(),
      createdBy: user?.id || 'admin'
    };
    
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    
    // Create notification for all users
    addNotification({
      title: announcement.title,
      message: announcement.message,
      type: 'announcement',
      isRead: false,
    });
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      announcements,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      createAnnouncement
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    // Instead of throwing an error immediately, return default values
    // This prevents the app from crashing during initialization
    console.warn('useNotifications called outside NotificationProvider, using defaults');
    return defaultContextValue;
  }
  return context;
}