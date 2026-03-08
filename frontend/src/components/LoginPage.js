import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/userApi';
import '../App.css';

const LoginPage = () => {
  const [userName, setuserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { userName, password });
      const data = await login(userName, password);

      // AccessTokenResponse is wrapped in BaseResponse result
      const tokenData = data.result;
      if (tokenData && tokenData.access_token) {
        localStorage.setItem('accessToken', tokenData.access_token);
        localStorage.setItem('refreshToken', tokenData.refresh_token);
        navigate('/home');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="linkedin-logo">LinkedIn</h1>
        <h2>Sign in</h2>
        <p>Stay updated on your professional world</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userName">Email or Phone</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setuserName(e.target.value)}
              required
              aria-label="Email or Phone"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="primary-button">
            {loading ? 'Signing In...' : 'Sign in'}
          </button>
        </form>
        <p className="forgot-password">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <div className="divider">
          <span>or</span>
        </div>
        <button className="secondary-button">Join now</button>
        <p className="join-now">
          New to LinkedIn? <Link to="/signup">Join now</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
