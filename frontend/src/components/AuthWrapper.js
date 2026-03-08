import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import { ToastContainer, toast } from 'react-toastify';
import { getUserDetail } from '../api/userApi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const Layout = ({ children, onLogout }) => (
  <>
    <Navbar onLogout={onLogout} />
    <main>{children}</main>
    <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
  </>
);

const AuthWrapper = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const isAuthenticated = localStorage.getItem('accessToken');

  useEffect(() => {
    if (isAuthenticated) {
      getUserDetail().then(res => {
        if (res.result && res.result.id) {
          setUserId(res.result.id);
        }
      }).catch(err => console.error("Error fetching user for WS:", err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!userId) return;

    const client = new Client({
      brokerURL: 'ws://localhost:8700/ws', // For native WebSockets
      connectHeaders: {},
      debug: function (str) {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Fallback for browsers that don't support WebSockets
    client.webSocketFactory = () => {
      return new SockJS('http://localhost:8700/ws');
    };

    client.onConnect = (frame) => {
      const destination = `/user/${userId}/queue/notifications`;
      client.subscribe(destination, (message) => {
        const notification = JSON.parse(message.body);
        toast.info(notification.notification, {
            onClick: () => window.location.href = '/notifications'
        });
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message']);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [userId]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthWrapper;
