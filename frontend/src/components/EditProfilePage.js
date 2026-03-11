import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/userApi';
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faIdCard, faLightbulb, faCheckCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import '../App.css';
import '../Forms.css';

const EditProfilePage = () => {
  const { user } = useUser();
  const [profile, setProfile] = useState({
    headline: '',
    summary: '',
    skills: '',
    city: '',
    state: '',
    experienceYears: 0,
    currentCompany: '',
    designation: '',
    about: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getProfile();
        if (profileData) {
            setProfile({
                ...profileData,
                experienceYears: profileData.experienceYears || 0
            });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log('No profile found, starting with fresh form.');
        } else {
          toast.error('Failed to fetch profile data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!profile.headline?.trim()) newErrors.headline = 'Headline is required';
    if (!profile.city?.trim()) newErrors.city = 'City is required';
    if (!profile.state?.trim()) newErrors.state = 'State is required';
    if (!profile.currentCompany?.trim()) newErrors.currentCompany = 'Current company is required';
    if (!profile.designation?.trim()) newErrors.designation = 'Designation is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: name === 'experienceYears' ? parseInt(value, 10) || 0 : value,
    }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile(profile);
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      if (err.response && err.response.data && typeof err.response.data === 'object') {
        setErrors(err.response.data);
      }
      toast.error('Failed to update profile.');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="page-layout three-column-grid">
      {/* Left Column */}
      <aside className="left-column">
        <div className="linkedin-card profile-mini-card">
          <div className="mini-card-cover"></div>
          <div className="mini-card-content">
            <FontAwesomeIcon icon={faUserCircle} className="mini-avatar-home" style={{ fontSize: '72px', color: '#adb3b8' }} />
            <h3>{user ? `${user.firstName} ${user.lastName}` : 'User'}</h3>
            <p>{profile.headline || 'Your headline here'}</p>
          </div>
        </div>
      </aside>

      {/* Middle Column */}
      <main className="feed-column">
        <div className="linkedin-card form-card-container">
          <div className="form-header-section">
            <div className="form-header-icon">
                <FontAwesomeIcon icon={faIdCard} />
            </div>
            <h2>Edit Profile</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <h4 className="form-section-title">Professional Identity</h4>
            
            <div className="form-group-refined">
              <label>Headline*</label>
              <input
                type="text"
                name="headline"
                value={profile.headline}
                onChange={handleChange}
                placeholder="e.g. Software Engineer at Tech Corp"
                className={`form-input-refined ${errors.headline ? 'form-input-error' : ''}`}
              />
              {errors.headline && <span className="form-error-text">{errors.headline}</span>}
            </div>

            <div className="form-group-refined">
              <label>Summary</label>
              <textarea
                name="summary"
                value={profile.summary}
                onChange={handleChange}
                rows="3"
                placeholder="Briefly describe your professional background"
                className="form-input-refined"
                style={{ resize: 'vertical' }}
              ></textarea>
            </div>

            <div className="form-grid-2">
                <div className="form-group-refined">
                    <label>Designation*</label>
                    <input
                        type="text"
                        name="designation"
                        value={profile.designation}
                        onChange={handleChange}
                        placeholder="e.g. Senior Manager"
                        className={`form-input-refined ${errors.designation ? 'form-input-error' : ''}`}
                    />
                    {errors.designation && <span className="form-error-text">{errors.designation}</span>}
                </div>
                <div className="form-group-refined">
                    <label>Current Company*</label>
                    <input
                        type="text"
                        name="currentCompany"
                        value={profile.currentCompany}
                        onChange={handleChange}
                        placeholder="e.g. Google"
                        className={`form-input-refined ${errors.currentCompany ? 'form-input-error' : ''}`}
                    />
                    {errors.currentCompany && <span className="form-error-text">{errors.currentCompany}</span>}
                </div>
            </div>

            <h4 className="form-section-title">Location & Experience</h4>

            <div className="form-grid-2">
                <div className="form-group-refined">
                    <label>City*</label>
                    <input
                        type="text"
                        name="city"
                        value={profile.city}
                        onChange={handleChange}
                        className={`form-input-refined ${errors.city ? 'form-input-error' : ''}`}
                    />
                    {errors.city && <span className="form-error-text">{errors.city}</span>}
                </div>
                <div className="form-group-refined">
                    <label>State*</label>
                    <input
                        type="text"
                        name="state"
                        value={profile.state}
                        onChange={handleChange}
                        className={`form-input-refined ${errors.state ? 'form-input-error' : ''}`}
                    />
                    {errors.state && <span className="form-error-text">{errors.state}</span>}
                </div>
            </div>

            <div className="form-grid-2">
                <div className="form-group-refined">
                    <label>Experience (Years)</label>
                    <input
                        type="number"
                        name="experienceYears"
                        value={profile.experienceYears}
                        onChange={handleChange}
                        min="0"
                        className="form-input-refined"
                    />
                </div>
                <div className="form-group-refined">
                    <label>Skills</label>
                    <input
                        type="text"
                        name="skills"
                        value={profile.skills}
                        onChange={handleChange}
                        placeholder="e.g. Java, React, SQL"
                        className="form-input-refined"
                    />
                </div>
            </div>

            <div className="form-group-refined">
              <label>About (Detailed Bio)</label>
              <textarea
                name="about"
                value={profile.about}
                onChange={handleChange}
                rows="5"
                placeholder="Go into more detail about your career and achievements"
                className="form-input-refined"
                style={{ resize: 'vertical', minHeight: '120px' }}
              ></textarea>
            </div>

            <div className="form-footer-actions">
              <button type="button" onClick={() => navigate('/profile')} className="btn-secondary-pill">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary-pill">
                {submitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Right Column */}
      <aside className="right-column">
        <div className="linkedin-card tips-card-content">
          <div className="tips-header">
            <FontAwesomeIcon icon={faLightbulb} style={{ color: '#f5c90b' }} />
            <span>Profile Tips</span>
          </div>
          <ul className="tips-list">
            <li>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" />
              <span>A strong headline helps you appear in searches.</span>
            </li>
            <li>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" />
              <span>Detailing your company and role builds credibility.</span>
            </li>
            <li>
              <FontAwesomeIcon icon={faInfoCircle} className="tip-icon-info" />
              <span>Add your city so recruiters can find you locally.</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default EditProfilePage;
