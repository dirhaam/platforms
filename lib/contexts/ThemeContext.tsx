'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Default context value for SSR and initial render
const defaultContext: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    applyTheme(newTheme);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
      applyTheme(newTheme);
      return newTheme;
    });
  }, [applyTheme]);

  useEffect(() => {
    setMounted(true);
    
    // Get theme from localStorage or system preference
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored && (stored === 'light' || stored === 'dark')) {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = prefersDark ? 'dark' : 'light';
        setThemeState(initial);
        applyTheme(initial);
      }
    } catch (e) {
      // localStorage not available
      console.warn('localStorage not available for theme');
    }
  }, [applyTheme]);

  // Always provide context, even before mount
  const value: ThemeContextType = mounted 
    ? { theme, toggleTheme, setTheme }
    : defaultContext;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
