import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchUsers } from '../api/userApi';
import '../App.css';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const query = searchParams.get('q');

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await searchUsers(query);
        setResults(response.result || []);
      } catch (err) {
        setError('Failed to fetch search results.');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="main-content">
      <div className="search-results-container">
        <h2>Search Results for "{query}"</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && results.length === 0 && <p>No users found.</p>}
        <div className="user-list">
          {results.map((user) => (
            <div key={user.id} className="user-list-item">
              <img src="https://via.placeholder.com/64" alt="Profile" className="author-avatar" />
              <div className="user-info">
                <h3>{user.firstName} {user.lastName}</h3>
                <p>{user.email}</p>
              </div>
              <Link to={`/profile/${user.keycloakUserId}`} className="secondary-button">
                View Profile
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
