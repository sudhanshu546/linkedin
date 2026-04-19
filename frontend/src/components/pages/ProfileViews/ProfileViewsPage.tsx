import React, { useState, useEffect, useCallback } from 'react';
import { getProfileViews, getProfileViewTrends, getProfileDemographics } from '../../../api/profileApi';
import { getUserById } from '../../../api/userApi';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faChartLine, faUserCircle, faCalendarAlt, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import '../../../App.css';
import { User, ProfileDemographics } from '../../../types';
import { IMAGE_BASE_URL } from '../../../constants/api';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [dateRange, setDateRange] = useState(7);

  const fetchData = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const [viewsRes, trendsRes, demoRes] = await Promise.all([
        getProfileViews(),
        getProfileViewTrends(days),
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
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [fetchData, dateRange]);

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

  const chartData = trends.map(t => ({
    name: new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    views: t.count
  }));

  const companyData = demographics?.companies ? 
    Object.entries(demographics.companies)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })) : [];

  const titleData = demographics?.titles ? 
    Object.entries(demographics.titles)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })) : [];

  if (loading && views.length === 0) return (
    <div className="loading-container" style={{ textAlign: 'center', padding: '100px' }}>
      <div className="spinner"></div>
      <p>Gathering your insights...</p>
    </div>
  );

  return (
    <div className="page-layout two-column-layout" style={{ maxWidth: '1128px', margin: '0 auto' }}>
      <main className="profile-views-main">
        {/* Trends Chart */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="linkedin-card" 
            style={{ padding: '24px', marginBottom: '16px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faChartLine} style={{ color: '#0a66c2', fontSize: '20px' }} />
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Profile View Trends</h3>
            </div>
            
            <div className="range-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#f9fafb' }}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#666', fontSize: '14px' }} />
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(Number(e.target.value))}
                style={{ border: 'none', background: 'none', fontSize: '14px', fontWeight: 600, color: '#666', cursor: 'pointer', outline: 'none' }}
              >
                <option value={7}>Past 7 Days</option>
                <option value={14}>Past 14 Days</option>
                <option value={30}>Past 30 Days</option>
                <option value={90}>Past 90 Days</option>
              </select>
            </div>
          </div>
          
          <div style={{ width: '100%', height: 280 }}>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0a66c2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0a66c2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#666' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#666' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0a66c2', fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#0a66c2" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#666', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <p>No trend data available for the selected range.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Demographics Section */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="linkedin-card" 
            style={{ padding: '24px', marginBottom: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <FontAwesomeIcon icon={faChartBar} style={{ color: '#0a66c2', fontSize: '20px' }} />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Viewer Demographics</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <h4 style={{ fontSize: '15px', marginBottom: '16px', color: '#666', fontWeight: 600 }}>Top Companies</h4>
              <div style={{ width: '100%', height: 220 }}>
                {companyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={companyData} margin={{ left: -10, right: 30 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fontWeight: 500 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1500}>
                        {companyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#0a66c2' : '#004182'} opacity={1 - (index * 0.15)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', padding: '40px' }}>No company data yet.</p>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '15px', marginBottom: '16px', color: '#666', fontWeight: 600 }}>Top Job Titles</h4>
              <div style={{ width: '100%', height: 220 }}>
                {titleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={titleData} margin={{ left: -10, right: 30 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fontWeight: 500 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1500}>
                        {titleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#0a66c2' : '#004182'} opacity={1 - (index * 0.15)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', padding: '40px' }}>No title data yet.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Viewers List */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="linkedin-card"
        >
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Who viewed your profile</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#0a66c2', fontWeight: 600 }}>{views.length} total views in this period</p>
          </div>
          {views.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '64px', color: '#666' }}>
              <FontAwesomeIcon icon={faUserCircle} size="4x" style={{ opacity: 0.1, marginBottom: '16px' }} />
              <p>No one has viewed your profile yet.</p>
            </div>
          ) : (
            <div className="search-results-list">
              <AnimatePresence>
              {views.map((view, idx) => (
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.05) }}
                    key={view.id} 
                    className="result-card-item" 
                    style={{ display: 'flex', padding: '16px 24px', borderBottom: '1px solid #eee', gap: '16px', alignItems: 'center' }}
                >
                  {renderAvatar(view.viewer)}
                  <div style={{ flex: 1 }}>
                    {view.viewer ? (
                      <Link to={`/profile/${view.viewer.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h4 style={{ margin: 0, color: 'rgba(0,0,0,0.9)', fontSize: '16px', fontWeight: 600 }}>{view.viewer.firstName} {view.viewer.lastName}</h4>
                      </Link>
                    ) : (
                      <h4 style={{ margin: 0, color: '#666', fontSize: '16px' }}>LinkedIn Member</h4>
                    )}
                    <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#666' }}>Professional at LinkedIn Clone</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
                        Viewed on {new Date(view.viewedAt).toLocaleDateString()} at {new Date(view.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div style={{ alignSelf: 'center' }}>
                    {view.viewer && (
                        <Link to={`/profile/${view.viewer.id}`} className="btn-secondary-round" style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #0a66c2', color: '#0a66c2', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                            View Profile
                        </Link>
                    )}
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <aside className="profile-views-sidebar">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="linkedin-card" 
            style={{ padding: '20px' }}
          >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FontAwesomeIcon icon={faLightbulb} style={{ color: '#f59e0b' }} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Analytics Insights</h4>
              </div>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                  Regularly updating your profile can increase your visibility to recruiters and peers by up to 40%.
              </p>
              <button className="btn-primary-round" style={{ width: '100%', marginTop: '16px', padding: '8px', borderRadius: '20px', border: 'none', backgroundColor: '#0a66c2', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  Improve Profile
              </button>
          </motion.div>
      </aside>
    </div>
  );
};

export default ProfileViewsPage;
