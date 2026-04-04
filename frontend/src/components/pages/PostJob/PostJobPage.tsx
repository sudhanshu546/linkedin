import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createJob, updateJob } from '../../../api/jobApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faUserCircle, faLightbulb, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../../../context/UserContext';
import '../../../App.css';
import '../../../Forms.css';
import { Job, FormError } from '../../../types';

const PostJobPage: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const editJob = location.state?.editJob as Job | undefined;

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
  const [errors, setErrors] = useState<FormError>({});

  useEffect(() => {
      if (editJob) {
          setFormData({
              title: editJob.title || '',
              company: editJob.company || '',
              location: editJob.location || '',
              description: editJob.description || '',
              salary: editJob.salary?.toString() || '',
              jobType: editJob.jobType || 'FULL_TIME',
              experienceLevel: (editJob as any).experienceLevel || 'MID_LEVEL'
          });
      }
  }, [editJob]);

  const validateForm = () => {
    const newErrors: FormError = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
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

    setIsSubmitting(true);
    try {
      if (editJob) {
          await updateJob(editJob.id, formData);
          toast.success('Job updated successfully!');
      } else {
          await createJob(formData);
          toast.success('Job posted successfully!');
      }
      navigate('/jobs/manage');
    } catch (err: any) {
      if (err.response && err.response.data && typeof err.response.data === 'object') {
        setErrors(err.response.data);
      }
      toast.error(`Failed to ${editJob ? 'update' : 'post'} job. Please check the form.`);
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
          <div className="form-header-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #eee' }}>
            <div className="form-header-icon" style={{ backgroundColor: '#0a66c2', color: 'white', width: '40px', height: '40px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                <FontAwesomeIcon icon={faBriefcase} />
            </div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>{editJob ? 'Edit Job Posting' : 'Post a Job'}</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            <h4 className="form-section-title" style={{ marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '16px' }}>Role Details</h4>
            
            <div className="form-group-refined" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Job Title*</label>
              <input 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="e.g. Senior Software Engineer"
                className={`form-input-refined ${errors.title ? 'form-input-error' : ''}`}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
              {errors.title && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.title}</span>}
            </div>
            
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group-refined">
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Company*</label>
                <input 
                  name="company" 
                  value={formData.company} 
                  onChange={handleChange} 
                  placeholder="e.g. Microsoft"
                  className={`form-input-refined ${errors.company ? 'form-input-error' : ''}`}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
                {errors.company && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.company}</span>}
              </div>
              <div className="form-group-refined">
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Location*</label>
                <input 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. Remote or London, UK"
                  className={`form-input-refined ${errors.location ? 'form-input-error' : ''}`}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
                {errors.location && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.location}</span>}
              </div>
            </div>

            <h4 className="form-section-title" style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '16px' }}>Description & Compensation</h4>
            
            <div className="form-group-refined" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Description*</label>
              <textarea 
                name="description" 
                rows={6} 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="What are the responsibilities and requirements for this role?"
                className={`form-input-refined ${errors.description ? 'form-input-error' : ''}`}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical', minHeight: '120px' }}
              ></textarea>
              {errors.description && <span className="form-error-text" style={{ color: '#d11124', fontSize: '12px' }}>{errors.description}</span>}
            </div>
            
            <div className="form-group-refined" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Salary (Optional)</label>
              <input 
                name="salary" 
                value={formData.salary} 
                onChange={handleChange} 
                placeholder="e.g. $100,000 - $130,000 per year"
                className="form-input-refined"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div className="form-group-refined">
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Job Type*</label>
                <select name="jobType" value={formData.jobType} onChange={handleChange} className="form-input-refined" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', height: '40px' }}>
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="REMOTE">Remote</option>
                </select>
              </div>
              <div className="form-group-refined">
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Experience Level*</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="form-input-refined" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', height: '40px' }}>
                    <option value="ENTRY_LEVEL">Entry Level</option>
                    <option value="MID_LEVEL">Mid Level</option>
                    <option value="SENIOR">Senior</option>
                </select>
              </div>
            </div>

            <div className="form-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <button type="button" onClick={() => navigate('/jobs/manage')} className="btn-secondary-pill" style={{ padding: '6px 20px', borderRadius: '20px', border: '1px solid #666', background: 'none', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" className="btn-primary-pill" disabled={isSubmitting} style={{ padding: '6px 20px', borderRadius: '20px', border: 'none', background: '#0a66c2', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                {isSubmitting ? (editJob ? 'Updating...' : 'Posting...') : (editJob ? 'Update Job' : 'Post Job')}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Right Column */}
      <aside className="right-column">
        <div className="linkedin-card tips-card-content" style={{ padding: '16px' }}>
          <div className="tips-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FontAwesomeIcon icon={faLightbulb} style={{ color: '#f5c90b' }} />
            <span style={{ fontWeight: 600 }}>Job Posting Tips</span>
          </div>
          <ul className="tips-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '13px' }}>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" style={{ color: '#057642', marginTop: '2px' }} />
              <span>Use clear job titles to attract the right candidates.</span>
            </li>
            <li style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '13px' }}>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" style={{ color: '#057642', marginTop: '2px' }} />
              <span>Describe the day-to-day responsibilities in detail.</span>
            </li>
            <li style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
              <FontAwesomeIcon icon={faCheckCircle} className="tip-icon-check" style={{ color: '#057642', marginTop: '2px' }} />
              <span>Specifying location and job type helps filters.</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default PostJobPage;
