import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead } from '../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : (data.result || []));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifClick = async (notif) => {
    setSelectedNotif(notif);
    if (notif.status === 0) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, status: 1 } : n));
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-layout three-column-grid">
      {/* Column 1: Left Sidebar */}
      <aside className="left-column">
        <div className="linkedin-card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>Manage your Notifications</h3>
          <div style={{ fontSize: '14px', color: 'var(--linkedin-blue)', fontWeight: 600, cursor: 'pointer' }}>
            View Settings
          </div>
        </div>
      </aside>

      {/* Column 2: Middle (Notifications List) */}
      <main className="feed-column">
        <div className="linkedin-card">
          <div className="card-header">
            <h3>Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '48px' }}>
              <FontAwesomeIcon icon={faBell} size="3x" style={{ color: '#ccc', marginBottom: '16px' }} />
              <p>No new notifications.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${notif.status === 0 ? 'unread' : ''}`}
                  onClick={() => handleNotifClick(notif)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="notif-icon-circle">
                      <FontAwesomeIcon icon={faBell} />
                  </div>
                  <div className="notification-details" style={{ flex: 1, marginLeft: '12px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>{notif.heading}</strong>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--linkedin-text)' }}>{notif.notification}</p>
                    <span style={{ fontSize: '12px', color: 'var(--linkedin-secondary-text)', marginTop: '4px', display: 'inline-block' }}>
                      {new Date(notif.createdDate).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Column 3: Right Sidebar */}
      <aside className="right-column">
        <div className="linkedin-card" style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>LinkedIn News</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Real-time updates active</h4>
              <span style={{ fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>You are now receiving instant notifications.</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Detail Modal */}
      {selectedNotif && (
        <div className="modal-overlay" onClick={() => setSelectedNotif(null)}>
          <div className="linkedin-card modal-content-notif" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Notification Detail</h3>
              <button className="close-modal-btn" onClick={() => setSelectedNotif(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body-notif">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                <div className="notif-icon-circle-large">
                    <FontAwesomeIcon icon={faBell} size="lg" />
                </div>
                <div>
                    <h2 style={{ fontSize: '20px', margin: 0 }}>{selectedNotif.heading}</h2>
                    <p style={{ color: 'var(--linkedin-secondary-text)', fontSize: '14px' }}>{new Date(selectedNotif.createdDate).toLocaleString()}</p>
                </div>
              </div>
              <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{selectedNotif.notification}</p>
              
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary-round" onClick={() => setSelectedNotif(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
