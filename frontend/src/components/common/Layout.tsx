import React from 'react';
import Navbar from '../Navbar';
import MessagingBar from '../MessagingBar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="app-container">
      <Navbar onLogout={onLogout} />
      <main className="layout-content">
        {children}
      </main>
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
