import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { useAuth } from './useAuth';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const { user, refreshUser } = useAuth();
  const [theme, setTheme] = useState<Theme>(user?.theme || 'system');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (t: Theme) => {
      root.classList.remove('light', 'dark');
      
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(t);
      }
    };

    applyTheme(theme);
  }, [theme]);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    if (user) {
      db.saveUser({ ...user, theme: newTheme });
      refreshUser();
    }
  };

  return { theme, setTheme: updateTheme };
};
