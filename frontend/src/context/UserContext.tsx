import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { getAuthenticatedUser } from '../api/userApi';
import { UserDetail } from '../types';
import { getAccessToken, clearTokens } from '../utils/storageUtils';

// Define the shape of the context
interface UserContextType {
  user: UserDetail | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
  logout: () => void;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create the provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const refetchUser = async () => {
    // Only fetch if a token exists
    if (!getAccessToken()) {
      setUser(null);
      setIsInitialLoading(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userData = await getAuthenticatedUser();
      setUser(userData || null);
    } catch (error) {
      console.error('Authentication check failed:', error);
      setUser(null);
    } finally {
      setIsInitialLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []); // Run only once on initial mount

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  // Memoize the context value
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    refetchUser,
    logout,
  }), [user, isLoading]);

  // Only block initial render
  if (isInitialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f2ef' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
