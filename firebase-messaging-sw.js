importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

fetch('/api/firebase-config').then(res => res.json()).then(config => {
  firebase.initializeApp(config);
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
}).catch(err => console.error("Failed to load Firebase config in SW", err));

