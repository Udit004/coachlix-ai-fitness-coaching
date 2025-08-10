// hooks/useAuth.js
import { useAuthContext } from "@/auth/AuthContext";
import { useMemo } from "react";

export const useAuth = () => {
  const authContext = useAuthContext();
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    user: authContext?.user || null,
    loading: authContext?.loading || false,
    error: authContext?.error || null,
    isAuthenticated: !!(authContext?.user && !authContext?.loading),
  }), [authContext?.user, authContext?.loading, authContext?.error]);
};