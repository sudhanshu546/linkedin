import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchUsers, searchProfiles, getUserByInternalId } from '../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const query = searchParams.get('q') || '';
  
  // Filter states
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [company, setCompany] = useState(searchParams.get('company') || '');
  const [headline, setHeadline] = useState(searchParams.get('headline') || '');

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        let finalResults = [];
        
        // If we have filters, use searchProfiles
        if (city || company || headline) {
            const profileFilters = { city, company, headline };
            if (query) profileFilters.headline = query; // Use query as headline filter if present
            
            const profs = await searchProfiles(profileFilters);
            
            // For each profile, fetch user details to get firstName/lastName/email
            finalResults = await Promise.all(profs.map(async (p) => {
                try {
                    const u = await getUserByInternalId(p.userId);
                    return { ...u.result, profile: p };
                } catch (e) {
                    return { id: p.userId, firstName: 'User', lastName: '', profile: p };
                }
            }));
        } else if (query) {
            // Standard name-based search
            const users = await searchUsers(query);
            finalResults = Array.isArray(users) ? users : (users.result || []);
        }

        setResults(finalResults);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [query, city, company, headline]);

  const handleFilterChange = (name, value) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) newParams.set(name, value);
      else newParams.delete(name);
      setSearchParams(newParams);
  };

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
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>City</label>
            <input 
                className="filter-input"
                placeholder="Filter by city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={(e) => handleFilterChange('city', e.target.value)}
                style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div className="filter-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Company</label>
            <input 
                className="filter-input"
                placeholder="Filter by company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onBlur={(e) => handleFilterChange('company', e.target.value)}
                style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div className="filter-group">
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Role/Headline</label>
            <input 
                className="filter-input"
                placeholder="Filter by headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                onBlur={(e) => handleFilterChange('headline', e.target.value)}
                style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>
      </aside>

      <main className="feed-column">
        <div className="linkedin-card">
          <div className="card-header">
            <h3>{query ? `Search results for "${query}"` : 'Filtered results'}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>{results.length} results found</p>
          </div>
          {results.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '48px' }}>
              <FontAwesomeIcon icon={faSearch} size="3x" style={{ color: '#ccc', marginBottom: '16px' }} />
              <p>No results found for your filters.</p>
            </div>
          ) : (
            <div className="search-results-list">
              {results.map((user) => (
                <div key={user.id} className="search-result-item" style={{ display: 'flex', padding: '16px', borderBottom: '1px solid #f3f2ef', alignItems: 'center' }}>
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
                  <Link to={`/profile/${user.keycloakUserId}`} className="btn-secondary-round">
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <aside className="right-column">
          <div className="linkedin-card" style={{ padding: '12px' }}>
              <p style={{ fontSize: '12px', color: '#666' }}>LinkedIn Clone Search Upgrade: You can now filter by location and company!</p>
          </div>
      </aside>
    </div>
  );
};

export default SearchResultsPage;
