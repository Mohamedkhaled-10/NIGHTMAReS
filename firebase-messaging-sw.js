// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDMMu-QNPL6RlGYdGGQVJLzZqCC_hsLa8I",
  authDomain: "night-ac2a0.firebaseapp.com",
  projectId: "night-ac2a0",
  messagingSenderId: "202751732517",
  appId: "1:202751732517:web:5d458d19aac8d7135848cc"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // غيّرها لو عندك أيقونة
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
