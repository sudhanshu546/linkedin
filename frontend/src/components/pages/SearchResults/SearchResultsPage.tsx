import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchUsersES, searchJobsES } from '../../../api/searchApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faSearch, faFilter, faBriefcase, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import { User, Job, ProfileDTO } from '../../../types';

interface PeopleResult extends Partial<User> {
  profile?: Partial<ProfileDTO>;
  resultType: 'people';
}

interface JobResult extends Partial<Job> {
  resultType: 'job';
}

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [peopleResults, setPeopleResults] = useState<PeopleResult[]>([]);
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  
  const query = searchParams.get('q') || '';
  const activeTab = searchParams.get('type') || 'all';
  
  // Filter states from URL
  const city = searchParams.get('city') || '';
  const company = searchParams.get('company') || '';
  const jobType = searchParams.get('jobType') || '';
  const headline = searchParams.get('headline') || '';

  const PAGE_SIZE = 10;

  const performSearch = useCallback(async (isInitial: boolean = true) => {
    if (isInitial) {
        setLoading(true);
        setPage(0);
        setHasMore(true);
    } else {
        setLoadingMore(true);
    }

    try {
      const currentPage = isInitial ? 0 : page + 1;
      
      // People Search via ES
      let people: PeopleResult[] = [];
      if ((activeTab === 'all' || activeTab === 'people') && query) {
          const esResults = await searchUsersES(query, currentPage, PAGE_SIZE);
          people = esResults.map(u => ({
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              profile: {
                  headline: u.headline,
                  skills: u.skills,
                  city: u.city,
                  state: u.state,
                  currentCompany: u.currentCompany,
                  designation: u.designation
              },
              resultType: 'people'
          } as PeopleResult));
      }

      // Job Search via ES
      let jobs: JobResult[] = [];
      if ((activeTab === 'all' || activeTab === 'jobs') && query) {
          const esJobs = await searchJobsES(query, currentPage, PAGE_SIZE);
          jobs = esJobs.map(j => ({
              id: j.id,
              title: j.title,
              company: j.company,
              location: j.location,
              jobType: j.jobType,
              description: j.description,
              resultType: 'job'
          } as JobResult));
      }

      // Apply local filters (some are redundant if ES handles them, but keeping consistency)
      if (city) {
          people = people.filter(p => p.profile?.city?.toLowerCase().includes(city.toLowerCase()));
          jobs = jobs.filter(j => j.location?.toLowerCase().includes(city.toLowerCase()));
      }
      if (company) {
          people = people.filter(p => p.profile?.currentCompany?.toLowerCase().includes(company.toLowerCase()));
          jobs = jobs.filter(j => j.company?.toLowerCase().includes(company.toLowerCase()));
      }
      if (headline) {
          people = people.filter(p => p.profile?.headline?.toLowerCase().includes(headline.toLowerCase()));
      }

      if (isInitial) {
          setPeopleResults(people);
          setJobResults(jobs);
      } else {
          setPeopleResults(prev => [...prev, ...people]);
          setJobResults(prev => [...prev, ...jobs]);
          setPage(currentPage);
      }

      // Update hasMore based on results
      if (activeTab === 'people') {
          setHasMore(people.length === PAGE_SIZE);
      } else if (activeTab === 'jobs') {
          setHasMore(jobs.length === PAGE_SIZE);
      } else {
          // For 'all' tab, we don't really do infinite scroll in the same way, 
          // but we could if we wanted to. Usually 'all' is just a preview.
          setHasMore(false); 
      }

    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, city, company, headline, activeTab, page]);

  useEffect(() => {
    performSearch(true);
  }, [query, city, company, headline, activeTab , performSearch]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) {
              performSearch(false);
          }
      });
      if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, performSearch]);

  const handleTabChange = (type: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('type', type);
      setSearchParams(newParams);
  };

  const handleFilterChange = (name: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) newParams.set(name, value);
      else newParams.delete(name);
      setSearchParams(newParams);
  };

  const renderPeopleCard = (user: PeopleResult, index: number, array: PeopleResult[]) => (
    <div 
        key={user.id} 
        ref={activeTab === 'people' && index === array.length - 1 ? lastElementRef : null}
        className="result-card-item" 
        style={{ display: 'flex', padding: '16px', borderBottom: '1px solid #eee', gap: '12px' }}
    >
      <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ color: '#adb3b8' }} />
      <div style={{ flex: 1 }}>
        <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h4 style={{ margin: 0, color: '#0a66c2', fontSize: '16px', fontWeight: 600 }}>{user.firstName} {user.lastName}</h4>
        </Link>
        <p style={{ margin: '2px 0', fontSize: '14px', color: '#666' }}>{user.profile?.headline || 'LinkedIn Member'}</p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
            {user.profile?.city}{user.profile?.city && user.profile?.state ? ', ' : ''}{user.profile?.state}
            {user.profile?.currentCompany ? ` • Currently at ${user.profile.currentCompany}` : ''}
        </p>
      </div>
      <div style={{ alignSelf: 'center' }}>
        <Link to={`/profile/${user.id}`} className="btn-secondary-round" style={{ padding: '4px 16px', borderRadius: '20px', border: '1px solid #0a66c2', color: '#0a66c2', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            View Profile
        </Link>
      </div>
    </div>
  );

  const renderJobCard = (job: JobResult, index: number, array: JobResult[]) => (
    <div 
        key={job.id} 
        ref={activeTab === 'jobs' && index === array.length - 1 ? lastElementRef : null}
        className="result-card-item" 
        style={{ display: 'flex', padding: '16px', borderBottom: '1px solid #eee', gap: '12px' }}
    >
      <div className="job-result-icon" style={{ width: '48px', height: '48px', backgroundColor: '#f3f2ef', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', color: '#666' }}>
        <FontAwesomeIcon icon={faBriefcase} />
      </div>
      <div style={{ flex: 1 }}>
        <Link to={`/jobs`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h4 style={{ margin: 0, color: '#0a66c2', fontSize: '16px', fontWeight: 600 }}>{job.title}</h4>
        </Link>
        <p style={{ margin: '2px 0', fontSize: '14px', color: 'var(--linkedin-text)' }}>{job.company}</p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
            <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '4px' }} />
            {job.location} ({job.jobType?.replace('_', ' ')})
        </p>
      </div>
      <div style={{ alignSelf: 'center' }}>
        <Link to={`/jobs`} className="btn-secondary-round" style={{ padding: '4px 16px', borderRadius: '20px', border: '1px solid #0a66c2', color: '#0a66c2', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            View Job
        </Link>
      </div>
    </div>
  );

  if (loading && page === 0) return (
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
            <label style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 600 }}>Location</label>
            <input 
                className="filter-input"
                placeholder="City or state"
                defaultValue={city}
                onBlur={(e) => handleFilterChange('city', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div className="filter-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 600 }}>Company</label>
            <input 
                className="filter-input"
                placeholder="Company name"
                defaultValue={company}
                onBlur={(e) => handleFilterChange('company', e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          {(activeTab === 'all' || activeTab === 'people') && (
            <div className="filter-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 600 }}>Headline/Role</label>
                <input 
                    className="filter-input"
                    placeholder="e.g. Developer"
                    defaultValue={headline}
                    onBlur={(e) => handleFilterChange('headline', e.target.value)}
                    style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'jobs') && (
            <div className="filter-group">
                <label style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 600 }}>Job Type</label>
                <select 
                    value={jobType}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
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
          <div className="search-tabs" style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <button className={`search-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => handleTabChange('all')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', borderBottom: activeTab === 'all' ? '2px solid #057642' : 'none', fontWeight: 600, color: activeTab === 'all' ? '#057642' : '#666', cursor: 'pointer' }}>All</button>
              <button className={`search-tab ${activeTab === 'people' ? 'active' : ''}`} onClick={() => handleTabChange('people')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', borderBottom: activeTab === 'people' ? '2px solid #057642' : 'none', fontWeight: 600, color: activeTab === 'people' ? '#057642' : '#666', cursor: 'pointer' }}>People</button>
              <button className={`search-tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => handleTabChange('jobs')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', borderBottom: activeTab === 'jobs' ? '2px solid #057642' : 'none', fontWeight: 600, color: activeTab === 'jobs' ? '#057642' : '#666', cursor: 'pointer' }}>Jobs</button>
          </div>

          <div className="card-header" style={{ padding: '16px', borderBottom: 'none' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{query ? `Results for "${query}"` : 'Search results'}</h3>
          </div>

          <div className="results-container">
              {activeTab === 'all' && (
                  <>
                    {peopleResults.length > 0 && (
                        <div className="results-section">
                            <div style={{ padding: '8px 16px', backgroundColor: '#f9fafb', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #f3f2ef' }}>People</div>
                            {peopleResults.slice(0, 3).map((p, i, a) => renderPeopleCard(p, i, a))}
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
                            {jobResults.slice(0, 3).map((j, i, a) => renderJobCard(j, i, a))}
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
                      {peopleResults.length > 0 ? peopleResults.map((p, i, a) => renderPeopleCard(p, i, a)) : (
                          <div style={{ textAlign: 'center', padding: '48px' }}>
                              <p>No people found.</p>
                          </div>
                      )}
                      {loadingMore && <div style={{ textAlign: 'center', padding: '16px' }}><div className="spinner-small"></div></div>}
                  </div>
              )}

              {activeTab === 'jobs' && (
                  <div className="job-results">
                      {jobResults.length > 0 ? jobResults.map((j, i, a) => renderJobCard(j, i, a)) : (
                          <div style={{ textAlign: 'center', padding: '48px' }}>
                              <p>No jobs found.</p>
                          </div>
                      )}
                      {loadingMore && <div style={{ textAlign: 'center', padding: '16px' }}><div className="spinner-small"></div></div>}
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
