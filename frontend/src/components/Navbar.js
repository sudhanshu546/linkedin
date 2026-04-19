import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faUsers, 
  faBriefcase, 
  faCommentDots, 
  faBell, 
  faUserCircle, 
  faSearch,
  faCaretDown,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import '../App.css';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useUser();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/';

  return (
    <nav className="linkedin-navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" style={{ color: '#0a66c2', fontSize: '32px', marginRight: '8px' }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="currentColor">
                    <path d="M19.47 10a2.24 2.24 0 0 1 2.24 2.24V20a2.24 2.24 0 0 1-2.24 2.24H12.24A2.24 2.24 0 0 1 10 20v-7.76A2.24 2.24 0 0 1 12.24 10h7.23zM14.07 18.57h-1.92v-5.63h1.92v5.63zm-.96-6.42a1.11 1.11 0 1 0 0-2.22 1.11 1.11 0 0 0 0 2.22zm7.25 6.42h-1.92v-3.03c0-.72-.01-1.65-1-1.65s-1.16.79-1.16 1.6v3.08h-1.92v-5.63h1.84v.77h.03c.26-.49.88-1 1.83-1 1.95 0 2.31 1.29 2.31 2.96v2.9z"></path>
                </svg>
            </motion.div>
          </Link>
          <div className="navbar-search-refined">
            <FontAwesomeIcon icon={faSearch} style={{ color: '#666' }} />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        <div className="navbar-right">
          <Link to="/" className="navbar-item">
            <FontAwesomeIcon icon={faHome} size="lg" />
            <span>Home</span>
          </Link>
          <Link to="/mynetwork" className="navbar-item">
            <FontAwesomeIcon icon={faUsers} size="lg" />
            <span>My Network</span>
          </Link>
          <Link to="/jobs" className="navbar-item">
            <FontAwesomeIcon icon={faBriefcase} size="lg" />
            <span>Jobs</span>
          </Link>
          <Link to="/messaging" className="navbar-item">
            <FontAwesomeIcon icon={faCommentDots} size="lg" />
            <span>Messaging</span>
          </Link>
          <Link to="/notifications" className="navbar-item">
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon icon={faBell} size="lg" />
              {unreadCount > 0 && (
                <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="notif-badge" 
                    style={{ position: 'absolute', top: '-5px', right: '-8px', background: '#d11124', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '10px', fontWeight: 600 }}
                >
                    {unreadCount}
                </motion.span>
              )}
            </div>
            <span>Notifications</span>
          </Link>

          <div className="profile-dropdown-container">
            <div className="navbar-item">
              {user?.profileImageUrl ? (
                  <img 
                    src={`${IMAGE_BASE_URL}${user.profileImageUrl}`} 
                    alt="Me" 
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
              ) : (
                  <FontAwesomeIcon icon={faUserCircle} size="lg" />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Me</span>
                <FontAwesomeIcon icon={faCaretDown} size="xs" />
              </div>
            </div>
            
            <div className="me-dropdown-refined">
              <div className="me-dropdown-header">
                {user?.profileImageUrl ? (
                    <img 
                        src={`${IMAGE_BASE_URL}${user.profileImageUrl}`} 
                        alt="Me" 
                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                ) : (
                    <div className="notif-avatar-dropdown">
                        <FontAwesomeIcon icon={faUserCircle} size="3x" />
                    </div>
                )}
                <div className="header-info">
                  <h4>{user ? `${user.firstName} ${user.lastName}` : 'LinkedIn User'}</h4>
                  <p>Professional at LinkedIn Clone</p>
                </div>
              </div>
              <Link to="/profile" className="view-profile-btn-pill">View Profile</Link>
              
              <div className="dropdown-section-refined">
                <h5>Account</h5>
                <div className="dropdown-link-item" onClick={toggleTheme}>
                   <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} style={{ marginRight: '8px' }} />
                   {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </div>
                <Link to="/settings" className="dropdown-link-item">Settings & Privacy</Link>
                <Link to="/help" className="dropdown-link-item">Help</Link>
              </div>

              <div className="dropdown-section-refined">
                <h5>Manage</h5>
                <Link to="/job-management" className="dropdown-link-item">Posts & Activity</Link>
                <Link to="/jobs/post" className="dropdown-link-item">Job Posting Account</Link>
              </div>

              <div className="sign-out-footer">
                <button onClick={onLogout} className="btn-sign-out-subtle">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
