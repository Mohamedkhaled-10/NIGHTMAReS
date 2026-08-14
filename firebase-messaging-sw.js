importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCmy-Q609xWxD6pOM5W5rsUUBZY4YTqcr0",
  authDomain: "nightmare-9a1a0.firebaseapp.com",
  databaseURL: "https://nightmare-9a1a0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nightmare-9a1a0",
  storageBucket: "nightmare-9a1a0.firebasestorage.app",
  messagingSenderId: "870740601884",
  appId: "1:870740601884:web:060bff457343d9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/images/icon-white.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
