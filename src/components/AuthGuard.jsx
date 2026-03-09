'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/auth/AuthContext';
import Image from 'next/image';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/loginPage',
    '/signUpPage',
    '/about',
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) return;

    // If user is not logged in and trying to access protected route
    if (!user && !isPublicRoute) {
      console.log(`🔒 Protected route "${pathname}" - redirecting to home`);
      router.push('/');
    }
  }, [user, loading, pathname, isPublicRoute, router]);

  // Show beautiful branded splash screen while checking authentication
  if (loading) {
    return (
      <>
        <style>{`
          @keyframes cl-logo-enter {
            0%   { opacity: 0; transform: scale(0.65); }
            65%  { opacity: 1; transform: scale(1.06); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes cl-glow-pulse {
            0%, 100% {
              box-shadow:
                0 0 28px 8px rgba(99,102,241,0.35),
                0 0 60px 20px rgba(139,92,246,0.18);
            }
            50% {
              box-shadow:
                0 0 48px 16px rgba(99,102,241,0.55),
                0 0 100px 36px rgba(139,92,246,0.28);
            }
          }
          @keyframes cl-title-reveal {
            0%   { opacity: 0; transform: translateY(18px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes cl-shimmer {
            0%   { background-position: -250% center; }
            100% { background-position: 250% center; }
          }
          @keyframes cl-tagline-in {
            0%   { opacity: 0; letter-spacing: 0.25em; }
            100% { opacity: 0.55; letter-spacing: 0.42em; }
          }
          @keyframes cl-bar {
            0%   { width: 0%; }
            18%  { width: 22%; }
            45%  { width: 55%; }
            75%  { width: 80%; }
            100% { width: 100%; }
          }
          @keyframes cl-orb-drift {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50%       { transform: translate(-48%, -52%) scale(1.08); }
          }
          .cl-logo-wrap {
            animation:
              cl-logo-enter   0.75s cubic-bezier(0.34,1.56,0.64,1) forwards,
              cl-glow-pulse   2.4s ease-in-out 0.75s infinite;
          }
          .cl-title {
            background: linear-gradient(120deg, #a5b4fc 0%, #c084fc 45%, #818cf8 80%, #a5b4fc 100%);
            background-size: 250% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation:
              cl-title-reveal 0.55s ease-out 0.42s both,
              cl-shimmer      3.2s linear 1.1s infinite;
          }
          .cl-tagline {
            animation: cl-tagline-in 0.7s ease-out 0.82s both;
          }
          .cl-bar {
            animation: cl-bar 2.8s cubic-bezier(0.4,0,0.2,1) forwards;
          }
          .cl-orb {
            animation: cl-orb-drift 6s ease-in-out infinite;
          }
        `}</style>

        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#09090b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          overflow: 'hidden',
        }}>
          {/* Ambient background orb */}
          <div className="cl-orb" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '640px',
            height: '640px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.05) 45%, transparent 72%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            willChange: 'transform',
          }} />

          {/* Secondary subtle orb (top-right accent) */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div className="cl-logo-wrap" style={{
            borderRadius: '28px',
            padding: '3px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.6) 0%, rgba(139,92,246,0.6) 50%, rgba(168,85,247,0.6) 100%)',
            marginBottom: '28px',
            willChange: 'transform, box-shadow',
          }}>
            <div style={{
              borderRadius: '26px',
              overflow: 'hidden',
              background: '#18181b',
              padding: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Image
                src="/assets/CoachlixLogo.png"
                alt="Coachlix"
                width={96}
                height={96}
                priority
                style={{ display: 'block', borderRadius: '14px' }}
              />
            </div>
          </div>

          {/* App name */}
          <h1 className="cl-title" style={{
            fontSize: '2.6rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '10px',
            lineHeight: 1,
          }}>
            Coachlix
          </h1>

          {/* Tagline */}
          <p className="cl-tagline" style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: '0.42em',
            textTransform: 'uppercase',
          }}>
            AI Fitness Coach
          </p>

          {/* Netflix-style progress bar at the bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255,255,255,0.06)',
          }}>
            <div className="cl-bar" style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
              boxShadow: '0 0 12px rgba(139,92,246,0.9)',
              borderRadius: '0 2px 2px 0',
            }} />
          </div>
        </div>
      </>
    );
  }

  // If trying to access protected route without authentication, show nothing
  // (redirect will happen via useEffect)
  if (!user && !isPublicRoute) {
    return null;
  }

  // Render children for:
  // 1. Public routes (regardless of auth status)
  // 2. Protected routes when user is authenticated
  return <>{children}</>;
}
