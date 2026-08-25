import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Monitor } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { themes } from '../../lib/themes';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'sm' }) => {
  const { theme, setTheme, resolvedTheme, activeThemeDefinition } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cycle through all themes in exact spec order:
  // light-studio -> graphite-indigo -> warm-charcoal -> deep-ocean -> material-oceanic -> ide-slate -> ide-paper
  const cycleTheme = useCallback(() => {
    const currentIndex = themes.findIndex((t) => t.id === resolvedTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].id);
  }, [resolvedTheme, setTheme]);

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

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Theme: ${activeThemeDefinition.name} (Ctrl+Shift+L to cycle)`}
        aria-label="Theme selector"
        aria-expanded={isOpen}
        className={`flex items-center gap-1.5 rounded-md bg-elevated hover:bg-surface border border-border text-text transition-colors cursor-pointer select-none text-xs font-semibold ${
          size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'
        } ${className}`}
      >
        <span
          className="w-3 h-3 rounded-full border border-border shrink-0"
          style={{ backgroundColor: activeThemeDefinition.accent }}
        />
        <span className="hidden sm:inline text-[11px] text-text">
          {activeThemeDefinition.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-surface border border-border rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-text-3 uppercase tracking-wider border-b border-border-subtle flex items-center justify-between">
            <span>Themes</span>
            <span className="text-[9px] font-mono lowercase">Ctrl+Shift+L</span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {themes.map((t) => {
              const isSelected = resolvedTheme === t.id && theme !== 'system';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-elevated cursor-pointer ${
                    isSelected ? 'bg-elevated/70 text-primary font-bold' : 'text-text'
                  }`}
                >
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-border/80 shrink-0"
                      style={{ backgroundColor: t.background }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">{t.name}</div>
                    <div className="text-[10px] text-text-3 truncate">{t.description}</div>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              );
            })}

            <div className="border-t border-border-subtle my-1" />

            <button
              type="button"
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-elevated cursor-pointer ${
                theme === 'system' ? 'bg-elevated/70 text-primary font-bold' : 'text-text'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-text-3 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">System Default</div>
                <div className="text-[10px] text-text-3">Follow OS appearance</div>
              </div>
              {theme === 'system' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
