import React from 'react';
import Navbar from '../Navbar';
import MessagingBar from '../MessagingBar';
import { ToastContainer } from 'react-toastify';

const Layout = ({ children, onLogout }) => {
  return (
    <div className="app-container">
      <Navbar onLogout={onLogout} />
      <div className="layout-content">
        {children}
      </div>
      <MessagingBar />
      <ToastContainer 
        position="bottom-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="light"
      />
    </div>
  );
};

export default Layout;
