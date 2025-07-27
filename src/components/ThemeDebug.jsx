"use client";

import { useCustomTheme } from "@/components/CustomThemeProvider";
import { useEffect, useState } from "react";

export default function CustomThemeDebug() {
  const { theme, toggleTheme, mounted } = useCustomTheme();
  const [htmlClass, setHtmlClass] = useState('');

  useEffect(() => {
    if (mounted) {
      // Check what class is actually on the HTML element
      const htmlElement = document.documentElement;
      setHtmlClass(htmlElement.className);
      
      console.log('=== CUSTOM THEME DEBUG ===');
      console.log('theme:', theme);
      console.log('HTML class:', htmlElement.className);
      console.log('HTML classList:', Array.from(htmlElement.classList));
      console.log('==========================');
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg text-xs">
      <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Custom Theme Debug</h3>
      <div className="space-y-1 text-gray-700 dark:text-gray-300">
        <div>Theme: {theme}</div>
        <div>HTML Class: {htmlClass}</div>
        <div className="mt-2">
          <div className="w-4 h-4 bg-blue-500 dark:bg-yellow-500 rounded"></div>
          <span className="ml-2">Color test (blue → yellow)</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Background test</div>
      </div>
      <div className="mt-2 space-x-2">
        <button 
          onClick={toggleTheme} 
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
        >
          Toggle Theme
        </button>
      </div>
    </div>
  );
}