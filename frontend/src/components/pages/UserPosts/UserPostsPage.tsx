import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserById } from '../../../api/userApi';
import Feed from '../Feed/Feed';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import { User } from '../../../types';

const UserPostsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const userData = await getUserById(userId);
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/';

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  return (
    <div className="page-layout three-column-grid">
      {/* Left Column: Profile Summary */}
      <aside className="left-column">
        <div className="linkedin-card profile-mini-card">
          <div className="mini-card-cover"></div>
          <div className="mini-card-content">
            {user?.profileImageUrl ? (
                <img 
                    src={getImageUrl(user.profileImageUrl) || ''} 
                    alt="Profile" 
                    className="mini-avatar-home"
                    style={{ objectFit: 'cover' }}
                />
            ) : (
                <FontAwesomeIcon icon={faUserCircle} className="mini-avatar-home" style={{ fontSize: '72px', color: '#adb3b8' }} />
            )}
            <Link to={`/profile/${userId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3 style={{ marginTop: '8px' }}>{user ? `${user.firstName} ${user.lastName}` : 'User Profile'}</h3>
            </Link>
            <p style={{ fontSize: '14px', color: 'var(--linkedin-secondary-text)', marginTop: '4px' }}>
              LinkedIn Member
            </p>
          </div>
          <div className="mini-card-stats" style={{ borderTop: '1px solid #eee', padding: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
              Viewing all activity for this professional profile.
            </div>
          </div>
        </div>
      </aside>

      {/* Middle Column: Posts Feed */}
      <main className="feed-column">
        <header className="page-header-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button onClick={() => navigate(-1)} className="back-btn-circle" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{user ? `${user.firstName}'s Activity` : 'Activity'}</h2>
        </header>
        
        <Feed userId={userId} />
      </main>

      {/* Right Column: News/Suggestions */}
      <aside className="right-column">
        <div className="linkedin-card news-card-wrapper" style={{ padding: '16px' }}>
          <h3 className="news-header" style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>LinkedIn News</h3>
          <ul className="news-items-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Tech hiring picks up in 2026</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>2d ago • 12,456 readers</span>
            </li>
            <li style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>The future of AI-driven dev</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>1d ago • 8,902 readers</span>
            </li>
            <li style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Networking in a remote world</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>3d ago • 5,612 readers</span>
            </li>
          </ul>
        </div>
        
        <div className="footer-links-mini" style={{ padding: '16px', fontSize: '12px', color: 'var(--linkedin-secondary-text)', textAlign: 'center' }}>
          <p>© 2026 LinkedIn Clone</p>
        </div>
      </aside>
    </div>
  );
};

export default UserPostsPage;
