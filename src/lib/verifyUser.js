// lib/verifyUser.js
import admin from "./firebaseAdmin";

/**
 * Verify a Firebase session cookie (set server-side via /api/auth/session).
 * Used in SSR pages to authenticate without a client round-trip.
 */
export async function verifySessionCookie(cookie) {
  try {
    if (!cookie || typeof cookie !== "string") {
      throw new Error("Invalid or missing session cookie");
    }
    const decodedToken = await admin.auth().verifySessionCookie(cookie, true /* checkRevoked */);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || decodedToken.display_name,
      picture: decodedToken.picture,
      ...decodedToken,
    };
  } catch (error) {
    console.error("Session cookie verification failed:", error);
    if (error.code === "auth/session-cookie-expired") throw new Error("Session expired");
    if (error.code === "auth/session-cookie-revoked") throw new Error("Session revoked");
    throw new Error("Unauthorized: " + error.message);
  }
}

export async function verifyUserToken(token) {
  try {
    if (!token || typeof token !== "string") {
      throw new Error("Invalid or missing token");
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    const decodedToken = await admin.auth().verifyIdToken(cleanToken);

    // Return useful user information
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || decodedToken.display_name,
      picture: decodedToken.picture,
      // Include the full decoded token for additional info if needed
      ...decodedToken,
    };
  } catch (error) {
    console.error("Token verification failed:", error);

    // Provide more specific error messages
    if (error.code === "auth/id-token-expired") {
      throw new Error("Token expired");
    } else if (error.code === "auth/id-token-revoked") {
      throw new Error("Token revoked");
    } else if (error.code === "auth/invalid-id-token") {
      throw new Error("Invalid token");
    } else {
      throw new Error("Unauthorized: " + error.message);
    }
  }
}
