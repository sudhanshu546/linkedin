import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import MessagingBar from './MessagingBar';
import { ToastContainer } from 'react-toastify';
import { getUserDetail } from '../api/userApi';
// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs';

export const Layout = ({ children, onLogout }) => (
  <>
    <Navbar onLogout={onLogout} />
    <div className="layout-content">
        {children}
    </div>
    <MessagingBar />
    <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
  </>
);

const AuthWrapper = ({ children }) => {
  // const [userId, setUserId] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();
  
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (token) {
      getUserDetail()
        .then(res => {
          if (res && res.result && res.result.id) {
            // setUserId(res.result.id);
          }
          setIsVerifying(false);
        })
        .catch(err => {
          console.error("Auth verify failed:", err);
          setIsVerifying(false);
        });
    } else {
      setIsVerifying(false);
    }
  }, [token]);

  if (isVerifying) {
    return (
        <div className="loading-container">
            <div className="spinner"></div>
        </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AuthWrapper;
