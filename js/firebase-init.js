// js/firebase-init.js
// Firebase v10 Modular SDK Initialization

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmy-Q609xWxD6pOM5W5rsUUBZY4YTqcr0",
  authDomain: "nightmare-9a1a0.firebaseapp.com",
  projectId: "nightmare-9a1a0",
  storageBucket: "nightmare-9a1a0.firebasestorage.app",
  messagingSenderId: "870740601884",
  appId: "1:870740601884:web:060bff457343d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const config = firebaseConfig; // Exported in case it's needed elsewhere
