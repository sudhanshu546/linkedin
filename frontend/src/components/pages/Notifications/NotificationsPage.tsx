import React, { useState } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import { Notification } from '../../../types';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const handleNotifClick = async (notif: Notification) => {
    setSelectedNotif(notif);
    if (!notif.read) {
      markAsRead(notif.id);
    }
  };

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
          <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Notifications</h3>
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
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleNotifClick(notif)}
                  style={{ cursor: 'pointer', padding: '16px', borderBottom: '1px solid #eee', display: 'flex', gap: '12px' }}
                >
                  <div className="notif-icon-circle" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f3f2ef', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
                      <FontAwesomeIcon icon={faBell} />
                  </div>
                  <div className="notification-details" style={{ flex: 1 }}>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                      {notif.type.replace('_', ' ')}
                    </strong>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--linkedin-text)' }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: '12px', color: 'var(--linkedin-secondary-text)', marginTop: '4px', display: 'inline-block' }}>
                      {new Date(notif.createdAt).toLocaleString()}
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
        <div className="modal-overlay" onClick={() => setSelectedNotif(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="linkedin-card modal-content-notif" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Notification Detail</h3>
              <button className="close-modal-btn" onClick={() => setSelectedNotif(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body-notif" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                <div className="notif-icon-circle-large" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f3f2ef', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0a66c2' }}>
                    <FontAwesomeIcon icon={faBell} size="lg" />
                </div>
                <div>
                    <h2 style={{ fontSize: '20px', margin: 0 }}>
                      {selectedNotif.type.replace('_', ' ')}
                    </h2>
                    <p style={{ color: 'var(--linkedin-secondary-text)', fontSize: '14px', margin: '4px 0 0' }}>
                      {new Date(selectedNotif.createdAt).toLocaleString()}
                    </p>
                </div>
              </div>
              <p style={{ fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
                {selectedNotif.message}
              </p>
              
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary-round" onClick={() => setSelectedNotif(null)} style={{ padding: '8px 24px', backgroundColor: '#0a66c2', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
