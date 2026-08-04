'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { IUser } from '@/types';
import { apiClient, setAccessToken, getAccessToken } from '@/lib/api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Track whether a fresh login just happened so we can skip the initial refresh
  const justLoggedInRef = useRef(false);

  const refreshUser = useCallback(async () => {
    // If user just logged in, we already have fresh tokens — skip the refresh call
    if (justLoggedInRef.current) {
      justLoggedInRef.current = false;
      setIsLoading(false);
      return;
    }

    try {
      // CRITICAL: Use a raw axios instance (NOT apiClient) for the refresh call.
      // apiClient has a 401 response interceptor that tries to refresh on 401 errors,
      // which would create an infinite loop when the refresh call itself returns 401.
      const refreshRes = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const token = refreshRes.data.data.accessToken;
      setAccessToken(token);
      setUser(refreshRes.data.data.user);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { user: userResponse, accessToken } = data.data;
    setAccessToken(accessToken);
    setUser(userResponse);
    // Mark that we just logged in so the next refreshUser call (triggered by
    // navigation/remount) doesn't race and overwrite our fresh state
    justLoggedInRef.current = true;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors — we clear local state regardless
    } finally {
      setAccessToken(null);
      setUser(null);
      justLoggedInRef.current = false;
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
