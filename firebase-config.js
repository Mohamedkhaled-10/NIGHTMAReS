// firebase-config.js
async function initLegacyFirebase() {
  const response = await fetch('/api/firebase-config');
  const firebaseConfig = await response.json();

  // Initialize Firebase (Compat mode for legacy scripts)
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
  }
}

initLegacyFirebase();

