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
    data: payload.data // Attach any data if required
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
