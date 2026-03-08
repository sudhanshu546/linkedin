import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/userApi';
import '../App.css'; // Assuming App.css for styling

const EditProfilePage = () => {
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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch existing profile data to pre-populate the form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData); // Pre-populate form with fetched data
      } catch (err) {
        if (err.response?.status === 404) {
          // If profile not found, just use default state
          console.log('No profile found, starting with fresh form.');
        } else if (err.response?.status === 401) {
          setError('Unauthorized. Please log in.');
          navigate('/login');
        } else {
          setError('Failed to fetch profile data for editing.');
          console.error('Edit Profile fetch error:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: name === 'experienceYears' ? parseInt(value, 10) || 0 : value, // Convert to number if experienceYears
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await updateProfile(profile);
      alert('Profile updated successfully!');
      navigate('/profile'); // Redirect to profile view page
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Loading Profile for Edit...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/profile')} className="secondary-button">Go to Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content profile-page-layout"> {/* Use main-content and profile-page-layout for wider form */}
      <div className="auth-card profile-edit-card">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="headline">Headline</label>
            <input
              type="text"
              id="headline"
              name="headline"
              value={profile.headline}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              name="summary"
              value={profile.summary}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={profile.skills}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={profile.city}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={profile.state}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="experienceYears">Experience (Years)</label>
            <input
              type="number"
              id="experienceYears"
              name="experienceYears"
              value={profile.experienceYears}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="currentCompany">Current Company</label>
            <input
              type="text"
              id="currentCompany"
              name="currentCompany"
              value={profile.currentCompany}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="designation">Designation</label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={profile.designation}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="about">About</label>
            <textarea
              id="about"
              name="about"
              value={profile.about}
              onChange={handleChange}
              rows="5"
            ></textarea>
          </div>
          {/* Add more form fields for other ProfileDTO properties */}
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={submitting} className="primary-button">
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
          <button type="button" onClick={() => navigate('/profile')} className="secondary-button">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;