"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/auth/AuthContext";

/**
 * Renders nothing — runs only on the client to redirect authenticated users
 * away from the public landing page to their dashboard.
 */
export default function HomeAuthRedirect() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return null;
}
