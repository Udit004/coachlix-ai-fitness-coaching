// Hook to check if user needs onboarding
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import useUserProfileStore from '@/feature/profile/hooks/useUserProfileStore';

export const useOnboardingCheck = () => {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const { profile, fetchUserProfile, clearProfile } = useUserProfileStore();
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

      const store = useUserProfileStore.getState();
      const cachedProfile = store.profile;

      if (cachedProfile && cachedProfile.userId && cachedProfile.userId !== user.uid) {
        clearProfile();
      }

      try {
        // Fetch profile if not loaded, if it belongs to a different auth user,
        // or if the cached profile still looks like the old onboarding placeholder.
        let activeProfile = useUserProfileStore.getState().profile;
        const shouldRefreshProfile =
          !activeProfile ||
          activeProfile.userId !== user.uid ||
          activeProfile.needsOnboarding === true ||
          activeProfile.profileCompleted === false ||
          activeProfile.name === 'New User' ||
          !activeProfile.location ||
          activeProfile.gender === 'other';

        if (shouldRefreshProfile) {
          activeProfile = await fetchUserProfile(user.uid, { force: true });
        }

        if (!activeProfile) {
          setChecking(false);
          return;
        }

        // Check if onboarding is needed
        const needsOnboarding = 
          activeProfile?.needsOnboarding === true ||
          activeProfile?.profileCompleted === false ||
          activeProfile?.name === "New User" ||
          !activeProfile?.location ||
          activeProfile?.gender === "other";

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
  }, [user, authLoading, pathname, profile, fetchUserProfile, clearProfile, router]);

  return { checking };
};
