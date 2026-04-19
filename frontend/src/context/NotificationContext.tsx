import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from './UserContext';
import { getAllNotifications, markNotificationAsRead, markAllAsRead as apiMarkAllAsRead } from '../api/notificationApi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { toast } from 'react-toastify';
import { Notification, NotificationContextType } from '../types';
import { WS_BASE_URL } from '../constants/api';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: notifications = [], refetch: fetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await getAllNotifications();
      return Array.isArray(res) ? res : ((res as any)?.data || (res as any)?.content || []);
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n: Notification) => n.isRead === false).length;

  useEffect(() => {
    if (!user || !user.id) return;

    const token = localStorage.getItem('accessToken');
    let wsUrl = WS_BASE_URL;
    
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
        
        // Update Query Cache
        queryClient.setQueryData(['notifications'], (old: Notification[] = []) => [notification, ...old]);
        
        toast.info(notification.message || 'New notification', {
            onClick: () => window.location.href = '/notifications'
        });
      });
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications'], (old: Notification[] = []) => 
        old.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiMarkAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old: Notification[] = []) => 
        old.map(n => ({ ...n, isRead: true }))
      );
    }
  });

  const markAsRead = async (id: string) => {
    markReadMutation.mutate(id);
  };

  const markAllAsReadContext = async () => {
    markAllReadMutation.mutate();
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      fetchNotifications: async () => { await fetchNotifications(); }, 
      markAllAsRead: markAllAsReadContext 
    }}>
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
