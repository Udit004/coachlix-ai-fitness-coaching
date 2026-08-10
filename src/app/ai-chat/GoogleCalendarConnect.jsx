// src/app/ai-chat/GoogleCalendarConnect.jsx
// Shows a "Connect Google Calendar" button (or "Connected" badge) in the AI chat sidebar.
// Calls GET /api/calendar/oauth/url with the Firebase bearer token,
// then redirects the browser to Google's consent page.
// After consent Google redirects → /api/calendar/oauth/callback → /aichat (backend handles this).
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, CalendarX, Loader2, Calendar } from 'lucide-react';
import { getAuthHeaders } from '@/service/chatApiBase';
import { buildApiUrl } from '@/service/apiBase';

const CALENDAR_API = buildApiUrl('calendar');

export default function GoogleCalendarConnect({ className = '' }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'connected' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // Check if calendar is already connected on mount
  useEffect(() => {
    let cancelled = false;
    async function checkStatus() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${CALENDAR_API}/status`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setStatus(data.calendarSyncEnabled && data.tokenValid ? 'connected' : 'idle');
        }
      } catch {
        // silently ignore — user just isn't connected yet
      }
    }
    checkStatus();
    return () => { cancelled = true; };
  }, []);

  const handleConnect = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CALENDAR_API}/oauth/url`, { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to get authorization URL');
      }
      const { url } = await res.json();
      // Redirect to Google consent page
      window.location.href = url;
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CALENDAR_API}/revoke`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to disconnect');
      }
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Disconnect failed. Please try again.');
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (status === 'connected') {
    return (
      <div className={`bg-gray-800/80 rounded-xl p-4 border border-green-800/60 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-green-900/60 rounded-lg flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Google Calendar</p>
              <p className="text-xs text-green-400">Connected ✓</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-900/20"
            title="Disconnect Google Calendar"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/80 rounded-xl p-4 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-7 h-7 bg-blue-900/60 rounded-lg flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Google Calendar</p>
          <p className="text-xs text-gray-400">Sync your workouts</p>
        </div>
      </div>

      {/* Error message */}
      {status === 'error' && errorMsg && (
        <div className="mb-3 px-3 py-2 bg-red-900/40 border border-red-800/60 rounded-lg">
          <p className="text-xs text-red-400">{errorMsg}</p>
        </div>
      )}

      {/* Connect button */}
      <button
        onClick={handleConnect}
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 
          bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed
          text-white text-sm font-medium rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting…</span>
          </>
        ) : (
          <>
            {/* Google "G" logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Connect Google Calendar</span>
          </>
        )}
      </button>

      {status !== 'loading' && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Your workouts will be added automatically
        </p>
      )}
    </div>
  );
}
