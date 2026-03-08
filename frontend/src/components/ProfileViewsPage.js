import React, { useState, useEffect } from 'react';
import { getProfileViews, getUserByInternalId } from '../api/userApi';
import { Link } from 'react-router-dom';
import '../App.css';

const ProfileViewsPage = () => {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchViews();
  }, []);

  const fetchViews = async () => {
    setLoading(true);
    try {
      const data = await getProfileViews();
      const viewsWithUsers = await Promise.all(
        data.map(async (view) => {
          try {
            const userRes = await getUserByInternalId(view.viewerId);
            return { ...view, viewer: userRes.result };
          } catch (err) {
            return { ...view, viewer: { firstName: 'User', lastName: view.viewerId.substring(0,8) } };
          }
        })
      );
      setViews(viewsWithUsers);
    } catch (err) {
      console.error('Error fetching views:', err);
      setError('Failed to load profile views.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-container"><h2>Loading...</h2></div>;

  return (
    <div className="main-content network-page-layout">
      <div className="network-main-column">
        <div className="network-card">
          <div className="network-card-header">
            <h3>Who viewed your profile</h3>
          </div>
          {views.length === 0 ? (
            <p className="no-requests">No one has viewed your profile yet.</p>
          ) : (
            <div className="requests-list">
              {views.map((view) => (
                <div key={view.id} className="request-item">
                  <div className="sender-info">
                    <img src="https://via.placeholder.com/72" alt="Avatar" className="author-avatar" />
                    <div className="sender-details">
                      {view.viewer.keycloakUserId ? (
                        <Link to={`/profile/${view.viewer.keycloakUserId}`}>
                          <h4>{view.viewer.firstName} {view.viewer.lastName}</h4>
                        </Link>
                      ) : (
                        <h4>{view.viewer.firstName} {view.viewer.lastName}</h4>
                      )}
                      <p>Viewed on {new Date(view.viewedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileViewsPage;
