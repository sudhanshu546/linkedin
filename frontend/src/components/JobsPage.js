import React, { useState, useEffect } from 'react';
import { getJobs, searchJobs, applyToJob, getMyApplications } from '../api/userApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBuilding, faBriefcase } from '@fortawesome/free-solid-svg-icons';
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
    <div className="jobs-page-wrapper">
      <div className="jobs-header-banner">
        <div className="navbar-container">
          <form onSubmit={handleSearch} className="jobs-main-search" style={{ display: 'flex', alignItems: 'center', background: '#eef3f8', borderRadius: '4px', padding: '0 12px', width: '600px' }}>
            <FontAwesomeIcon icon={faSearch} style={{ color: '#666' }} />
            <input 
              placeholder="Search jobs" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: '10px', flex: 1, outline: 'none' }}
            />
            <button type="submit" className="btn-primary-round">Search</button>
          </form>
        </div>
      </div>

      <div className="page-layout three-column-grid">
        <aside className="left-column">
          <div className="linkedin-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>Manage my jobs</h3>
            <div style={{ fontSize: '14px', color: 'var(--linkedin-blue)', fontWeight: 600, cursor: 'pointer' }}>
              My Applications ({myApps.length})
            </div>
          </div>
        </aside>

        <main className="feed-column">
          <div className="linkedin-card">
            <div className="card-header">
              <h3>Jobs for you</h3>
              <Link to="/jobs/post" className="btn-secondary-round" style={{ textDecoration: 'none' }}>Post a job</Link>
            </div>
            <div className="job-items-list">
              {jobs.map(job => (
                <div 
                  key={job.id} 
                  className={`job-item ${selectedJob?.id === job.id ? 'active' : ''}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <div style={{ width: '48px', height: '48px', background: '#f3f2ef', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '24px', color: '#666' }}>
                    <FontAwesomeIcon icon={faBuilding} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 2px', fontSize: '16px', color: 'var(--linkedin-blue)' }}>{job.title}</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>{job.company}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>{job.location}</p>
                    {isApplied(job.id) && (
                        <span style={{ color: '#057642', fontSize: '12px', fontWeight: '600', marginTop: '4px', display: 'block' }}>Applied</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <aside className="right-column">
          {selectedJob ? (
            <div className="linkedin-card" style={{ padding: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>{selectedJob.title}</h2>
              <p style={{ fontSize: '14px', margin: 0 }}>{selectedJob.company} • {selectedJob.location}</p>
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                {isApplied(selectedJob.id) ? (
                  <button className="btn-secondary-round" disabled>Applied</button>
                ) : (
                  <button className="btn-primary-round" onClick={() => handleApply(selectedJob.id)} disabled={applying}>
                    Easy Apply
                  </button>
                )}
              </div>
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ marginBottom: '8px' }}>About the job</h4>
                <p style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{selectedJob.description}</p>
              </div>
            </div>
          ) : (
            <div className="linkedin-card" style={{ padding: '24px', textAlign: 'center' }}>
              <FontAwesomeIcon icon={faBriefcase} size="3x" style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p>Select a job to view details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default JobsPage;
