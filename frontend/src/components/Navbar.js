import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faUsers, 
  faBriefcase, 
  faCommentDots, 
  faBell, 
  faUser,
  faSearch,
  faCaretDown,
  faUserCircle,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import '../App.css';

const Navbar = ({ onLogout }) => {
  const [query, setQuery] = useState('');
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/';

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${query.trim()}`);
      setQuery('');
    }
  };

  return (
    <nav className="linkedin-navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/home" className="navbar-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" data-supported-dps="24x24" fill="#0a66c2" width="34" height="34">
              <path d="M20.5 2H3.5A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zm-1.5-9a2.25 2.25 0 112.25-2.25A2.25 2.25 0 016.5 10zm12 9h-3v-4.75c0-1.09-.23-2.34-1.75-2.34-1.57 0-2.21 1.05-2.21 2.37V19h-3v-9h2.91v1.32c.48-.92 1.34-1.74 2.91-1.74 2.11 0 3.84 1.29 3.84 4.84zm1-11a.75.75 0 11-.75-.75.75.75 0 01.75.75z"></path>
            </svg>
          </Link>
          <form onSubmit={handleSearchSubmit} className="navbar-search-refined">
            <FontAwesomeIcon icon={faSearch} style={{ color: '#666', fontSize: '14px' }} />
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>
        
        <div className="navbar-right">
          <Link to="/home" className="navbar-item">
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
            <div className="notif-icon-wrapper" style={{ position: 'relative' }}>
                <FontAwesomeIcon icon={faBell} size="lg" />
                {unreadCount > 0 && (
                    <span className="notif-badge" style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#d11124',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </div>
            <span>Notifications</span>
          </Link>

          <div className="navbar-item theme-toggle" onClick={toggleTheme}>
            <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} size="lg" />
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </div>
          
          <div className="navbar-item profile-dropdown-container">
            <div className="dropdown-trigger">
                {user?.profileImageUrl ? (
                    <img src={getImageUrl(user.profileImageUrl)} alt="Me" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    <FontAwesomeIcon icon={faUser} size="lg" />
                )}
                <div className="me-text-wrap">
                    <span>Me</span>
                    <FontAwesomeIcon icon={faCaretDown} />
                </div>
            </div>
            
            <div className="me-dropdown-refined">
              <div className="me-dropdown-header">
                <div className="notif-avatar-dropdown">
                    {user?.profileImageUrl ? (
                        <img src={getImageUrl(user.profileImageUrl)} alt="Me" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <FontAwesomeIcon icon={faUserCircle} size="3x" />
                    )}
                </div>
                <div className="header-info">
                    <h4>{user ? `${user.firstName} ${user.lastName}` : 'LinkedIn User'}</h4>
                    <p>Professional at LinkedIn Clone</p>
                </div>
              </div>
              <Link to="/profile" className="view-profile-btn-pill">View Profile</Link>
              
              <div className="dropdown-section-refined">
                <h5>Account</h5>
                <span className="dropdown-link-item">Settings & Privacy</span>
                <span className="dropdown-link-item">Help</span>
                <span className="dropdown-link-item">Language</span>
              </div>

              <div className="dropdown-section-refined">
                <h5>Manage</h5>
                <Link to="/profile" className="dropdown-link-item" style={{ textDecoration: 'none' }}>Posts & Activity</Link>
                <Link to="/jobs/manage" className="dropdown-link-item" style={{ textDecoration: 'none' }}>Job Posting Account</Link>
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
