"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/loginPage"); // 🔁 Redirect to login if not authenticated
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-medium">Checking credentials...</p>
      </div>
    );
  }

  // ✅ If user is authenticated, render protected content
  return user ? <>{children}</> : null;
}
