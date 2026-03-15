'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/auth/AuthContext';

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
      router.replace('/');
    }
  }, [user, loading, pathname, isPublicRoute, router]);

  // Avoid full-screen overlays while auth hydrates to reduce CLS/LCP regressions.
  if (loading && !isPublicRoute) {
    return <div className="min-h-[40vh]" aria-hidden="true" />;
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
