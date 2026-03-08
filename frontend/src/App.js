import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProfilePage from './components/ProfilePage';
import EditProfilePage from './components/EditProfilePage';
import HomePage from './components/HomePage';
import NotificationsPage from './components/NotificationsPage';
import MyNetworkPage from './components/MyNetworkPage';
import ProfileViewsPage from './components/ProfileViewsPage';
import JobsPage from './components/JobsPage';
import PostJobPage from './components/PostJobPage';
import SearchResultsPage from './components/SearchResultsPage';
import AuthWrapper, { Layout } from './components/AuthWrapper';
import './App.css';

function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Authenticated routes wrapped with Layout */}
        <Route
          path="/home"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <HomePage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <ProfilePage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <ProfilePage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <EditProfilePage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/mynetwork"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <MyNetworkPage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/jobs"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <JobsPage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/jobs/post"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <PostJobPage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/notifications"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <NotificationsPage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/profile-views"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <ProfileViewsPage />
              </Layout>
            </AuthWrapper>
          }
        />
        <Route
          path="/search"
          element={
            <AuthWrapper>
              <Layout onLogout={handleLogout}>
                <SearchResultsPage />
              </Layout>
            </AuthWrapper>
          }
        />
        
        <Route path="/" element={<AuthWrapper><Navigate to="/home" replace /></AuthWrapper>} />
        <Route path="*" element={<AuthWrapper><Navigate to="/home" replace /></AuthWrapper>} />
      </Routes>
    </div>
  );
}

export default App;
