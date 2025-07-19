// lib/verifyUser.js
import admin from "./firebaseAdmin";

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
