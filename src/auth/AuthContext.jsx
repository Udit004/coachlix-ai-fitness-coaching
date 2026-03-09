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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Only (re)create session cookie when the user actually changes
        if (prevUidRef.current !== firebaseUser.uid) {
          try {
            const idToken = await firebaseUser.getIdToken();
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
          } catch (err) {
            console.error("Failed to set session cookie:", err);
          }
          prevUidRef.current = firebaseUser.uid;
        }
        setUser(firebaseUser);
      } else {
        // Clear the session cookie when Firebase signs out
        if (prevUidRef.current !== null) {
          try {
            await fetch("/api/auth/session", { method: "DELETE" });
          } catch (err) {
            console.error("Failed to clear session cookie:", err);
          }
          prevUidRef.current = null;
        }
        setUser(null);
      }
      setLoading(false);
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
