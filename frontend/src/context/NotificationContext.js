import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import { getNotifications, markNotificationAsRead } from '../api/userApi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotifications();
      if (res) {
        // Handle both wrapped and unwrapped responses
        const resData = Array.isArray(res) ? res : (res.result || []);
        setNotifications(resData);
        // Map backend 'read' boolean to 'status' if needed, or just use 'read'
        // For compatibility with NotificationsPage.js, we'll use both or map it
        setUnreadCount(resData.filter(n => (n.status === 0) || (n.read === false)).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user || !user.id) return;

    let wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8081/ws';
    // SockJS requires http/https scheme, not ws/wss
    if (wsUrl.startsWith('ws:')) {
      wsUrl = 'http' + wsUrl.substring(2);
    } else if (wsUrl.startsWith('wss:')) {
      wsUrl = 'https' + wsUrl.substring(3);
    }

    const socket = new SockJS(wsUrl);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      // console.log('Connected: ' + frame);
      stompClient.subscribe(`/user/${user.id}/queue/notifications`, (message) => {
        const notification = JSON.parse(message.body);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.info(notification.message || notification.notification, {
            onClick: () => window.location.href = '/notifications'
        });
      });
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 1, read: true } : n));
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

export const useNotifications = () => useContext(NotificationContext);
