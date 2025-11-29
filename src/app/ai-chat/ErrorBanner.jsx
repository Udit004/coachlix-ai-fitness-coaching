import React from 'react';
import { AlertCircle, X } from './icons';

const ErrorBanner = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-red-700 text-sm">{error}</span>
        <button 
          onClick={onClose}
          className="ml-auto text-red-500 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;