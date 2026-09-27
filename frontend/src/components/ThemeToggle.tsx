'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
      setIsDark(false);
      document.documentElement.classList.add('light');
    } else {
      setIsDark(true);
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-colors duration-200 glass-card hover:bg-white/10",
        "flex items-center justify-center w-10 h-10"
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun className={cn(
          "absolute inset-0 w-5 h-5 transition-all duration-300",
          isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100 text-yellow-500"
        )} />
        <Moon className={cn(
          "absolute inset-0 w-5 h-5 transition-all duration-300",
          !isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100 text-blue-400"
        )} />
      </div>
    </button>
  );
}
