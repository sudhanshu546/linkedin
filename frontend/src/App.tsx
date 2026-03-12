/**
 * Main App Component (TypeScript)
 * Updated to use new project structure
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from '@/context/UserContext';
import { NotificationProvider } from '@/context/NotificationContext';
import AuthWrapper from '@/components/AuthWrapper';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import '@/styles/index.css';

// Lazy load pages (code splitting)
const LoginPage = React.lazy(() => import('@/components/pages/Login/LoginPage'));
const SignupPage = React.lazy(() => import('@/components/pages/Signup/SignupPage'));
const HomePage = React.lazy(() => import('@/components/pages/Home/HomePage'));
const Feed = React.lazy(() => import('@/components/pages/Feed/Feed'));
const ProfilePage = React.lazy(() => import('@/components/pages/Profile/ProfilePage'));
const EditProfilePage = React.lazy(() => import('@/components/pages/Profile/EditProfilePage'));
const JobsPage = React.lazy(() => import('@/components/pages/Jobs/JobsPage'));
const PostJobPage = React.lazy(() => import('@/components/pages/Jobs/PostJobPage'));
const JobManagementPage = React.lazy(() => import('@/components/pages/Jobs/JobManagementPage'));
const MyNetworkPage = React.lazy(() => import('@/components/pages/Network/MyNetworkPage'));
const NotificationsPage = React.lazy(() => import('@/components/pages/Notifications/NotificationsPage'));
const ProfileViewsPage = React.lazy(() => import('@/components/pages/ProfileViews/ProfileViewsPage'));
const SearchResultsPage = React.lazy(() => import('@/components/pages/Search/SearchResultsPage'));

// Loading fallback
function LoadingSpinner() {
  return (
    <div className="flex-center" style={{ height: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Suspense fallback={<LoadingSpinner />}><LoginPage /></Suspense>} />
            <Route path="/signup" element={<Suspense fallback={<LoadingSpinner />}><SignupPage /></Suspense>} />

            {/* Protected Routes */}
            <Route element={<AuthWrapper />}>
              <Route path="/" element={<Suspense fallback={<LoadingSpinner />}><HomePage /></Suspense>} />
              <Route path="/feed" element={<Suspense fallback={<LoadingSpinner />}><Feed /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<LoadingSpinner />}><ProfilePage /></Suspense>} />
              <Route path="/profile/:userId" element={<Suspense fallback={<LoadingSpinner />}><ProfilePage /></Suspense>} />
              <Route path="/profile/edit" element={<Suspense fallback={<LoadingSpinner />}><EditProfilePage /></Suspense>} />
              <Route path="/network" element={<Suspense fallback={<LoadingSpinner />}><MyNetworkPage /></Suspense>} />
              <Route path="/notifications" element={<Suspense fallback={<LoadingSpinner />}><NotificationsPage /></Suspense>} />
              <Route path="/profile-views" element={<Suspense fallback={<LoadingSpinner />}><ProfileViewsPage /></Suspense>} />
              <Route path="/jobs" element={<Suspense fallback={<LoadingSpinner />}><JobsPage /></Suspense>} />
              <Route path="/jobs/post" element={<Suspense fallback={<LoadingSpinner />}><PostJobPage /></Suspense>} />
              <Route path="/jobs/manage" element={<Suspense fallback={<LoadingSpinner />}><JobManagementPage /></Suspense>} />
              <Route path="/search" element={<Suspense fallback={<LoadingSpinner />}><SearchResultsPage /></Suspense>} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
