import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchUsers, searchProfiles, getUserByInternalId, searchJobs } from '../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faSearch, faFilter, faBriefcase, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [peopleResults, setPeopleResults] = useState([]);
  const [jobResults, setJobResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const query = searchParams.get('q') || '';
  const activeTab = searchParams.get('type') || 'all';
  
  // Filter states from URL
  const city = searchParams.get('city') || '';
  const company = searchParams.get('company') || '';
  const headline = searchParams.get('headline') || '';
  const jobType = searchParams.get('jobType') || '';

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const searchTasks = [];

      // Task 1: People Search
      if (activeTab === 'all' || activeTab === 'people') {
        const peopleTask = async () => {
            let finalPeople = [];
            if (city || company || headline) {
                const profileFilters = { city, company, headline };
                const profs = await searchProfiles(profileFilters);
                finalPeople = await Promise.all(profs.map(async (p) => {
                    try {
                        const u = await getUserByInternalId(p.userId);
                        return { ...u.result, profile: p, resultType: 'people' };
                    } catch (e) {
                        return { id: p.userId, firstName: 'User', lastName: '', profile: p, resultType: 'people' };
                    }
                }));
            } else if (query) {
                const users = await searchUsers(query);
                const usersList = Array.isArray(users) ? users : (users.result || []);
                finalPeople = usersList.map(u => ({ ...u, resultType: 'people' }));
            }
            return finalPeople;
        };
        searchTasks.push(peopleTask());
      } else {
          searchTasks.push(Promise.resolve([]));
      }

      // Task 2: Job Search
      if (activeTab === 'all' || activeTab === 'jobs') {
        const jobTask = async () => {
            const jobFilters = {};
            if (query) jobFilters.title = query;
            if (city) jobFilters.location = city;
            if (company) jobFilters.company = company;
            if (jobType) jobFilters.jobType = jobType;

            const jobs = await searchJobs(jobFilters);
            const jobsList = Array.isArray(jobs) ? jobs : (jobs.result || []);
            return jobsList.map(j => ({ ...j, resultType: 'job' }));
        };
        searchTasks.push(jobTask());
      } else {
          searchTasks.push(Promise.resolve([]));
      }

      const [people, jobs] = await Promise.all(searchTasks);
      setPeopleResults(people);
      setJobResults(jobs);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, city, company, headline, jobType, activeTab]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleTabChange = (type) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('type', type);
      setSearchParams(newParams);
  };

  const handleFilterChange = (name, value) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) newParams.set(name, value);
      else newParams.delete(name);
      setSearchParams(newParams);
  };

  const renderPeopleCard = (user) => (
    <div key={user.id} className="result-card-item">
      <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ color: '#adb3b8' }} />
      <div style={{ marginLeft: '12px', flex: 1 }}>
        <Link to={`/profile/${user.keycloakUserId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h4 style={{ margin: 0, color: 'var(--linkedin-blue)', fontSize: '16px' }}>{user.firstName} {user.lastName}</h4>
        </Link>
        <p style={{ margin: '2px 0', fontSize: '14px', color: '#666' }}>{user.profile?.headline || 'LinkedIn Member'}</p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
            {user.profile?.city}{user.profile?.city && user.profile?.state ? ', ' : ''}{user.profile?.state}
            {user.profile?.currentCompany ? ` • Currently at ${user.profile.currentCompany}` : ''}
        </p>
      </div>
      <div style={{ alignSelf: 'center' }}>
        <Link to={`/profile/${user.keycloakUserId}`} className="btn-secondary-round">
            View Profile
        </Link>
      </div>
    </div>
  );

  const renderJobCard = (job) => (
    <div key={job.id} className="result-card-item">
      <div className="job-result-icon">
        <FontAwesomeIcon icon={faBriefcase} />
      </div>
      <div style={{ marginLeft: '12px', flex: 1 }}>
        <Link to={`/jobs`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h4 style={{ margin: 0, color: 'var(--linkedin-blue)', fontSize: '16px' }}>{job.title}</h4>
        </Link>
        <p style={{ margin: '2px 0', fontSize: '14px', color: 'var(--linkedin-text)' }}>{job.company}</p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
            <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '4px' }} />
            {job.location} ({job.jobType})
        </p>
      </div>
      <div style={{ alignSelf: 'center' }}>
        <Link to={`/jobs`} className="btn-secondary-round">
            View Job
        </Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-layout three-column-grid">
      <aside className="left-column">
        <div className="linkedin-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FontAwesomeIcon icon={faFilter} style={{ color: '#666' }} />
            <h3 style={{ fontSize: '16px', margin: 0 }}>Filters</h3>
          </div>
          
          <div className="filter-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Location</label>
            <input 
                className="filter-input"
                placeholder="City or state"
                defaultValue={city}
                onBlur={(e) => handleFilterChange('city', e.target.value)}
                style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div className="filter-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Company</label>
            <input 
                className="filter-input"
                placeholder="Company name"
                defaultValue={company}
                onBlur={(e) => handleFilterChange('company', e.target.value)}
                style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          {(activeTab === 'all' || activeTab === 'people') && (
            <div className="filter-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Headline/Role</label>
                <input 
                    className="filter-input"
                    placeholder="e.g. Developer"
                    defaultValue={headline}
                    onBlur={(e) => handleFilterChange('headline', e.target.value)}
                    style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'jobs') && (
            <div className="filter-group">
                <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Job Type</label>
                <select 
                    value={jobType}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">All Types</option>
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                </select>
            </div>
          )}
        </div>
      </aside>

      <main className="feed-column">
        <div className="linkedin-card">
          <div className="search-tabs">
              <button className={`search-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => handleTabChange('all')}>All</button>
              <button className={`search-tab ${activeTab === 'people' ? 'active' : ''}`} onClick={() => handleTabChange('people')}>People</button>
              <button className={`search-tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => handleTabChange('jobs')}>Jobs</button>
          </div>

          <div className="card-header" style={{ borderBottom: 'none' }}>
            <h3 style={{ fontSize: '18px' }}>{query ? `Results for "${query}"` : 'Search results'}</h3>
          </div>

          <div className="results-container">
              {activeTab === 'all' && (
                  <>
                    {peopleResults.length > 0 && (
                        <div className="results-section">
                            <div style={{ padding: '8px 16px', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #f3f2ef' }}>People</div>
                            {peopleResults.slice(0, 3).map(renderPeopleCard)}
                            {peopleResults.length > 3 && (
                                <button className="btn-subtle" onClick={() => handleTabChange('people')} style={{ width: '100%', padding: '12px', border: 'none', background: 'none', color: '#666', fontWeight: 600, cursor: 'pointer' }}>
                                    See all people results
                                </button>
                            )}
                        </div>
                    )}
                    {jobResults.length > 0 && (
                        <div className="results-section" style={{ marginTop: peopleResults.length > 0 ? '16px' : 0 }}>
                            <div style={{ padding: '8px 16px', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #f3f2ef' }}>Jobs</div>
                            {jobResults.slice(0, 3).map(renderJobCard)}
                            {jobResults.length > 3 && (
                                <button className="btn-subtle" onClick={() => handleTabChange('jobs')} style={{ width: '100%', padding: '12px', border: 'none', background: 'none', color: '#666', fontWeight: 600, cursor: 'pointer' }}>
                                    See all job results
                                </button>
                            )}
                        </div>
                    )}
                    {peopleResults.length === 0 && jobResults.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '48px' }}>
                            <FontAwesomeIcon icon={faSearch} size="3x" style={{ color: '#ccc', marginBottom: '16px' }} />
                            <p>No results found matching your search.</p>
                        </div>
                    )}
                  </>
              )}

              {activeTab === 'people' && (
                  <div className="people-results">
                      {peopleResults.length > 0 ? peopleResults.map(renderPeopleCard) : (
                          <div style={{ textAlign: 'center', padding: '48px' }}>
                              <p>No people found.</p>
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'jobs' && (
                  <div className="job-results">
                      {jobResults.length > 0 ? jobResults.map(renderJobCard) : (
                          <div style={{ textAlign: 'center', padding: '48px' }}>
                              <p>No jobs found.</p>
                          </div>
                      )}
                  </div>
              )}
          </div>
        </div>
      </main>

      <aside className="right-column">
          <div className="linkedin-card" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Search Tips</h4>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                  <li>Use keywords like "Developer" or "Manager"</li>
                  <li>Filter by city to find local opportunities</li>
                  <li>Toggle between tabs to narrow your search</li>
              </ul>
          </div>
      </aside>
    </div>
  );
};

export default SearchResultsPage;
