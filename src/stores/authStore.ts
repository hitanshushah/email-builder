import { create } from 'zustand';

interface User {
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      error: null 
    });
  },
  
  setLoading: (isLoading) => {
    set({ isLoading });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  logout: () => {
    set({ 
      user: null, 
      isAuthenticated: false, 
      error: null 
    });
    window.location.href = import.meta.env.VITE_APP_LOGOUT_URL;
  },
  
  fetchUser: async () => {
    const { setUser, setLoading, setError } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      
      if (data.authenticated && data.username) {
        setUser({ username: data.username });
      } else {
        setUser(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
}));

export const fetchUsername = async (): Promise<string | null> => {
  const { fetchUser, user } = useAuthStore.getState();
  
  if (user?.username) {
    return user.username;
  }
  
  await fetchUser();
  
  const currentUser = useAuthStore.getState().user;
  return currentUser?.username || null;
};

export const isAuthenticated = (): boolean => {
  return useAuthStore.getState().isAuthenticated;
};

export const logout = (): void => {
  useAuthStore.getState().logout();
}; 