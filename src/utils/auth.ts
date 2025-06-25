import { useAuthStore, fetchUsername, isAuthenticated, logout } from '../stores/authStore';

export { fetchUsername, isAuthenticated, logout };

export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading, error } = useAuthStore();
  return { user, isAuthenticated, isLoading, error };
};

export const useAuthActions = () => {
  const { fetchUser, logout } = useAuthStore();
  return { fetchUser, logout };
};

export const getCurrentUsername = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.username || null;
};

export const getAuthStatus = (): boolean => {
  return useAuthStore.getState().isAuthenticated;
};

export const refreshAuth = async (): Promise<void> => {
  const { fetchUser } = useAuthStore.getState();
  await fetchUser();
};

export const handleAuthError = (error: Error): void => {
  console.error('Authentication error:', error);
  logout();
}; 