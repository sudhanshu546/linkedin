import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { 
  getUserDetail, 
  getProfile, 
  getUserById, 
  getUserProfileById, 
  sendConnectionRequest, 
  getConnectionStatus,
  respondToConnectionRequest,
  cancelConnectionRequest,
  getUserPosts
} from '../api/userApi';
import '../App.css';

const ProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); 
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }
      const decoded = jwtDecode(token);
      const loggedInKeycloakId = decoded.sub;

      const effectiveUserId = userId || loggedInKeycloakId;
      const isOwn = effectiveUserId === loggedInKeycloakId;
      setIsOwnProfile(isOwn);

      let userRes;
      let profData;
      let posts;

      if (isOwn) {
        userRes = await getUserDetail();
        profData = await getProfile();
        posts = await getUserPosts(userRes.result.id);
      } else {
        userRes = await getUserById(effectiveUserId);
        const internalId = userRes.result.id;
        profData = await getUserProfileById(internalId);
        const status = await getConnectionStatus(internalId);
        setConnectionStatus(status);
        posts = await getUserPosts(internalId);
      }

      setUserDetails(userRes.result);
      setProfile(profData);
      setUserPosts(posts);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleAction = async (actionFunc, ...args) => {
    setActionLoading(true);
    try {
      await actionFunc(...args);
      toast.success('Action successful');
      fetchUserData(); // Refresh data
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-layout two-column-layout">
      <main className="profile-main">
        <div className="linkedin-card">
          <div className="profile-cover"></div>
          <div className="profile-avatar-wrap">
            <img src="https://via.placeholder.com/160" alt="Me" className="profile-main-avatar" />
          </div>
          <div className="profile-info-section">
            <h2>{userDetails?.firstName} {userDetails?.lastName}</h2>
            <p className="profile-headline">{profile?.headline || 'Member at LinkedIn Clone'}</p>
            <p className="author-designation">{profile?.city}, {profile?.state}</p>
            
            <div className="profile-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              {isOwnProfile ? (
                <Link to="/profile/edit" className="primary-button">Edit Profile</Link>
              ) : (
                <>
                  {connectionStatus?.status === 'NONE' && (
                    <button onClick={() => handleAction(sendConnectionRequest, userDetails.id)} className="primary-button" disabled={actionLoading}>Connect</button>
                  )}
                  {connectionStatus?.status === 'PENDING' && (
                    connectionStatus.isRequester ? 
                    <button onClick={() => handleAction(cancelConnectionRequest, connectionStatus.connectionId)} className="secondary-button" disabled={actionLoading}>Withdraw</button> :
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAction(respondToConnectionRequest, connectionStatus.connectionId, true)} className="primary-button" disabled={actionLoading}>Accept</button>
                        <button onClick={() => handleAction(respondToConnectionRequest, connectionStatus.connectionId, false)} className="secondary-button" disabled={actionLoading}>Ignore</button>
                    </div>
                  )}
                  {connectionStatus?.status === 'ACCEPTED' && <button className="primary-button">Message</button>}
                </>
              )}
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <div className="linkedin-card analytics-section">
            <div className="card-header">
              <h3>Analytics</h3>
              <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}><i className="fa fa-eye"></i> Private to you</p>
            </div>
            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '16px', gap: '16px' }}>
              <Link to="/profile-views" className="analytics-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h4 style={{ margin: 0, fontSize: '16px' }}>24</h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>Profile viewers</p>
              </Link>
              <div className="analytics-item">
                <h4 style={{ margin: 0, fontSize: '16px' }}>142</h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>Post impressions</p>
              </div>
              <div className="analytics-item">
                <h4 style={{ margin: 0, fontSize: '16px' }}>12</h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>Search appearances</p>
              </div>
            </div>
          </div>
        )}

        <div className="linkedin-card">
          <div className="card-header"><h3>About</h3></div>
          <div className="card-body"><p>{profile?.summary || 'No summary yet.'}</p></div>
        </div>

        <div className="linkedin-card">
          <div className="card-header"><h3>Activity</h3><p style={{ fontSize: '12px' }}>{userPosts.length} posts</p></div>
          <div className="card-body">
            {userPosts.map(post => (
              <div key={post.postId} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <p style={{ fontSize: '14px' }}>{post.content.substring(0, 150)}...</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <aside className="profile-sidebar">
        <div className="linkedin-card card-body">
          <h4>Profile Language</h4>
          <p style={{ fontSize: '14px', color: '#666' }}>English</p>
        </div>
        <div className="linkedin-card card-body">
          <h4>Public profile & URL</h4>
          <p style={{ fontSize: '12px', color: '#0a66c2' }}>linkedin.com/in/{userDetails?.firstName?.toLowerCase()}</p>
        </div>
      </aside>
    </div>
  );
};

export default ProfilePage;
