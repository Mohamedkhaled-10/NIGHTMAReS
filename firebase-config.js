// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyCmy-Q609xWxD6pOM5W5rsUUBZY4YTqcr0",
  authDomain: "nightmare-9a1a0.firebaseapp.com",
  projectId: "nightmare-9a1a0",
  storageBucket: "nightmare-9a1a0.firebasestorage.app",
  messagingSenderId: "870740601884",
  appId: "1:870740601884:web:060bff457343d9"
};

// Initialize Firebase (Compat mode for legacy scripts)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}

