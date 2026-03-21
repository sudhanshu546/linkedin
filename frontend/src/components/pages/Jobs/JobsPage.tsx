import React, { useState, useEffect } from 'react';
import { getAllJobs, searchJobs, applyForJob, getMyApplications, getMyPostings } from '../../../api/jobApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBuilding, faBriefcase, faList, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [myPostings, setMyPostings] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'postings'>('all');
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    location: '',
    jobType: '',
    expLevel: ''
  });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [jobsRes, appsRes, postingsRes] = await Promise.all([
          getAllJobs(),
          getMyApplications(),
          getMyPostings()
        ]);

        const jobsList = jobsRes?.content || [];
        const apps = appsRes || [];
        const postings = postingsRes || [];

        setJobs(jobsList);
        setMyApps(apps);
        setMyPostings(postings);

        if (activeTab === 'all' && jobsList.length > 0) setSelectedJob(jobsList[0]);
        else if (activeTab === 'postings' && postings.length > 0) setSelectedJob(postings[0]);
      } catch (err) {
        toast.error('Failed to load jobs.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [activeTab]);

  const handleSearch = async (e: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const filters = {
        query: searchFilters.query,
        location: searchFilters.location,
        jobType: searchFilters.jobType,
      };

      const res = (filters.query.trim() || filters.location.trim() || filters.jobType)
        ? await searchJobs(filters)
        : await getAllJobs();

      const data = res?.content || [];

      setJobs(data);
      setActiveTab('all');
      if (data.length > 0) setSelectedJob(data[0]);
      else setSelectedJob(null);
    } catch (err) {
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
  };

  const handleApply = async (jobId: string) => {
    setApplying(true);
    try {
      await applyForJob(jobId);
      toast.success('Application submitted!');
      const apps = await getMyApplications();
      setMyApps(apps || []);
    } catch (err: any) {
      toast.error('Failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  const handleTabChange = (tab: 'all' | 'postings') => {
    setActiveTab(tab);
    const list = tab === 'all' ? jobs : myPostings;
    if (list.length > 0) setSelectedJob(list[0]);
    else setSelectedJob(null);
  };

  const isApplied = (jobId: string) => myApps.some((app: any) => app.jobId === jobId);
  const isOwner = (jobId: string) => myPostings.some((p: any) => p.id === jobId);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  const displayedJobs = activeTab === 'all' ? jobs : myPostings;

  return (
    <div className="page-layout three-column-grid">
      {/* Left Column */}
      <aside className="left-column">
        <div className="linkedin-card" style={{ padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ fontSize: '16px', margin: 0, fontWeight: 600 }}>Manage my jobs</h3>
          </div>
          <div
            onClick={() => handleTabChange('all')}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              color: activeTab === 'all' ? 'black' : '#666',
              fontWeight: activeTab === 'all' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: activeTab === 'all' ? '#f3f2ef' : 'transparent',
              borderLeft: activeTab === 'all' ? '4px solid #057642' : '4px solid transparent'
            }}
          >
            <FontAwesomeIcon icon={faList} />
            <span>My Applications ({myApps.length})</span>
          </div>
          <div
            onClick={() => handleTabChange('postings')}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              color: activeTab === 'postings' ? 'black' : '#666',
              fontWeight: activeTab === 'postings' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: activeTab === 'postings' ? '#f3f2ef' : 'transparent',
              borderLeft: activeTab === 'postings' ? '4px solid #057642' : '4px solid transparent'
            }}
          >
            <FontAwesomeIcon icon={faClipboardCheck} />
            <span>My Postings ({myPostings.length})</span>
          </div>
          <Link to="/jobs/manage" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--linkedin-blue)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FontAwesomeIcon icon={faBriefcase} />
              <span>Recruiter Dashboard</span>
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
              <button type="submit" className="btn-primary-round" style={{ padding: '4px 16px', fontSize: '14px' }}>Search</button>
            </div>
          </form>
        </div>

        <div className="linkedin-card">
          <div className="card-header" style={{ borderBottom: '1px solid #eee', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              {activeTab === 'all' ? 'Jobs for you' : 'Your Job Postings'}
            </h3>
            <Link to="/jobs/post" className="btn-secondary-round" style={{ textDecoration: 'none', fontSize: '14px', padding: '4px 12px' }}>Post a job</Link>
          </div>
          <div className="job-items-list">
            {displayedJobs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                {activeTab === 'all' ? 'No jobs found.' : "You haven't posted any jobs yet."}
              </div>
            ) : displayedJobs.map(job => (
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
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {isApplied(job.id) && (
                      <span style={{ color: '#057642', fontSize: '12px', fontWeight: '600' }}>Applied</span>
                    )}
                    {isOwner(job.id) && (
                      <span style={{ color: '#0a66c2', fontSize: '12px', fontWeight: '600' }}>Your Posting</span>
                    )}
                  </div>
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
              {isOwner(selectedJob.id) ? (
                <Link to="/jobs/manage" className="btn-primary-round" style={{ textDecoration: 'none' }}>Manage Candidates</Link>
              ) : isApplied(selectedJob.id) ? (
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
