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
      router.push('/');
    }
  }, [user, loading, pathname, isPublicRoute, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
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
