import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userSignup, userLogin } from '../../../api/userApi';
import { setTokens } from '../../../utils/storageUtils';
import { toast } from 'react-toastify';
import '../../../App.css';

const SignupPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Perform Signup
      await userSignup({ 
        firstName, 
        lastName, 
        email, 
        password 
      });
      
      toast.success('Account created successfully! Logging you in...');

      // 2. Perform Auto-Login
      const loginRes = await userLogin({
        userName: email, // Backend login takes (userName, password)
        password 
      });

      if (loginRes && loginRes.data) {
        setTokens(loginRes.data);
        navigate('/home');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(errorMessage);
      toast.error(errorMessage);
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
          <h1>Join LinkedIn</h1>
          <p>Make the most of your professional life</p>

          {error && <div style={{ color: '#d11124', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}
          
          <form onSubmit={handleSignup}>
            <div className="auth-input-item">
              <label>First name</label>
              <input
                type="text"
                className="auth-field-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="auth-input-item">
              <label>Last name</label>
              <input
                type="text"
                className="auth-field-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="auth-input-item">
              <label>Email</label>
              <input
                type="email"
                className="auth-field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-input-item">
              <label>Password (6 or more characters)</label>
              <input
                type="password"
                className="auth-field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <p style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', textAlign: 'center', margin: '16px 0' }}>
              By clicking Agree & Join, you agree to the LinkedIn User Agreement, Privacy Policy, and Cookie Policy.
            </p>

            <button type="submit" className="auth-submit-btn-large" disabled={loading}>
              {loading ? 'Joining...' : 'Agree & Join'}
            </button>
          </form>

          <div className="auth-footer-text">
            Already on LinkedIn? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;
