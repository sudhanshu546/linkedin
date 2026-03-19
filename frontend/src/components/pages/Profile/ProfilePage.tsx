import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faCamera, faPencilAlt, faMapMarkerAlt, faBriefcase, faGraduationCap, faUsers } from '@fortawesome/free-solid-svg-icons';
import { 
  getAuthenticatedUser, 
  getUserById, 
} from '../../../api/userApi';
import {
  getMyProfile,
  getProfileByUserId,
  sendConnectionRequest,
  getConnectionStatus,
  respondToConnectionRequest,
  cancelConnectionRequest,
  getUserPosts,
  getProfileViewCount,
  updateCoverImage,
} from '../../../api/profileApi';
import Feed from '../Feed/Feed';
import '../../../App.css';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCount, setViewCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null); 
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }
      const decoded: any = jwtDecode(token);
      const loggedInKeycloakId = decoded.sub;

      const isOwn = !userId || userId === loggedInKeycloakId;
      setIsOwnProfile(isOwn);

      const effectiveKeycloakId = userId || loggedInKeycloakId;

      let userData: any;
      let profData: any;
      let posts: any[] = [];

      if (isOwn) {
        userData = await getAuthenticatedUser();
        const internalId = userData.id;
        profData = await getMyProfile();
        
        try {
            const postsRes = await getUserPosts(internalId);
            posts = postsRes?.content || (Array.isArray(postsRes) ? postsRes : []);
        } catch (e) {
            console.error("Error fetching posts:", e);
        }

        try {
            const vc = await getProfileViewCount();
            setViewCount(vc || 0);
        } catch (e) {
            console.error("Error fetching view count:", e);
        }
      } else {
        try {
            userData = await getUserById(effectiveKeycloakId);
        } catch (e) {
            // If fetching by Keycloak ID fails, maybe the param was already an internal ID
            userData = await getUserById(effectiveKeycloakId);
        }
        
        const internalId = userData.id;
        profData = await getProfileByUserId(internalId);
        
        try {
            const statusRes = await getConnectionStatus(internalId);
            setConnectionStatus(statusRes);
        } catch (e) {
            console.error("Error fetching connection status:", e);
        }

        try {
            const postsRes = await getUserPosts(internalId);
            posts = postsRes?.content || (Array.isArray(postsRes) ? postsRes : []);
        } catch (e) {
            console.error("Error fetching user posts:", e);
        }
      }

      setUserDetails(userData);
      setProfile(profData);
      setUserPosts(posts);
    } catch (err) {
      console.error('Error loading profile:', err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/';

  const handleAction = async (actionFunc: Function, ...args: any[]) => {
    setActionLoading(true);
    try {
      await actionFunc(...args);
      toast.success('Action successful');
      fetchUserData();
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        try {
            await updateCoverImage(e.target.files[0]);
            toast.success('Cover image updated');
            fetchUserData();
        } catch (err) {
            toast.error('Failed to update cover image');
        }
    }
  };

  const handleMessageClick = () => {
    if (userDetails) {
      navigate(`/messaging?userId=${userDetails.id}&userName=${encodeURIComponent(userDetails.firstName + ' ' + userDetails.lastName)}`);
    }
  };

  const handleCreatePostClick = () => {
    navigate('/', { state: { openCreatePost: true } });
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-layout two-column-layout">
      <main className="profile-main">
        <div className="linkedin-card profile-header-card">
          <div 
            className="profile-cover" 
            style={{ 
                backgroundImage: profile?.coverImageUrl ? `url(${IMAGE_BASE_URL}${profile.coverImageUrl})` : 'linear-gradient(to right, #a0b4b7, #dce6e9)',
                position: 'relative'
            }}
          >
            {isOwnProfile && (
                <>
                    <button 
                        className="cover-edit-btn" 
                        onClick={() => coverInputRef.current?.click()}
                        style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                        <FontAwesomeIcon icon={faCamera} color="#0a66c2" />
                    </button>
                    <input type="file" ref={coverInputRef} hidden onChange={handleCoverUpload} accept="image/*" />
                </>
            )}
          </div>
          <div className="profile-avatar-wrap">
            {userDetails?.profileImageUrl ? (
                <img src={`${IMAGE_BASE_URL}${userDetails.profileImageUrl}`} alt="Profile" className="profile-main-avatar" style={{ objectFit: 'cover' }} />
            ) : (
                <div className="profile-main-avatar" style={{ backgroundColor: '#f3f2ef', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '80px', color: '#adb3b8' }}>
                    <FontAwesomeIcon icon={faUserCircle} />
                </div>
            )}
          </div>
          <div className="profile-info-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '24px', margin: '0' }}>{userDetails?.firstName} {userDetails?.lastName}</h2>
                    <p className="profile-headline" style={{ fontSize: '16px', margin: '4px 0' }}>{profile?.headline || 'Member at LinkedIn Clone'}</p>
                    <p className="author-designation" style={{ color: '#666', fontSize: '14px' }}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '4px' }} />
                        {profile?.city ? `${profile.city}, ${profile.state}` : 'Location not set'}
                    </p>
                    <p style={{ color: '#0a66c2', fontWeight: 600, fontSize: '14px', marginTop: '8px' }}>
                        {profile?.connectionsCount || 0} connections
                    </p>
                </div>
                {isOwnProfile && (
                    <Link to="/profile/edit" className="edit-icon-link">
                        <FontAwesomeIcon icon={faPencilAlt} />
                    </Link>
                )}
            </div>
            
            <div className="profile-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              {isOwnProfile ? (
                <>
                    <button className="primary-button">Open to</button>
                    <button className="secondary-button">Add profile section</button>
                    <button className="secondary-button" style={{ border: '1px solid #666', color: '#666' }}>More</button>
                </>
              ) : (
                <>
                  {connectionStatus?.status === 'NONE' && (
                    <button onClick={() => handleAction(sendConnectionRequest, userDetails.id)} className="primary-button" disabled={actionLoading}>
                        <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px' }} />
                        Connect
                    </button>
                  )}
                  {connectionStatus?.status === 'PENDING' && (
                    connectionStatus.isRequester ? 
                    <button onClick={() => handleAction(cancelConnectionRequest, connectionStatus.connectionId)} className="secondary-button" disabled={actionLoading}>Withdraw</button> :
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAction(respondToConnectionRequest, connectionStatus.connectionId, true)} className="primary-button" disabled={actionLoading}>Accept</button>
                        <button onClick={() => handleAction(respondToConnectionRequest, connectionStatus.connectionId, false)} className="secondary-button" disabled={actionLoading}>Ignore</button>
                    </div>
                  )}
                  {connectionStatus?.status === 'ACCEPTED' && (
                    <>
                        <button onClick={handleMessageClick} className="primary-button">Message</button>
                        <button className="secondary-button" style={{ border: '1px solid #666', color: '#666' }}>More</button>
                    </>
                  )}
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
                <h4 style={{ margin: 0, fontSize: '16px' }}>{viewCount}</h4>
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
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>About</h3>
            {isOwnProfile && <Link to="/profile/edit"><FontAwesomeIcon icon={faPencilAlt} color="#666" /></Link>}
          </div>
          <div className="card-body">
            <p style={{ whiteSpace: 'pre-wrap' }}>{profile?.summary || profile?.bio || 'No summary yet.'}</p>
          </div>
        </div>

        <div className="linkedin-card profile-activity-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
                <h3>Activity</h3>
                <p style={{ fontSize: '14px', color: '#0a66c2', fontWeight: 600 }}>{profile?.connectionsCount || 0} followers</p>
            </div>
            {isOwnProfile && <button onClick={handleCreatePostClick} className="secondary-button" style={{ height: '32px', fontSize: '14px' }}>Create a post</button>}
          </div>
          <div className="card-body" style={{ padding: '0' }}>
            {userDetails?.id && (
              <Feed userId={userDetails.id} limit={1} />
            )}
            {userPosts.length === 0 && !loading && (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: '#666' }}>No recent activity to show.</p>
              </div>
            )}
          </div>
          {userPosts.length > 0 && (
            <div className="card-footer" style={{ textAlign: 'center', padding: '12px', borderTop: '1px solid #eee' }}>
                <Link to={`/profile/${userDetails?.id}/posts`} style={{ color: '#666', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>Show all posts →</Link>
            </div>
          )}
        </div>

        <div className="linkedin-card section-card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>Experience</h3>
                {isOwnProfile && <button className="add-btn"><FontAwesomeIcon icon={faPencilAlt} /></button>}
            </div>
            <div className="card-body">
                {profile?.experience && profile.experience.length > 0 ? (
                    profile.experience.map((exp: any, idx: number) => (
                        <div key={idx} className="experience-item" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div className="experience-icon" style={{ width: '48px', height: '48px', backgroundColor: '#f3f2ef', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <FontAwesomeIcon icon={faBriefcase} color="#666" size="lg" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '16px' }}>{exp.position}</h4>
                                <p style={{ margin: '0', fontSize: '14px' }}>{exp.company}</p>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                                    {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {exp.isCurrentlyWorking ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                                {exp.description && <p style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(0,0,0,0.9)' }}>{exp.description}</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#666' }}>No experience listed.</p>
                )}
            </div>
        </div>

        <div className="linkedin-card section-card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>Education</h3>
                {isOwnProfile && <button className="add-btn"><FontAwesomeIcon icon={faPencilAlt} /></button>}
            </div>
            <div className="card-body">
                {profile?.education && profile.education.length > 0 ? (
                    profile.education.map((edu: any, idx: number) => (
                        <div key={idx} className="education-item" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div className="education-icon" style={{ width: '48px', height: '48px', backgroundColor: '#f3f2ef', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <FontAwesomeIcon icon={faGraduationCap} color="#666" size="lg" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '16px' }}>{edu.institution}</h4>
                                <p style={{ margin: '0', fontSize: '14px' }}>{edu.degree}, {edu.fieldOfStudy}</p>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                                    {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#666' }}>No education listed.</p>
                )}
            </div>
        </div>

        <div className="linkedin-card section-card">
            <div className="card-header"><h3>Skills</h3></div>
            <div className="card-body">
                {profile?.skills && profile.skills.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {profile.skills.split(',').map((skill: string, idx: number) => (
                            <span key={idx} style={{ padding: '8px 16px', border: '1px solid #666', borderRadius: '16px', fontSize: '14px', fontWeight: 600, color: '#666' }}>
                                {skill.trim()}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#666' }}>No skills listed.</p>
                )}
            </div>
        </div>
      </main>

      <aside className="profile-sidebar">
        <div className="linkedin-card card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Profile Language</h4>
            {isOwnProfile && <FontAwesomeIcon icon={faPencilAlt} size="xs" color="#666" />}
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>English</p>
        </div>
        <div className="linkedin-card card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Public profile & URL</h4>
            {isOwnProfile && <FontAwesomeIcon icon={faPencilAlt} size="xs" color="#666" />}
          </div>
          <p style={{ fontSize: '12px', color: '#0a66c2', marginTop: '8px', wordBreak: 'break-all' }}>
            linkedin.com/in/{userDetails?.firstName?.toLowerCase()}-{userDetails?.lastName?.toLowerCase()}-{userDetails?.id?.substring(0, 8)}
          </p>
        </div>
        
        <div className="linkedin-card promo-card">
            <div style={{ padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#666' }}>Ad</p>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>Unlock your full potential with LinkedIn Premium</p>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                    <img src={userDetails?.profileImageUrl ? `${IMAGE_BASE_URL}${userDetails.profileImageUrl}` : 'https://via.placeholder.com/60'} alt="User" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                </div>
                <button className="secondary-button" style={{ width: '100%', borderRadius: '20px' }}>Try for Free</button>
            </div>
        </div>
      </aside>
    </div>
  );
};

export default ProfilePage;
