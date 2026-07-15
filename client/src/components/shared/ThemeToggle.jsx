import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export const ThemeToggle = ({ className }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('portfolio-theme') || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
    localStorage.setItem('portfolio-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={className}
      aria-label={`Current theme: ${theme}. Click to change theme.`}
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && <Sun className="h-5 w-5 text-amber-500 transition-transform" />}
      {theme === 'dark' && <Moon className="h-5 w-5 text-indigo-400 transition-transform" />}
      {theme === 'system' && (
        <Laptop className="text-muted-foreground h-5 w-5 transition-transform" />
      )}
    </Button>
  );
};
