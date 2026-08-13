// admin/js/auth-guard.js
import { auth } from '../../js/firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Ensure body is hidden until auth completes
document.body.classList.add('hidden');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  
  // Show body once auth is confirmed
  document.body.classList.remove('hidden');
  
  // Setup logout button if it exists
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      signOut(auth).then(() => {
        window.location.href = '/login.html';
      });
    });
  }
});
