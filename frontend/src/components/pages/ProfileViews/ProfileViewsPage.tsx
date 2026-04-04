import React, { useState, useEffect } from 'react';
import { getProfileViews, getProfileViewTrends, getProfileDemographics } from '../../../api/profileApi';
import { getUserById } from '../../../api/userApi';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faChartLine, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import { User, ProfileDemographics } from '../../../types';
import { IMAGE_BASE_URL } from '../../../constants/api';

interface ProfileView {
  id: string;
  viewerId: string;
  viewedAt: string;
  viewer?: User;
  viewerDesignation?: string;
  viewerCompany?: string;
}

interface Trend {
  date: string;
  count: number;
}

const ProfileViewsPage: React.FC = () => {
  const [views, setViews] = useState<ProfileView[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [demographics, setDemographics] = useState<ProfileDemographics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [viewsRes, trendsRes, demoRes] = await Promise.all([
        getProfileViews(),
        getProfileViewTrends(),
        getProfileDemographics()
      ]);

      const viewsData = Array.isArray(viewsRes) ? viewsRes : (viewsRes as any)?.data || [];
      const trendsData = Array.isArray(trendsRes) ? trendsRes : (trendsRes as any)?.data || [];
      const demoData = (demoRes as any)?.data || demoRes || null;

      const viewsWithUsers = await Promise.all(
        (viewsData as ProfileView[]).map(async (view) => {
          if (!view || !view.viewerId) return null;
          try {
            const userRes = await getUserById(view.viewerId);
            return { ...view, viewer: userRes };
          } catch (err) {
            return { ...view, viewer: { id: view.viewerId, firstName: 'LinkedIn', lastName: 'Member' } as User };
          }
        })
      );
      setViews(viewsWithUsers.filter((v): v is ProfileView => v !== null));
      setTrends(trendsData);
      setDemographics(demoData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = (user?: User) => {
      if (user?.profileImageUrl) {
          return <img 
            src={`${IMAGE_BASE_URL}${user.profileImageUrl}`} 
            alt="" 
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
          />;
      }
      return <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ color: '#adb3b8' }} />;
  };

  const maxCount = Math.max(...trends.map(t => t.count), 1);

  if (loading) return (
    <div className="loading-container" style={{ textAlign: 'center', padding: '100px' }}>
      <div className="spinner"></div>
      <p>Loading insights...</p>
    </div>
  );

  return (
    <div className="page-layout two-column-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', maxWidth: '1128px', margin: '0 auto', padding: '24px' }}>
      <main className="profile-views-main">
        {/* Trends Chart */}
        <div className="linkedin-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: '#0a66c2', fontSize: '20px' }} />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Profile View Trends (Last 7 Days)</h3>
          </div>
          
          {trends.length > 0 ? (
            <div className="trends-chart" style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', padding: '0 10px', borderBottom: '1px solid #eee' }}>
              {trends.map((t, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    title={`${t.count} views on ${t.date}`}
                    style={{ 
                      width: '100%', 
                      height: `${(t.count / maxCount) * 100}%`, 
                      backgroundColor: '#0a66c2',
                      borderRadius: '4px 4px 0 0',
                      minHeight: t.count > 0 ? '4px' : '0',
                      transition: 'height 0.3s ease'
                    }} 
                  />
                  <span style={{ fontSize: '11px', marginTop: '12px', color: '#666', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <p>No trend data available for the last 7 days.</p>
            </div>
          )}
        </div>

        {/* Demographics Section */}
        <div className="linkedin-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <FontAwesomeIcon icon={faChartBar} style={{ color: '#0a66c2', fontSize: '20px' }} />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Where your viewers work & what they do</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h4 style={{ fontSize: '15px', marginBottom: '16px', color: '#666' }}>Top Companies</h4>
              {demographics?.companies && Object.keys(demographics.companies).length > 0 ? (
                Object.entries(demographics.companies)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 5)
                  .map(([company, count]) => (
                    <div key={company} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                        <span>{company}</span>
                        <span style={{ fontWeight: 600 }}>{count as number}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#f3f6f8', borderRadius: '4px' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${((count as number) / Math.max(views.length, 1)) * 100}%`, 
                          backgroundColor: '#0a66c2', 
                          borderRadius: '4px' 
                        }} />
                      </div>
                    </div>
                  ))
              ) : (
                <p style={{ fontSize: '13px', color: '#666' }}>No company data yet.</p>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '15px', marginBottom: '16px', color: '#666' }}>Top Job Titles</h4>
              {demographics?.titles && Object.keys(demographics.titles).length > 0 ? (
                Object.entries(demographics.titles)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 5)
                  .map(([title, count]) => (
                    <div key={title} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                        <span>{title}</span>
                        <span style={{ fontWeight: 600 }}>{count as number}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#f3f6f8', borderRadius: '4px' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${((count as number) / Math.max(views.length, 1)) * 100}%`, 
                          backgroundColor: '#0a66c2', 
                          borderRadius: '4px' 
                        }} />
                      </div>
                    </div>
                  ))
              ) : (
                <p style={{ fontSize: '13px', color: '#666' }}>No title data yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Viewers List */}
        <div className="linkedin-card">
          <div className="card-header" style={{ padding: '16px 24px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Who viewed your profile</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#0a66c2', fontWeight: 600 }}>{views.length} total views</p>
          </div>
          {views.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '64px', color: '#666' }}>
              <FontAwesomeIcon icon={faUserCircle} size="4x" style={{ opacity: 0.1, marginBottom: '16px' }} />
              <p>No one has viewed your profile yet.</p>
            </div>
          ) : (
            <div className="search-results-list">
              {views.map((view) => (
                <div key={view.id} className="result-card-item" style={{ display: 'flex', padding: '16px 24px', borderBottom: '1px solid #eee', gap: '12px', alignItems: 'center' }}>
                  {renderAvatar(view.viewer)}
                  <div style={{ flex: 1 }}>
                    {view.viewer ? (
                      <Link to={`/profile/${view.viewer.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h4 style={{ margin: 0, color: '#0a66c2', fontSize: '16px', fontWeight: 600 }}>{view.viewer.firstName} {view.viewer.lastName}</h4>
                      </Link>
                    ) : (
                      <h4 style={{ margin: 0, color: '#666', fontSize: '16px' }}>Unknown User</h4>
                    )}
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
                        Viewed on {new Date(view.viewedAt).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ alignSelf: 'center' }}>
                    {view.viewer && (
                        <Link to={`/profile/${view.viewer.id}`} className="btn-secondary-round" style={{ padding: '4px 16px', borderRadius: '20px', border: '1px solid #0a66c2', color: '#0a66c2', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
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
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Analytics Insights</h4>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                  Regularly updating your profile can increase your visibility to recruiters and peers by up to 40%.
              </p>
              <button className="btn-primary-round" style={{ width: '100%', marginTop: '16px', padding: '8px', borderRadius: '20px', border: 'none', backgroundColor: '#0a66c2', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  Improve Profile
              </button>
          </div>
      </aside>
    </div>
  );
};

export default ProfileViewsPage;
