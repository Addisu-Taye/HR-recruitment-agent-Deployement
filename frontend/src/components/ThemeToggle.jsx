import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // Load saved theme or use system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  // Toggle and save theme
  const toggleTheme = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
    setDarkMode(!darkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 flex items-center transition-all duration-500 shadow-lg hover:scale-105"
      aria-label="Toggle Dark Mode"
    >
      <div
        className={`w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-all duration-500 flex items-center justify-center ${
          darkMode ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        <span className="text-lg">
          {darkMode ? '🌙' : '🌞'}
        </span>
      </div>
    </button>
  );
}
