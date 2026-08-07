"use client";

import { useEffect, useRef, useState } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useAuthContext } from "@/auth/AuthContext";
import { app } from "@/lib/firebase";

export default function PushTokenRegistrar() {
  const { user, loading } = useAuthContext();
  const [permission, setPermission] = useState("unknown");
  const [tokenReady, setTokenReady] = useState(false);
  const unsubscribeRef = useRef(null);
  const registeredUidRef = useRef(null);

  useEffect(() => {
    if (loading || !user || typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      return;
    }

    if (registeredUidRef.current === user.uid) {
      return;
    }

    let cancelled = false;

    const registerPushToken = async () => {
      try {
        const messaging = getMessaging(app);
        const currentPermission = Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

        if (cancelled) {
          return;
        }

        setPermission(currentPermission);

        if (currentPermission !== "granted") {
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (cancelled) {
          return;
        }

        if (!token) {
          setTokenReady(false);
          return;
        }

        const idToken = await user.getIdToken();
        const response = await fetch("/api/save-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error(`Token registration failed with status ${response.status}`);
        }

        if (cancelled) {
          return;
        }

        setTokenReady(true);
        registeredUidRef.current = user.uid;

        if (!unsubscribeRef.current) {
          unsubscribeRef.current = onMessage(messaging, (payload) => {
            if (payload.notification) {
              new Notification(payload.notification.title || "Coachlix", {
                body: payload.notification.body,
                icon: payload.notification.icon || "/icon-192.png",
              });
            }
          });
        }
      } catch (error) {
        console.error("Notification setup failed:", error);
      }
    };

    void registerPushToken();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  useEffect(() => {
    return () => {
      if (typeof unsubscribeRef.current === "function") {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="hidden"
      data-notification-permission={permission}
      data-fcm-ready={tokenReady ? "true" : "false"}
    />
  );
}