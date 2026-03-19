"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";
import { useAuthContext } from "@/auth/AuthContext";
import HomeDashboard from "@/feature/Dashboard/components/HomeDashboard";
import RecentActivitySection from "@/feature/Dashboard/components/RecentActivitySection";

export default function DashboardClientPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuthContext();
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const unsubscribeRef = useRef(null);

  const setupNotifications = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return;
      }

      if (authLoading) {
        return;
      }

      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== "granted") {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        setFcmToken(token);
      }

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
  }, [authLoading]);

  useEffect(() => {
    router.prefetch("/ai-chat");

    const timer = setTimeout(() => {
      void setupNotifications();
    }, 300);

    return () => clearTimeout(timer);
  }, [router, setupNotifications]);

  useEffect(() => {
    return () => {
      if (typeof unsubscribeRef.current === "function") {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <HomeDashboard />
      <RecentActivitySection />
      <div className="hidden" data-notification-permission={notificationPermission || "unknown"} data-fcm-ready={Boolean(fcmToken)} />
    </>
  );
}
