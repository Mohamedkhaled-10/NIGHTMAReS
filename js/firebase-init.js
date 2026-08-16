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
  // Use synchronous XHR to avoid top-level await which blocks module evaluation and delays page rendering.
  // This will only run once per session, as subsequent loads will use sessionStorage.
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/firebase-config', false); // false makes it synchronous
  try {
    xhr.send(null);
    if (xhr.status === 200) {
      firebaseConfig = JSON.parse(xhr.responseText);
      
      // Validate configuration before caching or initializing
      if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error('Invalid or missing Firebase configuration');
      }
      
      sessionStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
    } else {
      throw new Error('Failed to fetch Firebase config, status: ' + xhr.status);
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
}

const app = initializeApp(firebaseConfig);

let dbInstance;
try {
  // Using memory cache or simpler persistent cache avoids multiple-tab lock contention that causes persistent loading
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache() 
  }, firebaseConfig.firestoreDatabaseId || "(default)");
} catch (e) {
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
