import React, { useState, useEffect } from 'react';
import { getJobs, searchJobs, applyToJob, getMyApplications } from '../api/userApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBuilding, faCheckCircle, faBriefcase, faList, faBookmark } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [jobsList, apps] = await Promise.all([getJobs(), getMyApplications()]);
      setJobs(jobsList);
      setMyApps(apps);
      if (jobsList.length > 0) setSelectedJob(jobsList[0]);
    } catch (err) {
      toast.error('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = searchQuery.trim() ? await searchJobs(searchQuery) : await getJobs();
      setJobs(data);
      if (data.length > 0) setSelectedJob(data[0]);
      else setSelectedJob(null);
    } catch (err) {
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    setApplying(true);
    try {
      await applyToJob(jobId);
      toast.success('Application submitted!');
      const apps = await getMyApplications();
      setMyApps(apps);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  const isApplied = (jobId) => myApps.some(app => app.jobId === jobId);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-layout three-column-grid">
      {/* Column 1: Left Sidebar (Search & Navigation) */}
      <aside className="left-column">
        <div className="linkedin-card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>Job Search</h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="navbar-search-refined" style={{ width: '100%', marginLeft: 0 }}>
                <FontAwesomeIcon icon={faSearch} />
                <input 
                    placeholder="Search jobs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button type="submit" className="btn-primary-round" style={{ width: '100%' }}>Search</button>
          </form>
        </div>

        <div className="linkedin-card" style={{ padding: '12px 0' }}>
            <div className="stat-row">
                <span><FontAwesomeIcon icon={faBookmark} /> My Jobs</span>
            </div>
            <div className="stat-row">
                <span><FontAwesomeIcon icon={faList} /> Job Alerts</span>
            </div>
            <div className="stat-row">
                <Link to="/jobs/post" style={{ textDecoration: 'none', color: 'var(--linkedin-blue)', fontWeight: 600 }}>
                    Post a Job
                </Link>
            </div>
        </div>
      </aside>

      {/* Column 2: Middle (Job List) */}
      <main className="feed-column">
        <div className="linkedin-card" style={{ padding: 0 }}>
          <div className="card-header">
            <h3>Recent Job Postings</h3>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
            {jobs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>No jobs found</div>
            ) : (
              jobs.map(job => (
                <div 
                  key={job.id} 
                  className={`job-card-list-item ${selectedJob?.id === job.id ? 'selected' : ''}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="job-company-icon">
                    <FontAwesomeIcon icon={faBuilding} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 2px', fontSize: '15px', color: 'var(--linkedin-blue)' }}>{job.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px' }}>{job.company}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>{job.location}</p>
                    {isApplied(job.id) && (
                        <span className="applied-badge-text">Applied</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Column 3: Right (Job Details) */}
      <aside className="right-column">
        {selectedJob ? (
          <div className="linkedin-card" style={{ padding: '16px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>{selectedJob.title}</h2>
            <p style={{ fontSize: '14px', margin: 0, fontWeight: 600 }}>{selectedJob.company}</p>
            <p style={{ fontSize: '12px', color: 'var(--linkedin-secondary-text)', marginBottom: '16px' }}>{selectedJob.location}</p>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {isApplied(selectedJob.id) ? (
                <button className="btn-secondary-round" disabled style={{ width: '100%' }}>Applied</button>
              ) : (
                <button 
                  className="btn-primary-round" 
                  style={{ width: '100%' }}
                  onClick={() => handleApply(selectedJob.id)}
                  disabled={applying}
                >
                  Easy Apply
                </button>
              )}
            </div>
            
            <div style={{ borderTop: '1px solid var(--linkedin-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Description</h4>
                <p style={{ fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--linkedin-secondary-text)' }}>
                    {selectedJob.description}
                </p>
            </div>
          </div>
        ) : (
          <div className="linkedin-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--linkedin-secondary-text)' }}>
            <p>Select a job to view full details</p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default JobsPage;
