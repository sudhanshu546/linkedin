import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { postJob } from '../api/userApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faUserCircle, faLightbulb, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../context/UserContext';
import '../App.css';
import '../Forms.css';

const PostJobPage = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    salary: '',
    jobType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
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

    setIsSubmitting(true);
    try {
      await postJob(formData);
      toast.success('Job posted successfully!');
      navigate('/jobs');
    } catch (err) {
      if (err.response && err.response.data && typeof err.response.data === 'object') {
        setErrors(err.response.data);
      }
      toast.error('Failed to post job. Please check the form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-layout three-column-grid">
      {/* Left Column */}
      <aside className="left-column">
        <div className="linkedin-card profile-mini-card">
          <div className="mini-card-cover"></div>
          <div className="mini-card-content">
            <FontAwesomeIcon icon={faUserCircle} className="mini-avatar-home" style={{ fontSize: '72px', color: '#adb3b8' }} />
            <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3>{user ? `${user.firstName} ${user.lastName}` : 'User'}</h3>
            </Link>
            <p>Recruiter Mode</p>
          </div>
          <div className="mini-card-stats">
            <Link to="/jobs/manage" className="stat-row" style={{ textDecoration: 'none' }}>
              <span>Manage your jobs</span>
              <span className="stat-number" style={{ color: '#0a66c2' }}>View</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Middle Column */}
      <main className="feed-column">
        <div className="linkedin-card form-card-container">
          <div className="form-header-section">
            <div className="form-header-icon">
                <FontAwesomeIcon icon={faBriefcase} />
            </div>
            <h2>Post a Job</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <h4 className="form-section-title">Role Details</h4>
            
            <div className="form-group-refined">
              <label>Job Title*</label>
              <input 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="e.g. Senior Software Engineer"
                className={`form-input-refined ${errors.title ? 'form-input-error' : ''}`}
              />
              {errors.title && <span className="form-error-text">{errors.title}</span>}
            </div>
            
            <div className="form-grid-2">
              <div className="form-group-refined">
                <label>Company*</label>
                <input 
                  name="company" 
                  value={formData.company} 
                  onChange={handleChange} 
                  placeholder="e.g. Microsoft"
                  className={`form-input-refined ${errors.company ? 'form-input-error' : ''}`}
                />
                {errors.company && <span className="form-error-text">{errors.company}</span>}
              </div>
              <div className="form-group-refined">
                <label>Location*</label>
                <input 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. Remote or London, UK"
                  className={`form-input-refined ${errors.location ? 'form-input-error' : ''}`}
                />
                {errors.location && <span className="form-error-text">{errors.location}</span>}
              </div>
            </div>

            <h4 className="form-section-title">Description & Compensation</h4>
            
            <div className="form-group-refined">
              <label>Description*</label>
              <textarea 
                name="description" 
                rows="6" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="What are the responsibilities and requirements for this role?"
                className={`form-input-refined ${errors.description ? 'form-input-error' : ''}`}
                style={{ resize: 'vertical', minHeight: '120px' }}
              ></textarea>
              {errors.description && <span className="form-error-text">{errors.description}</span>}
            </div>
            
            <div className="form-group-refined">
              <label>Salary (Optional)</label>
              <input 
                name="salary" 
                value={formData.salary} 
                onChange={handleChange} 
                placeholder="e.g. $100,000 - $130,000 per year"
                className="form-input-refined"
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group-refined">
                <label>Job Type*</label>
                <select name="jobType" value={formData.jobType} onChange={handleChange} className="form-input-refined" style={{ height: '40px' }}>
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="REMOTE">Remote</option>
                </select>
              </div>
              <div className="form-group-refined">
                <label>Experience Level*</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="form-input-refined" style={{ height: '40px' }}>
                    <option value="ENTRY_LEVEL">Entry Level</option>
                    <option value="MID_LEVEL">Mid Level</option>
                    <option value="SENIOR">Senior</option>
                </select>
              </div>
            </div>

            <div className="form-footer-actions">
              <button type="button" onClick={() => navigate('/jobs')} className="btn-secondary-pill">Cancel</button>
              <button type="submit" className="btn-primary-pill" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Job'}
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
            <span>Job Posting Tips</span>
          </div>
          <ul className="tips-list">
            <li>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" />
              <span>Use clear job titles to attract the right candidates.</span>
            </li>
            <li>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" />
              <span>Describe the day-to-day responsibilities in detail.</span>
            </li>
            <li>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" />
              <span>Specifying location and job type helps filters.</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default PostJobPage;
