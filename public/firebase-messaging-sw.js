// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js');

// Initialize Firebase inside the service worker
firebase.initializeApp({
  apiKey: "AIzaSyASNVaKwP8_OGOkHLkHL44X1_z3uo5tUng",
  authDomain: "coachlix-ai-fitness-coaching.firebaseapp.com",
  projectId: "coachlix-ai-fitness-coaching",
  storageBucket: "coachlix-ai-fitness-coaching.appspot.com",
  messagingSenderId: "835492354129",
  appId: "1:835492354129:web:800c00563cb884e42f4070"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages (when the app is not open in a tab)
messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || 'Coachlix Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update!',
    icon: '/icon-192.png',
    badge: '/badge-icon.png', // Optional: for showing notification count
    data: {
      ...(payload.data || {}),
      link: (payload?.fcmOptions && payload.fcmOptions.link) || (payload?.data && payload.data.link) || '/',
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle clicks on notifications to open/focus the app
self.addEventListener('notificationclick', function(event) {
  const targetUrl = (event.notification && event.notification.data && event.notification.data.link) || '/';
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existing = allClients.find((client) => client.url.includes(self.registration.scope));
      if (existing) {
        existing.focus();
        try { existing.navigate(targetUrl); } catch (_) {}
        return;
      }
      await clients.openWindow(targetUrl);
    })()
  );
});
