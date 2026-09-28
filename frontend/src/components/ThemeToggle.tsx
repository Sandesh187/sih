'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
      setIsDark(false);
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  if (!mounted) {
    return (
      <div className={cn("w-9 h-9 rounded-lg border border-[var(--border-color)] bg-slate-100 dark:bg-slate-800/60 opacity-0", className)} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={cn(
        "p-2 rounded-lg transition-all duration-200",
        "border border-slate-300 dark:border-slate-700/80",
        "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80",
        "text-slate-700 dark:text-slate-200",
        "flex items-center justify-center w-9 h-9 shadow-sm hover:shadow",
        className
      )}
      aria-label="Toggle theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-4 h-4">
        <Sun className={cn(
          "absolute inset-0 w-4 h-4 transition-all duration-300 text-amber-600 dark:text-amber-400",
          isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        )} />
        <Moon className={cn(
          "absolute inset-0 w-4 h-4 transition-all duration-300 text-blue-600 dark:text-blue-400",
          !isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        )} />
      </div>
    </button>
  );
}

export default ThemeToggle;
