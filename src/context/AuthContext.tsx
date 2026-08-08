import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, LoginCredentials, RegisterCredentials } from '../types';
import { authAPI } from '../services/api';

// Fallback storage for web or when AsyncStorage is not available
const fallbackStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    }
  },
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setAuthData: (token: string, user: User) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      // Try AsyncStorage first
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('AsyncStorage not available, using fallback:', error);
      // Fallback to web storage or continue without stored data
      try {
        const storedToken = await fallbackStorage.getItem('token');
        const storedUser = await fallbackStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      let response;
      
      if (credentials.token) {
        // OTP login - token already provided
        response = credentials.user;
      } else {
        // Password login
        response = await authAPI.login(credentials.email, credentials.password);
      }
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server');
      }
      
      try {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response));
      } catch (storageError) {
        console.error('AsyncStorage failed, using fallback:', storageError);
        await fallbackStorage.setItem('token', response.token);
        await fallbackStorage.setItem('user', JSON.stringify(response));
      }
      
      setToken(response.token);
      setUser(response);
    } catch (error: any) {
      // Clear any existing auth data on login failure
      console.error('Login failed, clearing auth data:', error);
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await authAPI.register(credentials.name, credentials.email, credentials.password);
      
      try {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response));
      } catch (storageError) {
        console.error('AsyncStorage failed, using fallback:', storageError);
        await fallbackStorage.setItem('token', response.token);
        await fallbackStorage.setItem('user', JSON.stringify(response));
      }
      
      setToken(response.token);
      setUser(response);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (storageError) {
        console.error('AsyncStorage failed, using fallback:', storageError);
        await fallbackStorage.removeItem('token');
        await fallbackStorage.removeItem('user');
      }
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const setAuthData = async (authToken: string, authUser: User) => {
    try {
      if (!authToken || !authUser) {
        throw new Error('Invalid auth data: token and user are required');
      }
      
      try {
        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
      } catch (storageError) {
        console.error('AsyncStorage failed, using fallback:', storageError);
        await fallbackStorage.setItem('token', authToken);
        await fallbackStorage.setItem('user', JSON.stringify(authUser));
      }
      
      setToken(authToken);
      setUser(authUser);
    } catch (error) {
      console.error('Error setting auth data:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    setAuthData,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
