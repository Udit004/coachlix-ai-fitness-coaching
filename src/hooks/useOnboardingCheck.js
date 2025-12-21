// Hook to check if user needs onboarding
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import useUserProfileStore from '@/stores/useUserProfileStore';

export const useOnboardingCheck = () => {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const { profile, fetchUserProfile } = useUserProfileStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip check if auth is loading or no user
      if (authLoading || !user) {
        setChecking(false);
        return;
      }

      // Skip check if already on onboarding page
      if (pathname === '/onboarding') {
        setChecking(false);
        return;
      }

      // Skip for public pages
      const publicPages = ['/loginPage', '/signUpPage', '/about'];
      if (publicPages.includes(pathname)) {
        setChecking(false);
        return;
      }

      try {
        // Fetch profile if not loaded
        if (!profile) {
          await fetchUserProfile(user.uid);
        }

        // Check if onboarding is needed
        const needsOnboarding = 
          profile?.name === "New User" || 
          !profile?.location || 
          profile?.gender === "other" ||
          profile?.needsOnboarding === true;

        if (needsOnboarding) {
          console.log('🔀 Redirecting to onboarding...');
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user, authLoading, pathname, profile, fetchUserProfile, router]);

  return { checking };
};
