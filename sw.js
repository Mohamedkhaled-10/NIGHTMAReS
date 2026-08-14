self.addEventListener("install", function (event) {
  console.log("Service Worker Installed");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});
