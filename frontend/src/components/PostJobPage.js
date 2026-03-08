import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postJob } from '../api/userApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const PostJobPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    salary: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await postJob(formData);
      toast.success('Job posted successfully!');
      navigate('/jobs');
    } catch (err) {
      toast.error('Failed to post job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-job-page">
      <div className="post-job-header">
        <div className="navbar-container">
          <button className="back-btn" onClick={() => navigate('/jobs')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Jobs</span>
          </button>
          <h2>Post a Job</h2>
        </div>
      </div>

      <div className="post-job-container">
        <div className="linkedin-card post-job-form-card">
          <div className="form-intro">
            <div className="icon-circle">
                <FontAwesomeIcon icon={faBriefcase} />
            </div>
            <h3>Reach the right candidates</h3>
            <p>Fill out the details below to post your job opportunity.</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-job-form">
            <div className="form-section">
              <h4>Role Details</h4>
              <div className="input-group">
                <label>Job Title*</label>
                <input 
                  name="title" 
                  required 
                  value={formData.title} 
                  onChange={handleChange} 
                  placeholder="e.g. Senior Software Engineer" 
                />
              </div>
              <div className="input-row">
                <div className="input-group flex-1">
                  <label>Company*</label>
                  <input 
                    name="company" 
                    required 
                    value={formData.company} 
                    onChange={handleChange} 
                    placeholder="e.g. Microsoft" 
                  />
                </div>
                <div className="input-group flex-1">
                  <label>Location*</label>
                  <input 
                    name="location" 
                    required 
                    value={formData.location} 
                    onChange={handleChange} 
                    placeholder="e.g. Remote or London, UK" 
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Job Description & Compensation</h4>
              <div className="input-group">
                <label>Description*</label>
                <textarea 
                  name="description" 
                  rows="8" 
                  required
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="What are the responsibilities and requirements for this role?"
                ></textarea>
              </div>
              <div className="input-group">
                <label>Salary (Optional)</label>
                <input 
                  name="salary" 
                  value={formData.salary} 
                  onChange={handleChange} 
                  placeholder="e.g. $100,000 - $130,000 per year" 
                />
              </div>
            </div>

            <div className="form-footer">
              <button type="button" onClick={() => navigate('/jobs')} className="secondary-button cancel-btn">Cancel</button>
              <button type="submit" className="primary-button submit-job-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJobPage;
