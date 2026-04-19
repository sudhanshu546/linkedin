/**
 * Main App Component (TypeScript)
 * Updated to use new project structure with relative paths
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthWrapper from './components/common/AuthWrapper';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import './Forms.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Lazy load pages from central index
const LoginPage = lazy(() => import('./components/pages/Login/LoginPage'));
const SignupPage = lazy(() => import('./components/pages/Signup/SignupPage'));
const HomePage = lazy(() => import('./components/pages/Home/HomePage'));
const ProfilePage = lazy(() => import('./components/pages/Profile/ProfilePage'));
const JobsPage = lazy(() => import('./components/pages/Jobs/JobsPage'));
const MessagingPage = lazy(() => import('./components/pages/Messaging/MessagingPage'));

// Migrated Pages
const EditProfilePage = lazy(() => import('./components/pages/EditProfile/EditProfilePage'));
const MyNetworkPage = lazy(() => import('./components/pages/MyNetwork/MyNetworkPage'));
const PostJobPage = lazy(() => import('./components/pages/PostJob/PostJobPage'));
const JobManagementPage = lazy(() => import('./components/pages/JobManagement/JobManagementPage'));
const NotificationsPage = lazy(() => import('./components/pages/Notifications/NotificationsPage'));
const ProfileViewsPage = lazy(() => import('./components/pages/ProfileViews/ProfileViewsPage'));
const SearchResultsPage = lazy(() => import('./components/pages/SearchResults/SearchResultsPage'));
const UserPostsPage = lazy(() => import('./components/pages/UserPosts/UserPostsPage'));

// Loading fallback
function LoadingSpinner() {
  return (
    <div className="flex-center" style={{ height: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}

function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
        <NotificationProvider>
          <ChatProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected Routes wrapped with Layout */}
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
                  path="/jobs/manage"
                  element={
                    <AuthWrapper>
                      <Layout onLogout={handleLogout}>
                        <JobManagementPage />
                      </Layout>
                    </AuthWrapper>
                  }
                />
                <Route
                  path="/profile/:userId/posts"
                  element={
                    <AuthWrapper>
                      <Layout onLogout={handleLogout}>
                        <UserPostsPage />
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
                <Route
                  path="/messaging"
                  element={
                    <AuthWrapper>
                      <Layout onLogout={handleLogout}>
                        <MessagingPage />
                      </Layout>
                    </AuthWrapper>
                  }
                />
                
                <Route path="/" element={<AuthWrapper><Navigate to="/home" replace /></AuthWrapper>} />
                <Route path="*" element={<AuthWrapper><Navigate to="/home" replace /></AuthWrapper>} />
              </Routes>
            </Suspense>
          </ChatProvider>
        </NotificationProvider>
      </UserProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
