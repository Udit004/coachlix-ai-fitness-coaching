'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
          fontSize: '14px',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        // Default options for specific types
        success: {
          duration: 3000,
          style: {
            background: '#10b981',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#ef4444',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#3b82f6',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#3b82f6',
          },
        },
      }}
    />
  );
}
