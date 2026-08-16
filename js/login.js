import { auth, db } from './firebase-init.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Helper to get safe redirect URL
function getSafeReturnUrl() {
  const url = sessionStorage.getItem('returnUrl');
  if (!url) return '/'; // Default fallback to Home
  
  try {
    // This handles relative paths (e.g., /news) and absolute URLs
    const parsedUrl = new URL(url, window.location.origin);
    // Ensure the origin strictly matches to prevent Open Redirects
    if (parsedUrl.origin === window.location.origin) {
      return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
    }
  } catch(e) {
    console.error("Invalid return URL format", e);
  }
  
  return '/';
}

function redirectAndClear(url) {
  sessionStorage.removeItem('returnUrl');
  window.location.replace(url);
}

// Auto-redirect if already logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const returnUrl = getSafeReturnUrl();
    
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.accountStatus === 'banned' || data.accountStatus === 'deleted') {
          await auth.signOut();
          return; // don't redirect, let them see they are logged out
        }
        if (data.role === 'admin') {
          redirectAndClear('/admin');
          return;
        }
      }
      redirectAndClear(returnUrl);
    } catch(e) {
      redirectAndClear(returnUrl);
    }
  }
});


const form = document.getElementById('auth-form');
const nameField = document.getElementById('name-field');
const passwordField = document.getElementById('password-field');
const btnSubmit = document.getElementById('btn-submit');
const formTitleText = document.getElementById('form-title-text');
const errorMsg = document.getElementById('error-msg');
const errorText = document.getElementById('error-text');
const successMsg = document.getElementById('success-msg');
const successText = document.getElementById('success-text');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');
const btnSpinner = document.getElementById('btn-spinner');

const toggleRegister = document.getElementById('toggle-register');
const toggleLogin = document.getElementById('toggle-login');
const toggleReset = document.getElementById('toggle-reset');

// Password Visibility Toggle
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');

if (togglePasswordBtn && passwordInput && eyeIcon) {
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
  });
}

// Input error hints
const nameError = document.getElementById('name-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

let currentMode = 'login'; // login, register, reset

function setMode(mode) {
  currentMode = mode;
  errorMsg.classList.add('hidden');
  successMsg.classList.add('hidden');
  clearInputErrors();
  
  if (mode === 'login') {
    formTitleText.textContent = 'تسجيل الدخول';
    nameField.classList.add('hidden');
    passwordField.classList.remove('hidden');
    document.getElementById('password').required = true;
    btnText.textContent = 'تسجيل الدخول';
    btnIcon.className = 'fa-solid fa-arrow-left-to-bracket transition-transform group-hover:-translate-x-1';
    
    toggleRegister.classList.remove('hidden');
    toggleLogin.classList.add('hidden');
    toggleReset.classList.remove('hidden');
  } else if (mode === 'register') {
    formTitleText.textContent = 'إنشاء حساب جديد';
    nameField.classList.remove('hidden');
    passwordField.classList.remove('hidden');
    document.getElementById('displayName').required = true;
    document.getElementById('password').required = true;
    btnText.textContent = 'إنشاء حساب';
    btnIcon.className = 'fa-solid fa-user-plus transition-transform group-hover:-translate-x-1';
    
    toggleRegister.classList.add('hidden');
    toggleLogin.classList.remove('hidden');
    toggleReset.classList.add('hidden');
  } else if (mode === 'reset') {
    formTitleText.textContent = 'استعادة كلمة المرور';
    nameField.classList.add('hidden');
    passwordField.classList.add('hidden');
    document.getElementById('password').required = false;
    document.getElementById('displayName').required = false;
    btnText.textContent = 'إرسال رابط الاستعادة';
    btnIcon.className = 'fa-solid fa-envelope transition-transform group-hover:-translate-x-1';
    
    toggleRegister.classList.add('hidden');
    toggleLogin.classList.remove('hidden');
    toggleReset.classList.add('hidden');
  }
}

function clearInputErrors() {
  nameError.classList.add('hidden');
  emailError.classList.add('hidden');
  passwordError.classList.add('hidden');
}

function validateInputs(email, password, displayName) {
  let isValid = true;
  clearInputErrors();
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    emailError.classList.remove('hidden');
    isValid = false;
  }
  
  if (currentMode === 'register' || currentMode === 'login') {
    if (!password || password.length < 6) {
      passwordError.classList.remove('hidden');
      isValid = false;
    }
  }
  
  if (currentMode === 'register') {
    if (!displayName || displayName.length < 3) {
      nameError.classList.remove('hidden');
      isValid = false;
    }
  }
  
  return isValid;
}

toggleRegister.querySelector('button').addEventListener('click', (e) => { e.preventDefault(); setMode('register'); });
toggleLogin.querySelector('button').addEventListener('click', (e) => { e.preventDefault(); setMode('login'); });
toggleReset.addEventListener('click', (e) => { e.preventDefault(); setMode('reset'); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const displayName = document.getElementById('displayName').value.trim();
  
  if (!validateInputs(email, password, displayName)) {
    return;
  }
  
  errorMsg.classList.add('hidden');
  successMsg.classList.add('hidden');
  
  // Loading State
  btnSubmit.disabled = true;
  btnIcon.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  const originalText = btnText.textContent;
  btnText.textContent = 'جاري المعالجة...';

  try {
    if (currentMode === 'login') {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check role/status
      const docSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      const returnUrl = getSafeReturnUrl();
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.accountStatus === 'banned' || data.accountStatus === 'deleted') {
          await auth.signOut();
          throw new Error('هذا الحساب محظور أو محذوف.');
        }
        if (data.role === 'admin') {
          redirectAndClear('/admin');
        } else {
          redirectAndClear(returnUrl);
        }
      } else {
        redirectAndClear(returnUrl);
      }
      
    } else if (currentMode === 'register') {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: '',
        role: 'user',
        accountStatus: 'active',
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
      
      await sendEmailVerification(user);
      successText.textContent = 'تم إنشاء الحساب بنجاح. يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.';
      successMsg.classList.remove('hidden');
      setMode('login');
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      
    } else if (currentMode === 'reset') {
      await sendPasswordResetEmail(auth, email);
      successText.textContent = 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.';
      successMsg.classList.remove('hidden');
      setMode('login');
      document.getElementById('email').value = '';
    }
  } catch (error) {
    console.error(error);
    errorText.textContent = error.message || 'حدث خطأ أثناء العملية.';
    
    if (error.code === 'auth/email-already-in-use') errorText.textContent = 'هذا البريد مستخدم بالفعل.';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') errorText.textContent = 'بيانات الدخول غير صحيحة.';
    if (error.code === 'auth/weak-password') errorText.textContent = 'كلمة المرور ضعيفة.';
    
    errorMsg.classList.remove('hidden');
  } finally {
    btnSubmit.disabled = false;
    btnIcon.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    btnText.textContent = originalText;
  }
});

