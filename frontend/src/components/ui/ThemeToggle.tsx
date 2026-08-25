import React, { useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../theme-provider';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'sm' }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = useCallback(() => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }, [theme, setTheme]);

  // Keyboard shortcut: Ctrl+Shift+L or Cmd+Shift+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        cycleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleTheme]);

  const getIcon = () => {
    if (theme === 'system') return <Monitor className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />;
    if (theme === 'light') return <Sun className={size === 'sm' ? 'w-3.5 h-3.5 text-amber-500' : 'w-4 h-4 text-amber-500'} />;
    return <Moon className={size === 'sm' ? 'w-3.5 h-3.5 text-primary' : 'w-4 h-4 text-primary'} />;
  };

  const getLabel = () => {
    if (theme === 'system') return `System (${resolvedTheme})`;
    if (theme === 'light') return 'Light (Scaler)';
    return 'Dark (LeetCode)';
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${getLabel()} (Ctrl+Shift+L to toggle)`}
      aria-label={`Toggle theme: current is ${theme}`}
      aria-pressed={theme === 'dark'}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-elevated hover:bg-surface border border-border text-text transition-colors cursor-pointer select-none text-xs font-semibold ${className}`}
    >
      {getIcon()}
      <span className="hidden sm:inline text-[11px] text-text-2">
        {theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};
