import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/userApi';
import '../App.css';

const LoginPage = () => {
  const [userName, setuserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(userName, password);
      const data = response.result; 
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      navigate('/home');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <header className="auth-nav-bar">
        <Link to="/" className="linkedin-auth-logo">
          Linked<span>in</span>
        </Link>
      </header>

      <main className="auth-main-content">
        <div className="auth-card-box">
          <h1>Sign in</h1>
          <p>Stay updated on your professional world</p>
          
          {error && <div style={{ color: '#d11124', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="auth-input-item">
              <label>Email or Phone</label>
              <input
                type="text"
                className="auth-field-input"
                value={userName}
                onChange={(e) => setuserName(e.target.value)}
                required
              />
            </div>
            <div className="auth-input-item">
              <label>Password</label>
              <input
                type="password"
                className="auth-field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Link to="/forgot" className="auth-secondary-link">Forgot password?</Link>
            
            <button type="submit" className="auth-submit-btn-large" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer-text">
            New to LinkedIn? <Link to="/signup">Join now</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
