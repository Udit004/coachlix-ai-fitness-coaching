"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

// 1. Create the context
const AuthContext = createContext();

// 2. Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // Firebase user object
  const [loading, setLoading] = useState(true);  // While checking auth status
  const prevUidRef = useRef(undefined);           // Track uid to avoid redundant cookie calls

  const syncSessionCookie = async (firebaseUser) => {
    if (firebaseUser) {
      if (prevUidRef.current === firebaseUser.uid) return;
      try {
        const idToken = await firebaseUser.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        prevUidRef.current = firebaseUser.uid;
      } catch (err) {
        console.error("Failed to set session cookie:", err);
      }
      return;
    }

    if (prevUidRef.current === null) return;
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      prevUidRef.current = null;
    } catch (err) {
      console.error("Failed to clear session cookie:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Unblock UI immediately; cookie sync can happen in background.
      setUser(firebaseUser || null);
      setLoading(false);

      void syncSessionCookie(firebaseUser || null);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
