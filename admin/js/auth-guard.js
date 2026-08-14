// admin/js/auth-guard.js
import { auth, db } from '../../js/firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Ensure body is hidden until auth completes
document.body.classList.add('hidden');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/login';
    return;
  }
  
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      alert('غير مصرح لك بالدخول إلى لوحة الإدارة.');
      window.location.href = '/';
      return;
    }
  } catch(e) {
    console.error('Error verifying admin status', e);
    window.location.href = '/';
    return;
  }
  
  // Show body once auth is confirmed
  document.body.classList.remove('hidden');
  
  // Setup logout button if it exists
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      signOut(auth).then(() => {
        window.location.href = '/login';
      });
    });
  }
});
