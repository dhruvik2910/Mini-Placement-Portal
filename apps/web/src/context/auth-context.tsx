'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, ApiError } from '../lib/api';
import type {
  UserDto,
  StudentProfileDto,
  TpoProfileDto,
  AuthResponse,
  StudentRegisterSchema,
  LoginSchema,
} from '@placement/shared';
import { z } from 'zod';

export type AuthUser = UserDto & {
  studentProfile?: StudentProfileDto | null;
  tpoProfile?: TpoProfileDto | null;
};

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: z.infer<typeof LoginSchema>) => Promise<void>;
  register: (data: z.infer<typeof StudentRegisterSchema>) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateLocalProfile: (profile: StudentProfileDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('placement_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const userData = await api.get<AuthUser>('/auth/me');
      setUser(userData);
    } catch {
      localStorage.removeItem('placement_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ['/login', '/register'];
    const isPublic = publicRoutes.includes(pathname);

    if (!user && !isPublic) {
      router.push('/login');
    } else if (user && isPublic) {
      router.push('/');
    } else if (user && user.role !== 'STUDENT' && pathname !== '/login') {
      // Role enforcement: this is the student portal
      console.warn('Non-student attempting to access student portal');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: z.infer<typeof LoginSchema>) => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', credentials);
      localStorage.setItem('placement_token', res.token);
      setToken(res.token);
      setUser(res.user);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: z.infer<typeof StudentRegisterSchema>) => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/register', data);
      localStorage.setItem('placement_token', res.token);
      setToken(res.token);
      setUser(res.user);
      router.push('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('placement_token');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const updateLocalProfile = (profile: StudentProfileDto) => {
    if (user) {
      setUser({
        ...user,
        studentProfile: profile,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateLocalProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
