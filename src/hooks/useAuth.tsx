import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types';
import { auth } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, github?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(auth.getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const u = await auth.login(email, pass);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, github?: string) => {
    setIsLoading(true);
    try {
      const u = await auth.register(name, email, pass, github || null);
      setUser(u);
      // Automatically login after registration
      await auth.login(email, pass);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    setUser(auth.getCurrentUser());
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
