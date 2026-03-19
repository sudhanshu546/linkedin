import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { userLogin } from '../../../api/userApi';
import { setTokens } from '../../../utils/storageUtils';
import { useUser } from '../../../context/UserContext';
import '../../../App.css';

const LoginPage: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { refetchUser } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await userLogin({ userName, password });
      const data = response.result;
      if (data) {
        setTokens(data);
        await refetchUser(); // Re-fetch user after login
        const from = location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
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
                onChange={(e) => setUserName(e.target.value)}
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
