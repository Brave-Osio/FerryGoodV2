'use client';
// lib/auth-context.tsx — Global auth state via React Context
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { authAPI, getErrorMessage } from './api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isRegister: boolean;
  isClient: boolean;
  canWrite: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('fg_token');
    const storedUser  = localStorage.getItem('fg_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('fg_token');
        localStorage.removeItem('fg_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authAPI.login(username, password);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('fg_token', newToken);
    localStorage.setItem('fg_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem('fg_token');
    localStorage.removeItem('fg_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin    = user?.role === 'admin';
  const isRegister = user?.role === 'register';
  const isClient   = user?.role === 'client';
  const canWrite   = isAdmin || isRegister;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isRegister, isClient, canWrite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}