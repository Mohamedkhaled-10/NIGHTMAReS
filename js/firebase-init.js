// js/firebase-init.js
// Firebase v10 Modular SDK Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let firebaseConfig;
const cachedConfig = sessionStorage.getItem('firebaseConfig');

if (cachedConfig) {
  firebaseConfig = JSON.parse(cachedConfig);
} else {
  const response = await fetch('/api/firebase-config');
  firebaseConfig = await response.json();
  sessionStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
}

const app = initializeApp(firebaseConfig);

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
  }, firebaseConfig.firestoreDatabaseId || "(default)");
} catch (e) {
  // Fallback if already initialized or error
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
}
export const db = dbInstance;

export const auth = getAuth(app);
export const storage = getStorage(app);
export const config = firebaseConfig;

setPersistence(auth, browserLocalPersistence).catch(console.error);

// Force update Service Worker globally
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.update();
    }).catch(err => console.log('SW registration failed:', err));
  };
  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}
