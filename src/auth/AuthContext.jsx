"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

// 1. Create the context
const AuthContext = createContext();

// 2. Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // Firebase user object
  const [loading, setLoading] = useState(true);  // While checking auth status

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);  // Either user or null
      setLoading(false);              // Stop loading once we have the result
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
