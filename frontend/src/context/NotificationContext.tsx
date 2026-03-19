import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './UserContext';
import { getAllNotifications, markNotificationAsRead } from '../api/notificationApi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';
import { Notification, NotificationContextType } from '../types';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getAllNotifications();
      const resData = Array.isArray(res) ? res : ((res as any)?.content || []);
      setNotifications(resData);
      setUnreadCount(resData.filter(n => n.isRead === false).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user || !user.id) return;

    const token = localStorage.getItem('accessToken');
    let wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:9191/ws';
    
    if (wsUrl.startsWith('ws:')) {
      wsUrl = 'http' + wsUrl.substring(2);
    } else if (wsUrl.startsWith('wss:')) {
      wsUrl = 'https' + wsUrl.substring(3);
    }
    
    if (token) {
        wsUrl += `?access_token=${token}`;
    }

    const socket = new SockJS(wsUrl);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      stompClient.subscribe(`/user/${user.id}/queue/notifications`, (message) => {
        const notification: Notification = JSON.parse(message.body);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.info(notification.message || 'New notification', {
            onClick: () => window.location.href = '/notifications'
        });
      });
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
