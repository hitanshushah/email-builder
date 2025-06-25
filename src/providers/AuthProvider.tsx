import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { fetchUser, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (!data.authenticated && isAuthenticated) {
          console.log('User authentication lost, logging out...');
          logout();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        if (isAuthenticated) {
          logout();
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  return <>{children}</>;
}; 