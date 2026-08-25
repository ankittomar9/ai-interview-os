import React, { createContext, useContext, useEffect, useState } from 'react';
import { type ThemeId, themes } from '../lib/themes';

export type Theme = ThemeId | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ThemeId;
  isDark: boolean;
  activeThemeDefinition: typeof themes[0];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = ['ai-interview-theme', 'theme', 'editor-theme'];

const migrateThemeName = (name: string | null): ThemeId | 'system' | null => {
  if (!name) return null;
  if (name === 'intellij-darcula' || name === 'darcula') return 'ide-slate';
  if (name === 'intellij-light') return 'ide-paper';
  if (name === 'system') return 'system';
  const found = themes.find((t) => t.id === name);
  if (found) return found.id;
  if (name === 'dark') return 'ide-slate';
  if (name === 'light') return 'light-studio';
  return null;
};

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: Theme;
}> = ({ children, defaultTheme = 'light-studio' }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      for (const key of STORAGE_KEYS) {
        const stored = localStorage.getItem(key);
        const migrated = migrateThemeName(stored);
        if (migrated) {
          if (stored !== migrated) {
            localStorage.setItem(key, migrated);
          }
          return migrated;
        }
      }
    } catch {
      // Ignored
    }
    return defaultTheme;
  });

  const getSystemTheme = (): ThemeId => {
    if (typeof window === 'undefined') return 'ide-slate';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'ide-slate'
      : 'light-studio';
  };

  const resolvedTheme: ThemeId = theme === 'system' ? getSystemTheme() : theme;
  const activeDef = themes.find((t) => t.id === resolvedTheme) || themes[0];

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const activeThemeId: ThemeId = theme === 'system' ? getSystemTheme() : theme;
      const def = themes.find((t) => t.id === activeThemeId) || themes[0];

      root.setAttribute('data-theme', activeThemeId);

      if (def.isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    try {
      for (const key of STORAGE_KEYS) {
        localStorage.setItem(key, newTheme);
      }
    } catch {
      // Ignored
    }
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        isDark: activeDef.isDark,
        activeThemeDefinition: activeDef
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
