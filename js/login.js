import { auth } from './firebase-init.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const btn = document.getElementById('btn-login');
  const errorEl = document.getElementById('error-msg');
  
  errorEl.classList.add('hidden');
  btn.textContent = 'جاري التحقق...';
  btn.disabled = true;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = '/admin'; // Redirect to dashboard
  } catch (error) {
    console.error(error);
    if(error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
      // If it is a new setup, you might want to create the user first in console.
    }
    errorEl.textContent = 'خطأ في البيانات. تأكد من البريد وكلمة المرور.';
    errorEl.classList.remove('hidden');
    btn.innerHTML = 'تسجيل الدخول <i class="fas fa-sign-in-alt mr-2"></i>';
    btn.disabled = false;
  }
});
