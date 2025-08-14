'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthTokens } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing tokens on mount
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
        
        // Get user profile
        getProfile(parsedTokens.accessToken);
      } catch (error) {
        console.error('Error parsing stored tokens:', error);
        localStorage.removeItem('auth_tokens');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const getProfile = async (accessToken: string) => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error getting profile:', error);
      // Token might be expired, try to refresh
      if (tokens?.refreshToken) {
        try {
          await refreshToken();
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        const { user: userData, tokens: authTokens } = response.data.data;
        
        setUser(userData);
        setTokens(authTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(authTokens));
        
        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${authTokens.accessToken}`;
        console.log('Login successful for user:', userData.firstName);
        return true;
      } else {
        console.error('Login failed:', response.data.error);
        return false;
      }
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed');
      }
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('Attempting registration for:', userData.email);
      const response = await api.post('/auth/register', userData);
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        const { user: userData, tokens: authTokens } = response.data.data;
        
        setUser(userData);
        setTokens(authTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(authTokens));
        
        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${authTokens.accessToken}`;
        console.log('Registration successful for user:', userData.firstName);
        return true;
      } else {
        console.error('Registration failed:', response.data.error);
        return false;
      }
    } catch (error: any) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Registration failed');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
    delete api.defaults.headers.common['Authorization'];
  };

  const refreshToken = async () => {
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post('/auth/refresh', {
        refreshToken: tokens.refreshToken
      });
      
      if (response.data.success) {
        const newTokens = {
          ...tokens,
          accessToken: response.data.data.accessToken,
          expiresIn: response.data.data.expiresIn
        };
        
        setTokens(newTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    login,
    register,
    logout,
    refreshToken,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
