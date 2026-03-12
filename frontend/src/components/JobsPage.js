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
  const [searchFilters, setSearchFilters] = useState({
      query: '',
      location: '',
      jobType: '',
      expLevel: ''
  });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([getJobs(), getMyApplications()]);
      
      const jobsList = Array.isArray(jobsRes) ? jobsRes : (jobsRes?.result || []);
      const apps = Array.isArray(appsRes) ? appsRes : (appsRes?.result || []);
      
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
    e?.preventDefault();
    setLoading(true);
    try {
      // Filter out empty strings
      const activeFilters = Object.fromEntries(
        Object.entries(searchFilters).filter(([_, v]) => v !== '')
      );
      
      const res = Object.keys(activeFilters).length > 0 
        ? await searchJobs(activeFilters) 
        : await getJobs();

      const data = Array.isArray(res) ? res : (res?.result || []);

      setJobs(data);
      if (data.length > 0) setSelectedJob(data[0]);
      else setSelectedJob(null);
    } catch (err) {
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const onFilterChange = (e) => {
      setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
  };

  const handleApply = async (jobId) => {
    setApplying(true);
    try {
      await applyToJob(jobId);
      toast.success('Application submitted!');
      const appsRes = await getMyApplications();
      const apps = Array.isArray(appsRes) ? appsRes : (appsRes?.result || []);
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
      {/* Left Column */}
      <aside className="left-column">
        <div className="linkedin-card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>Manage my jobs</h3>
          <div style={{ fontSize: '14px', color: 'var(--linkedin-blue)', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}>
            My Applications ({myApps.length})
          </div>
          <Link to="/jobs/manage" style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: '14px', color: 'var(--linkedin-blue)', fontWeight: 600, cursor: 'pointer' }}>
              Job Management (Recruiter)
              </div>
          </Link>
        </div>
      </aside>

      {/* Middle Column */}
      <main className="feed-column">
        <div className="linkedin-card" style={{ padding: '12px 16px' }}>
          <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#eef3f8', borderRadius: '4px', padding: '0 12px', marginBottom: '12px' }}>
                <FontAwesomeIcon icon={faSearch} style={{ color: '#666' }} />
                <input 
                  name="query"
                  placeholder="Search by title or company" 
                  value={searchFilters.query}
                  onChange={onFilterChange}
                  style={{ background: 'transparent', border: 'none', padding: '10px', flex: 1, outline: 'none', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input 
                    name="location"
                    placeholder="Location"
                    value={searchFilters.location}
                    onChange={onFilterChange}
                    style={{ flex: 1, padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
                  />
                  <select 
                    name="jobType" 
                    value={searchFilters.jobType} 
                    onChange={onFilterChange}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', color: '#666' }}
                  >
                      <option value="">Job Type</option>
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="REMOTE">Remote</option>
                  </select>
                  <select 
                    name="expLevel" 
                    value={searchFilters.expLevel} 
                    onChange={onFilterChange}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', color: '#666' }}
                  >
                      <option value="">Experience</option>
                      <option value="ENTRY_LEVEL">Entry Level</option>
                      <option value="MID_LEVEL">Mid Level</option>
                      <option value="SENIOR">Senior</option>
                  </select>
                  <button type="submit" className="btn-primary-round" style={{ padding: '4px 16px', fontSize: '14px' }}>Search</button>
              </div>
          </form>
        </div>

        <div className="linkedin-card">
          <div className="card-header" style={{ borderBottom: '1px solid #eee', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Jobs for you</h3>
            <Link to="/jobs/post" className="btn-secondary-round" style={{ textDecoration: 'none', fontSize: '14px', padding: '4px 12px' }}>Post a job</Link>
          </div>
          <div className="job-items-list">
            {jobs.length === 0 ? (
               <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No jobs found.</div>
            ) : jobs.map(job => (
              <div 
                key={job.id} 
                className={`job-item ${selectedJob?.id === job.id ? 'active' : ''}`}
                onClick={() => setSelectedJob(job)}
                style={{ padding: '12px 16px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', gap: '12px' }}
              >
                <div style={{ width: '48px', height: '48px', background: '#f3f2ef', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '24px', color: '#666' }}>
                  <FontAwesomeIcon icon={faBuilding} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', color: 'var(--linkedin-blue)', fontWeight: 600 }}>{job.title}</h4>
                  <p style={{ margin: 0, fontSize: '13px' }}>{job.company}</p>
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

      {/* Right Column */}
      <aside className="right-column">
        {selectedJob ? (
          <div className="linkedin-card" style={{ padding: '16px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>{selectedJob.title}</h2>
            <p style={{ fontSize: '14px', margin: 0 }}>{selectedJob.company} • {selectedJob.location}</p>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              {isApplied(selectedJob.id) ? (
                <button className="btn-secondary-round" disabled style={{ opacity: 0.6 }}>Applied</button>
              ) : (
                <button className="btn-primary-round" onClick={() => handleApply(selectedJob.id)} disabled={applying}>
                  {applying ? 'Applying...' : 'Easy Apply'}
                </button>
              )}
            </div>
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>About the job</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--linkedin-text)' }}>{selectedJob.description}</p>
            </div>
          </div>
        ) : (
          <div className="linkedin-card" style={{ padding: '32px 16px', textAlign: 'center' }}>
            <FontAwesomeIcon icon={faBriefcase} size="3x" style={{ marginBottom: '16px', opacity: 0.2 }} />
            <p style={{ color: '#666' }}>Select a job to view details</p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default JobsPage;
