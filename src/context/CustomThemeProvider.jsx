"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useCustomTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem('coachlix-theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    setMounted(true);
  }, []);

  // Apply theme to HTML element
  const applyTheme = (newTheme) => {
    const html = document.documentElement;
    
    // Remove all theme classes
    html.classList.remove('light', 'dark');
    
    // Add the new theme class
    html.classList.add(newTheme);
    
    console.log(`Applied theme: ${newTheme}, HTML classes:`, Array.from(html.classList));
  };

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('coachlix-theme', newTheme);
    console.log(`Theme toggled from ${theme} to ${newTheme}`);
  };

  const value = {
    theme,
    toggleTheme,
    mounted
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};