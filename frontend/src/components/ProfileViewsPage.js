import React, { useState, useEffect } from 'react';
import { getProfileViews, getUserByInternalId, getProfileViewTrends } from '../api/userApi';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const ProfileViewsPage = () => {
  const [views, setViews] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [viewsData, trendsData] = await Promise.all([
        getProfileViews(),
        getProfileViewTrends()
      ]);

      const viewsWithUsers = await Promise.all(
        viewsData.map(async (view) => {
          try {
            const userRes = await getUserByInternalId(view.viewerId);
            return { ...view, viewer: userRes.result };
          } catch (err) {
            return { ...view, viewer: { firstName: 'User', lastName: view.viewerId.substring(0,8) } };
          }
        })
      );
      setViews(viewsWithUsers);
      setTrends(trendsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...trends.map(t => t.count), 1);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-layout two-column-layout">
      <main className="profile-views-main">
        {/* Trends Chart */}
        <div className="linkedin-card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: 'var(--linkedin-blue)' }} />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Profile View Trends (Last 7 Days)</h3>
          </div>
          
          {trends.length > 0 ? (
            <div className="trends-chart" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '150px', padding: '0 10px' }}>
              {trends.map((t, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    title={`${t.count} views on ${t.date}`}
                    style={{ 
                      width: '100%', 
                      height: `${(t.count / maxCount) * 100}%`, 
                      backgroundColor: 'var(--linkedin-blue)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: t.count > 0 ? '4px' : '0'
                    }} 
                  />
                  <span style={{ fontSize: '10px', marginTop: '8px', color: '#666', whiteSpace: 'nowrap' }}>
                    {new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No trend data available for the last 7 days.</p>
          )}
        </div>

        {/* Viewers List */}
        <div className="linkedin-card">
          <div className="card-header">
            <h3>Who viewed your profile</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>{views.length} total views</p>
          </div>
          {views.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '48px' }}>
              <p>No one has viewed your profile yet.</p>
            </div>
          ) : (
            <div className="search-results-list">
              {views.map((view) => (
                <div key={view.id} className="result-card-item">
                  <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ color: '#adb3b8' }} />
                  <div style={{ marginLeft: '12px', flex: 1 }}>
                    {view.viewer.keycloakUserId ? (
                      <Link to={`/profile/${view.viewer.keycloakUserId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h4 style={{ margin: 0, color: 'var(--linkedin-blue)', fontSize: '16px' }}>{view.viewer.firstName} {view.viewer.lastName}</h4>
                      </Link>
                    ) : (
                      <h4 style={{ margin: 0, color: 'var(--linkedin-blue)', fontSize: '16px' }}>{view.viewer.firstName} {view.viewer.lastName}</h4>
                    )}
                    <p style={{ margin: '2px 0', fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
                        Viewed on {new Date(view.viewedAt).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ alignSelf: 'center' }}>
                    {view.viewer.keycloakUserId && (
                        <Link to={`/profile/${view.viewer.keycloakUserId}`} className="btn-secondary-round">
                            View Profile
                        </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <aside className="profile-views-sidebar">
          <div className="linkedin-card" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Analytics Insights</h4>
              <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                  Regularly updating your profile can increase your visibility to recruiters and peers by up to 40%.
              </p>
          </div>
      </aside>
    </div>
  );
};

export default ProfileViewsPage;
