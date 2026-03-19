import React from 'react';
import Navbar from '../Navbar';
import MessagingBar from '../MessagingBar';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="app-wrapper">
      <Navbar onLogout={onLogout} />
      <div className="main-content-area">
        {children}
      </div>
      <MessagingBar />
    </div>
  );
};

export default Layout;
