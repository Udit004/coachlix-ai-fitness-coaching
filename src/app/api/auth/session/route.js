// api/auth/session/route.js
// POST  — Exchange a Firebase ID token for an httpOnly session cookie
// DELETE — Clear the session cookie (logout)

import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

const SESSION_COOKIE_NAME = "__session";
// 5 days in seconds (Firebase max is 14 days)
const SESSION_DURATION_S = 5 * 24 * 60 * 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ message: "idToken is required" }, { status: 400 });
    }

    // Firebase Admin creates a long-lived session cookie from the short-lived ID token
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn: SESSION_DURATION_S * 1000 });

    const response = NextResponse.json({ status: "ok" });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_DURATION_S,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Session cookie creation failed:", error);
    return NextResponse.json(
      { message: "Failed to create session: " + error.message },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
