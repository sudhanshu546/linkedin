import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faCamera, faPencilAlt, faMapMarkerAlt, faBriefcase, faGraduationCap, faUsers, faEye, faPlus } from '@fortawesome/free-solid-svg-icons';
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
  getProfileViewCount,
  updateCoverImage,
} from '../../../api/profileApi';
import Feed from '../Feed/Feed';
import '../../../App.css';
import { IMAGE_BASE_URL } from '../../../constants/api';
import { motion, AnimatePresence } from 'framer-motion';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userPostsCount, setUserPostsCount] = useState<number>(0);
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

      if (isOwn) {
        userData = await getAuthenticatedUser();
        profData = await getMyProfile();
        
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
      }

      setUserDetails(userData);
      setProfile(profData);
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

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

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

  const handlePostsLoaded = useCallback((posts: any[]) => {
      if (posts.length !== userPostsCount) {
          setUserPostsCount(posts.length);
      }
  }, [userPostsCount]);

  const handlePlaceholderAction = (actionName: string) => {
      toast.info(`${actionName} feature coming soon!`);
  };

  if (loading) return (
    <div className="loading-container" style={{ textAlign: 'center', padding: '100px' }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '16px', color: '#666' }}>Loading professional profile...</p>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="page-layout two-column-layout" 
        style={{ maxWidth: '1128px', margin: '0 auto' }}
    >
      <main className="profile-main">
        {/* Profile Header Card */}
        <motion.div variants={itemVariants} className="linkedin-card profile-header-card" style={{ overflow: 'visible' }}>
          <div 
            className="profile-cover" 
            style={{ 
                backgroundImage: profile?.coverImageUrl ? `url(${getImageUrl(profile.coverImageUrl)})` : 'linear-gradient(to right, #a0b4b7, #dce6e9)',
                position: 'relative',
                height: '200px',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 1,
                borderRadius: '8px 8px 0 0'
            }}
          >
            {isOwnProfile && (
                <>
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="cover-edit-btn" 
                        onClick={() => coverInputRef.current?.click()}
                        style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 }}
                    >
                        <FontAwesomeIcon icon={faCamera} color="#0a66c2" />
                    </motion.button>
                    <input type="file" ref={coverInputRef} hidden onChange={handleCoverUpload} accept="image/*" />
                </>
            )}
          </div>
          <div className="profile-avatar-wrap" style={{ padding: '0 24px', marginTop: '-110px', marginBottom: '12px', position: 'relative', zIndex: 5 }}>
            {userDetails?.profileImageUrl ? (
                <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={getImageUrl(userDetails.profileImageUrl) || ''} 
                    alt="Profile" 
                    className="profile-main-avatar" 
                    style={{ width: '152px', height: '152px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover', background: 'white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} 
                />
            ) : (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="profile-main-avatar" 
                    style={{ width: '152px', height: '152px', borderRadius: '50%', border: '4px solid white', backgroundColor: '#f3f2ef', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '80px', color: '#adb3b8', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}
                >
                    <FontAwesomeIcon icon={faUserCircle} />
                </motion.div>
            )}
          </div>
          <div className="profile-info-section" style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '24px', margin: '0', fontWeight: 600, color: 'rgba(0,0,0,0.9)' }}>{userDetails?.firstName} {userDetails?.lastName}</h2>
                    <p className="profile-headline" style={{ fontSize: '16px', margin: '4px 0', color: 'rgba(0,0,0,0.9)' }}>{profile?.headline || 'Member at LinkedIn Clone'}</p>
                    <p style={{ color: '#666', fontSize: '14px', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        {profile?.city ? `${profile.city}, ${profile.state}` : 'Location not set'}
                    </p>
                    <p style={{ color: '#0a66c2', fontWeight: 600, fontSize: '14px', marginTop: '8px', cursor: 'pointer' }}>
                        {profile?.connectionsCount || 0} connections
                    </p>
                </div>
                {isOwnProfile && (
                    <motion.div whileHover={{ scale: 1.1 }}>
                        <Link to="/profile/edit" className="edit-icon-link" style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
                            <FontAwesomeIcon icon={faPencilAlt} />
                        </Link>
                    </motion.div>
                )}
            </div>
            
            <div className="profile-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              {isOwnProfile ? (
                <>
                    <motion.button whileHover={{ backgroundColor: '#004182' }} className="btn-primary-round" style={{ padding: '6px 16px', fontSize: '16px' }} onClick={() => handlePlaceholderAction('Open to')}>Open to</motion.button>
                    <motion.button whileHover={{ backgroundColor: 'rgba(10, 102, 194, 0.1)' }} className="btn-secondary-round" style={{ padding: '6px 16px', fontSize: '16px' }} onClick={() => handlePlaceholderAction('Add profile section')}>Add profile section</motion.button>
                    <button className="btn-secondary-round" style={{ padding: '6px 16px', fontSize: '16px', border: '1px solid #666', color: '#666' }} onClick={() => handlePlaceholderAction('More Options')}>More</button>
                </>
              ) : (
                <>
                  {connectionStatus?.status === 'NONE' && (
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction(sendConnectionRequest, userDetails.id)} 
                        className="btn-primary-round" 
                        disabled={actionLoading}
                        style={{ padding: '6px 20px', fontSize: '16px' }}
                    >
                        <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px' }} />
                        Connect
                    </motion.button>
                  )}
                  {connectionStatus?.status === 'PENDING' && (
                    connectionStatus.isRequester ? 
                    <button onClick={() => handleAction(cancelConnectionRequest, connectionStatus.connectionId)} className="btn-secondary-round" disabled={actionLoading}>Withdraw</button> :
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAction(respondToConnectionRequest, connectionStatus.connectionId, true)} className="btn-primary-round" disabled={actionLoading}>Accept</button>
                        <button onClick={() => handleAction(respondToConnectionRequest, connectionStatus.connectionId, false)} className="btn-secondary-round" disabled={actionLoading}>Ignore</button>
                    </div>
                  )}
                  {connectionStatus?.status === 'ACCEPTED' && (
                    <>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={handleMessageClick} className="btn-primary-round" style={{ padding: '6px 20px', fontSize: '16px' }}>Message</motion.button>
                        <button className="btn-secondary-round" style={{ border: '1px solid #666', color: '#666' }}>More</button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Analytics Section */}
        {isOwnProfile && (
          <motion.div variants={itemVariants} className="linkedin-card" style={{ padding: '24px' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Analytics</h3>
              <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FontAwesomeIcon icon={faEye} size="xs" /> Private to you
              </p>
            </div>
            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <Link to="/profile-views" className="analytics-item" style={{ textDecoration: 'none', color: 'inherit', padding: '12px', borderRadius: '8px', transition: 'background 0.2s' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: 'rgba(0,0,0,0.9)' }}>{viewCount}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>Profile viewers</p>
              </Link>
              <div className="analytics-item" style={{ padding: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: 'rgba(0,0,0,0.9)' }}>{Math.floor(Math.random() * 200) + 50}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>Post impressions</p>
              </div>
              <div className="analytics-item" style={{ padding: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: 'rgba(0,0,0,0.9)' }}>{Math.floor(Math.random() * 50) + 5}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>Search appearances</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* About Section */}
        <motion.div variants={itemVariants} className="linkedin-card" style={{ padding: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>About</h3>
            {isOwnProfile && <Link to="/profile/edit" style={{ color: '#666' }}><FontAwesomeIcon icon={faPencilAlt} /></Link>}
          </div>
          <div className="card-body">
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'rgba(0,0,0,0.9)' }}>
                {profile?.summary || profile?.bio || 'No summary provided yet. Add an about section to highlight your professional story.'}
            </p>
          </div>
        </motion.div>

        {/* Activity Section */}
        <motion.div variants={itemVariants} className="linkedin-card profile-activity-card" style={{ padding: '0' }}>
          <div className="card-header" style={{ padding: '24px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Activity</h3>
                <p style={{ fontSize: '14px', color: '#0a66c2', fontWeight: 600, margin: '4px 0 0' }}>{profile?.connectionsCount || 0} followers</p>
            </div>
            {isOwnProfile && (
                <motion.button 
                    whileHover={{ backgroundColor: 'rgba(10, 102, 194, 0.1)' }}
                    onClick={handleCreatePostClick} 
                    className="btn-secondary-round" 
                    style={{ padding: '4px 16px' }}
                >
                    Create a post
                </motion.button>
            )}
          </div>
          <div className="card-body" style={{ padding: '0 12px' }}>
            {userDetails?.id && (
              <Feed 
                userId={userDetails.id} 
                limit={3} 
                onPostsLoaded={handlePostsLoaded}
              />
            )}
            {userPostsCount === 0 && !loading && (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <p style={{ color: '#666', margin: 0 }}>No recent activity to show.</p>
              </div>
            )}
          </div>
          {userPostsCount > 0 && (
            <div className="card-footer" style={{ textAlign: 'center', padding: '12px', borderTop: '1px solid #eee' }}>
                <Link to={`/profile/${userDetails?.id}/posts`} style={{ color: '#666', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>Show all posts →</Link>
            </div>
          )}
        </motion.div>

        {/* Experience Section */}
        <motion.div variants={itemVariants} className="linkedin-card" style={{ padding: '24px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Experience</h3>
                {isOwnProfile && (
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <motion.button whileHover={{ scale: 1.1 }} className="add-btn" style={{ color: '#666' }} onClick={() => handlePlaceholderAction('Add Experience')}><FontAwesomeIcon icon={faPlus} /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} className="add-btn" style={{ color: '#666' }} onClick={() => handlePlaceholderAction('Edit Experience')}><FontAwesomeIcon icon={faPencilAlt} /></motion.button>
                    </div>
                )}
            </div>
            <div className="card-body">
                {profile?.experience && profile.experience.length > 0 ? (
                    profile.experience.map((exp: any, idx: number) => (
                        <div key={idx} className="experience-item" style={{ display: 'flex', gap: '12px', marginBottom: idx === profile.experience.length - 1 ? 0 : '24px', borderBottom: idx === profile.experience.length - 1 ? 'none' : '1px solid #eee', paddingBottom: idx === profile.experience.length - 1 ? 0 : '24px' }}>
                            <div className="experience-icon" style={{ width: '48px', height: '48px', backgroundColor: '#f3f2ef', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                <FontAwesomeIcon icon={faBriefcase} color="#666" size="lg" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0', fontSize: '16px', fontWeight: 600, color: 'rgba(0,0,0,0.9)' }}>{exp.position}</h4>
                                <p style={{ margin: '2px 0', fontSize: '14px', color: 'rgba(0,0,0,0.9)' }}>{exp.company}</p>
                                <p style={{ margin: '2px 0', fontSize: '14px', color: '#666' }}>
                                    {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {exp.isCurrentlyWorking ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                                {exp.description && <p style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(0,0,0,0.9)', lineHeight: '1.4' }}>{exp.description}</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#666', margin: 0 }}>No experience listed.</p>
                )}
            </div>
        </motion.div>

        {/* Education Section */}
        <motion.div variants={itemVariants} className="linkedin-card" style={{ padding: '24px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Education</h3>
                {isOwnProfile && (
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <motion.button whileHover={{ scale: 1.1 }} className="add-btn" style={{ color: '#666' }} onClick={() => handlePlaceholderAction('Add Education')}><FontAwesomeIcon icon={faPlus} /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} className="add-btn" style={{ color: '#666' }} onClick={() => handlePlaceholderAction('Edit Education')}><FontAwesomeIcon icon={faPencilAlt} /></motion.button>
                    </div>
                )}
            </div>
            <div className="card-body">
                {profile?.education && profile.education.length > 0 ? (
                    profile.education.map((edu: any, idx: number) => (
                        <div key={idx} className="education-item" style={{ display: 'flex', gap: '12px', marginBottom: idx === profile.education.length - 1 ? 0 : '24px', borderBottom: idx === profile.education.length - 1 ? 'none' : '1px solid #eee', paddingBottom: idx === profile.education.length - 1 ? 0 : '24px' }}>
                            <div className="education-icon" style={{ width: '48px', height: '48px', backgroundColor: '#f3f2ef', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                <FontAwesomeIcon icon={faGraduationCap} color="#666" size="lg" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0', fontSize: '16px', fontWeight: 600, color: 'rgba(0,0,0,0.9)' }}>{edu.institution}</h4>
                                <p style={{ margin: '2px 0', fontSize: '14px', color: 'rgba(0,0,0,0.9)' }}>{edu.degree}, {edu.fieldOfStudy}</p>
                                <p style={{ margin: '2px 0', fontSize: '14px', color: '#666' }}>
                                    {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#666', margin: 0 }}>No education listed.</p>
                )}
            </div>
        </motion.div>
      </main>

      {/* Sidebar */}
      <aside className="profile-sidebar">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="linkedin-card" 
            style={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Profile Language</h4>
                {isOwnProfile && <FontAwesomeIcon icon={faPencilAlt} size="xs" color="#666" style={{ cursor: 'pointer' }} onClick={() => handlePlaceholderAction('Change Language')} />}
            </div>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px', margin: '8px 0 0' }}>English</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="linkedin-card" 
            style={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Public profile & URL</h4>
                {isOwnProfile && <FontAwesomeIcon icon={faPencilAlt} size="xs" color="#666" style={{ cursor: 'pointer' }} onClick={() => handlePlaceholderAction('Edit URL')} />}
            </div>
            <p style={{ fontSize: '12px', color: '#0a66c2', marginTop: '8px', margin: '8px 0 0', wordBreak: 'break-all', fontWeight: 600 }}>
                linkedin.com/in/{userDetails?.firstName?.toLowerCase()}-{userDetails?.lastName?.toLowerCase()}-{userDetails?.id?.substring(0, 8)}
            </p>
          </motion.div>
        
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="linkedin-card promo-card" 
            style={{ padding: '16px', textAlign: 'center' }}
        >
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px' }}>Ad</p>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px' }}>Unlock your full potential with LinkedIn Premium</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                {userDetails?.profileImageUrl ? (
                    <img src={`${IMAGE_BASE_URL}${userDetails.profileImageUrl}`} alt="User" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
                ) : (
                    <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '64px', color: '#adb3b8' }} />
                )}
            </div>
            <motion.button 
                whileHover={{ backgroundColor: 'rgba(10, 102, 194, 0.1)' }}
                className="btn-secondary-round" 
                style={{ width: '100%' }}
                onClick={() => handlePlaceholderAction('Premium Subscription')}
            >
                Try for Free
            </motion.button>
        </motion.div>
      </aside>
    </motion.div>
  );
};

export default ProfilePage;
