const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

try {
  initializeApp();
  const db = getFirestore();
  db.collection('posts').limit(1).get().then(snap => {
    console.log("Docs:", snap.docs.length);
  }).catch(e => console.error("Error fetching:", e.message));
} catch(e) {
  console.error("Init Error:", e.message);
}
