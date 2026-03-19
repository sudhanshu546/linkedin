import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { getAccessToken } from '../../utils/storageUtils';

interface AuthWrapperProps {
  children: ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  // The UserProvider handles the initial loading screen.
  // This component's only job is to redirect if authentication fails *after* the initial check.
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated, or null/nothing if still in a loading state
  // after the initial load (which shouldn't happen with the new context, but is safe).
  return <>{children}</>;
};

export default AuthWrapper;
