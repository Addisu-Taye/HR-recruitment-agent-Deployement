import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react"; // ✅ uses lucide-react icons

const ThemeToggle = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "system"
  );

  // Apply theme when component mounts or theme changes
  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (t) => {
      if (
        t === "dark" ||
        (t === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle theme manually
  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else setTheme("light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                 rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
      title="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
};

export default ThemeToggle;
