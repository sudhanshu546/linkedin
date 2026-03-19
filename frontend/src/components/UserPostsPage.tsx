import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserById } from '../api/userApi';
import Feed from './pages/Feed/Feed';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const UserPostsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const userData = await getUserById(userId);
      setUser(userData.result);
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

  return (
    <div className="page-layout three-column-grid">
      {/* Left Column: Profile Summary */}
      <aside className="left-column">
        <div className="linkedin-card profile-mini-card">
          <div className="mini-card-cover"></div>
          <div className="mini-card-content">
            {user?.profileImageUrl ? (
                <img 
                    src={`${IMAGE_BASE_URL}${user.profileImageUrl}`} 
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
          <button onClick={() => navigate(-1)} className="back-btn-circle">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{user ? `${user.firstName}'s Activity` : 'Activity'}</h2>
        </header>
        
        <Feed userId={userId} />
      </main>

      {/* Right Column: News/Suggestions */}
      <aside className="right-column">
        <div className="linkedin-card news-card-wrapper">
          <h3 className="news-header">LinkedIn News</h3>
          <ul className="news-items-list">
            <li>
              <h4>Tech hiring picks up in 2026</h4>
              <span>2d ago • 12,456 readers</span>
            </li>
            <li>
              <h4>The future of AI-driven dev</h4>
              <span>1d ago • 8,902 readers</span>
            </li>
            <li>
              <h4>Networking in a remote world</h4>
              <span>3d ago • 5,612 readers</span>
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
