import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile } from '../../../api/profileApi';
import { updateProfileComposite, getPrivacySettings, updatePrivacySettings, unblockUser, getBlockedUsers } from '../../../api/userApi';
import { useUser } from '../../../context/UserContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faIdCard, faLightbulb, faCheckCircle, faInfoCircle, faLock, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import '../../../Forms.css';
import { ProfileDTO, FormError, PrivacySettings, User } from '../../../types';

const EditProfilePage: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');
  const [profile, setProfile] = useState<ProfileDTO>({
    id: '',
    userId: '',
    headline: '',
    summary: '',
    skills: '',
    city: '',
    state: '',
    experienceYears: 0,
    currentCompany: '',
    designation: '',
  });
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'PUBLIC',
    showEmail: true,
    showConnections: true,
    allowMessagesFrom: 'EVERYONE'
  });
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormError>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, privacyData, blockedData] = await Promise.all([
          getMyProfile(),
          getPrivacySettings(),
          getBlockedUsers()
        ]);

        if (profileData) {
            setProfile({
                ...profileData,
                experienceYears: profileData.experienceYears || 0,
                currentCompany: profileData.currentCompany || '',
                designation: profileData.designation || ''
            });
        }
        if (privacyData) {
            setPrivacy(privacyData);
        }
        if (blockedData) {
            setBlockedUsers(blockedData);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('No profile found, starting with fresh form.');
        } else {
          toast.error('Failed to fetch profile data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors: FormError = {};
    if (!profile.headline?.trim()) newErrors.headline = 'Headline is required';
    if (!profile.city?.trim()) newErrors.city = 'City is required';
    if (!profile.state?.trim()) newErrors.state = 'State is required';
    if (!profile.currentCompany?.trim()) newErrors.currentCompany = 'Current company is required';
    if (!profile.designation?.trim()) newErrors.designation = 'Designation is required';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: name === 'experienceYears' ? parseInt(value, 10) || 0 : value,
    }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await updateProfileComposite({ ...profile, image });
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (err: any) {
      if (err.response && err.response.data && typeof err.response.data === 'object') {
        setErrors(err.response.data);
      }
      toast.error('Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updatePrivacySettings(privacy);
      toast.success('Privacy settings updated!');
    } catch (err) {
      toast.error('Failed to update privacy settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User unblocked');
    } catch (err) {
      toast.error('Failed to unblock user');
    }
  };

  if (loading) {
    return (
      <div className="page-layout three-column-grid">
        <div className="feed-column" style={{ gridColumn: '2' }}>
            <div className="linkedin-card" style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p>Loading your profile...</p>
            </div>
        </div>
      </div>
    );
  }

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/';

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  return (
    <div className="page-layout three-column-grid">
      {/* Left Column */}
      <aside className="left-column">
        <div className="linkedin-card profile-mini-card">
          <div className="mini-card-cover"></div>
          <div className="mini-card-content">
            {imagePreview || user?.profileImageUrl ? (
                <img 
                    src={imagePreview || getImageUrl(user?.profileImageUrl) || ''} 
                    alt="Profile" 
                    className="mini-avatar-home"
                    style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }}
                />
            ) : (
                <FontAwesomeIcon icon={faUserCircle} className="mini-avatar-home" style={{ fontSize: '72px', color: '#adb3b8' }} />
            )}
            <h3 style={{ margin: '8px 0 4px', fontSize: '16px' }}>{user ? `${user.firstName} ${user.lastName}` : 'User'}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{profile.headline || 'Your headline here'}</p>
          </div>
        </div>
      </aside>

      {/* Middle Column */}
      <main className="feed-column">
        <div className="linkedin-card form-card-container">
          <div className="tab-navigation" style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
            <button 
              onClick={() => setActiveTab('profile')}
              style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid #0a66c2' : 'none', color: activeTab === 'profile' ? '#0a66c2' : '#666', fontWeight: 600, cursor: 'pointer' }}
            >
              Profile Info
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'privacy' ? '2px solid #0a66c2' : 'none', color: activeTab === 'privacy' ? '#0a66c2' : '#666', fontWeight: 600, cursor: 'pointer' }}
            >
              Privacy & Settings
            </button>
          </div>

          {activeTab === 'profile' ? (
            <>
              <div className="form-header-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #eee' }}>
                <div className="form-header-icon" style={{ backgroundColor: '#0a66c2', color: 'white', width: '40px', height: '40px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                    <FontAwesomeIcon icon={faIdCard} />
                </div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Edit Profile</h2>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                <h4 className="form-section-title" style={{ marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '16px' }}>Profile Picture</h4>
                <div className="form-group-refined" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                    <div className="avatar-upload-preview">
                        {imagePreview || user?.profileImageUrl ? (
                            <img 
                                src={imagePreview || getImageUrl(user?.profileImageUrl) || ''} 
                                alt="Preview" 
                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0a66c2' }}
                            />
                        ) : (
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f3f2ef', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #ccc' }}>
                                <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '60px', color: '#adb3b8' }} />
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="btn-secondary-pill" style={{ cursor: 'pointer', display: 'inline-block', padding: '6px 16px', border: '1px solid #0a66c2', color: '#0a66c2', borderRadius: '20px', fontWeight: 600, fontSize: '14px' }}>
                            Change Photo
                            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                        </label>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Recommended: Square image, max 2MB.</p>
                    </div>
                </div>

                <h4 className="form-section-title" style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '16px' }}>Professional Identity</h4>
                
                <div className="form-group-refined" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Headline*</label>
                  <input
                    type="text"
                    name="headline"
                    value={profile.headline}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer at Tech Corp"
                    className={`form-input-refined ${errors.headline ? 'form-input-error' : ''}`}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                  {errors.headline && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.headline}</span>}
                </div>

                <div className="form-group-refined" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Summary</label>
                  <textarea
                    name="summary"
                    value={profile.summary}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Briefly describe your professional background"
                    className="form-input-refined"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical' }}
                  ></textarea>
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group-refined">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Designation*</label>
                        <input
                            type="text"
                            name="designation"
                            value={profile.designation}
                            onChange={handleChange}
                            placeholder="e.g. Senior Manager"
                            className={`form-input-refined ${errors.designation ? 'form-input-error' : ''}`}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                        />
                        {errors.designation && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.designation}</span>}
                    </div>
                    <div className="form-group-refined">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Current Company*</label>
                        <input
                            type="text"
                            name="currentCompany"
                            value={profile.currentCompany}
                            onChange={handleChange}
                            placeholder="e.g. Google"
                            className={`form-input-refined ${errors.currentCompany ? 'form-input-error' : ''}`}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                        />
                        {errors.currentCompany && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.currentCompany}</span>}
                    </div>
                </div>

                <h4 className="form-section-title" style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '16px' }}>Location & Experience</h4>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group-refined">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>City*</label>
                        <input
                            type="text"
                            name="city"
                            value={profile.city}
                            onChange={handleChange}
                            className={`form-input-refined ${errors.city ? 'form-input-error' : ''}`}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                        />
                        {errors.city && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.city}</span>}
                    </div>
                    <div className="form-group-refined">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>State*</label>
                        <input
                            type="text"
                            name="state"
                            value={profile.state}
                            onChange={handleChange}
                            className={`form-input-refined ${errors.state ? 'form-input-error' : ''}`}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                        />
                        {errors.state && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.state}</span>}
                    </div>
                </div>

                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div className="form-group-refined">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Experience (Years)</label>
                        <input
                            type="number"
                            name="experienceYears"
                            value={profile.experienceYears}
                            onChange={handleChange}
                            min="0"
                            className="form-input-refined"
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div className="form-group-refined">
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Skills</label>
                        <input
                            type="text"
                            name="skills"
                            value={profile.skills}
                            onChange={handleChange}
                            placeholder="e.g. Java, React, SQL"
                            className="form-input-refined"
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                <div className="form-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  <button type="button" onClick={() => navigate('/profile')} className="btn-secondary-pill" style={{ padding: '6px 20px', borderRadius: '20px', border: '1px solid #666', background: 'none', color: '#666', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary-pill" style={{ padding: '6px 20px', borderRadius: '20px', border: 'none', background: '#0a66c2', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                    {submitting ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="form-header-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #eee' }}>
                <div className="form-header-icon" style={{ backgroundColor: '#0a66c2', color: 'white', width: '40px', height: '40px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                    <FontAwesomeIcon icon={faLock} />
                </div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Privacy Settings</h2>
              </div>

              <form onSubmit={handlePrivacySubmit} style={{ padding: '24px' }}>
                <div className="form-group-refined" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Profile Visibility</label>
                  <select 
                    value={privacy.profileVisibility} 
                    onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value as any})}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="PUBLIC">Public (Everyone can see)</option>
                    <option value="CONNECTIONS">Connections Only</option>
                    <option value="PRIVATE">Private (Only you)</option>
                  </select>
                </div>

                <div className="form-group-refined" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Messaging Permissions</label>
                  <select 
                    value={privacy.allowMessagesFrom} 
                    onChange={(e) => setPrivacy({...privacy, allowMessagesFrom: e.target.value as any})}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="EVERYONE">Everyone can message me</option>
                    <option value="CONNECTIONS">Only connections can message me</option>
                  </select>
                </div>

                <div className="checkbox-group" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <input 
                      type="checkbox" 
                      id="showEmail" 
                      checked={privacy.showEmail} 
                      onChange={(e) => setPrivacy({...privacy, showEmail: e.target.checked})} 
                    />
                    <label htmlFor="showEmail" style={{ fontSize: '14px' }}>Show email on my profile</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="showConnections" 
                      checked={privacy.showConnections} 
                      onChange={(e) => setPrivacy({...privacy, showConnections: e.target.checked})} 
                    />
                    <label htmlFor="showConnections" style={{ fontSize: '14px' }}>Show my connections list</label>
                  </div>
                </div>

                <div className="form-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  <button type="submit" disabled={submitting} className="btn-primary-pill" style={{ padding: '6px 20px', borderRadius: '20px', border: 'none', background: '#0a66c2', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                    {submitting ? 'Updating...' : 'Update Settings'}
                  </button>
                </div>
              </form>

              <div className="blocked-users-section" style={{ padding: '24px', borderTop: '8px solid #f3f2ef' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#666', color: 'white', width: '32px', height: '32px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faUserSlash} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Blocked Users</h3>
                </div>
                
                {blockedUsers.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>You haven't blocked any users.</p>
                ) : (
                  <div className="blocked-list">
                    {blockedUsers.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8' }} />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{u.email}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleUnblock(u.id)}
                          style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid #666', background: 'none', color: '#666', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Right Column */}
      <aside className="right-column">
        <div className="linkedin-card tips-card-content" style={{ padding: '16px' }}>
          <div className="tips-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FontAwesomeIcon icon={faLightbulb} style={{ color: '#f5c90b' }} />
            <span style={{ fontWeight: 600 }}>Profile Tips</span>
          </div>
          <ul className="tips-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '13px' }}>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" style={{ color: '#057642', marginTop: '2px' }} />
              <span>A strong headline helps you appear in searches.</span>
            </li>
            <li style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '13px' }}>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" style={{ color: '#057642', marginTop: '2px' }} />
              <span>Detailing your company and role builds credibility.</span>
            </li>
            <li style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
              <FontAwesomeIcon icon={faInfoCircle} className="tip-icon-info" style={{ color: '#0a66c2', marginTop: '2px' }} />
              <span>Add your city so recruiters can find you locally.</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default EditProfilePage;
