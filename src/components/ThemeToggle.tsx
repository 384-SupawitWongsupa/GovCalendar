'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has previously set a preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // If user explicitly saved dark mode, enable it. Otherwise, keep default light mode.
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Prevent hydration mismatch by rendering a placeholder until mounted
  if (!mounted) {
    return (
      <div 
        className="btn btn-outline"
        style={{ padding: '0.45rem', borderRadius: '50%', width: '38px', height: '38px' }}
      />
    );
  }

  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-outline"
      style={{ padding: '0.45rem', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      title={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
