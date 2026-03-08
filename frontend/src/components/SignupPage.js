import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/userApi';
import '../App.css';

const SignupPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup({ firstName, lastName, email, password });
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container" style={{ backgroundColor: '#f3f2ef' }}>
      <header className="auth-nav-bar" style={{ justifyContent: 'center', padding: '32px 0' }}>
        <Link to="/" className="linkedin-auth-logo" style={{ fontSize: '32px' }}>
          Linked<span>in</span>
        </Link>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="auth-hero-headline">Make the most of your professional life</h1>

        <div className="auth-card-box">
          {error && <p style={{ color: '#d11124', fontSize: '14px' }}>{error}</p>}
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
