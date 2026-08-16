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
const formTitle = document.getElementById('form-title');
const errorMsg = document.getElementById('error-msg');
const successMsg = document.getElementById('success-msg');

const toggleRegister = document.getElementById('toggle-register');
const toggleLogin = document.getElementById('toggle-login');
const toggleReset = document.getElementById('toggle-reset');

let currentMode = 'login'; // login, register, reset

function setMode(mode) {
  currentMode = mode;
  errorMsg.classList.add('hidden');
  successMsg.classList.add('hidden');
  
  if (mode === 'login') {
    formTitle.textContent = 'تسجيل الدخول';
    nameField.classList.add('hidden');
    passwordField.classList.remove('hidden');
    document.getElementById('password').required = true;
    btnSubmit.innerHTML = 'تسجيل الدخول <i class="fas fa-sign-in-alt mr-2"></i>';
    toggleRegister.classList.remove('hidden');
    toggleLogin.classList.add('hidden');
    toggleReset.classList.remove('hidden');
  } else if (mode === 'register') {
    formTitle.textContent = 'إنشاء حساب جديد';
    nameField.classList.remove('hidden');
    passwordField.classList.remove('hidden');
    document.getElementById('displayName').required = true;
    document.getElementById('password').required = true;
    btnSubmit.innerHTML = 'إنشاء حساب <i class="fas fa-user-plus mr-2"></i>';
    toggleRegister.classList.add('hidden');
    toggleLogin.classList.remove('hidden');
    toggleReset.classList.add('hidden');
  } else if (mode === 'reset') {
    formTitle.textContent = 'استعادة كلمة المرور';
    nameField.classList.add('hidden');
    passwordField.classList.add('hidden');
    document.getElementById('password').required = false;
    document.getElementById('displayName').required = false;
    btnSubmit.innerHTML = 'إرسال رابط الاستعادة <i class="fas fa-envelope mr-2"></i>';
    toggleRegister.classList.add('hidden');
    toggleLogin.classList.remove('hidden');
    toggleReset.classList.add('hidden');
  }
}

toggleRegister.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); setMode('register'); });
toggleLogin.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); setMode('login'); });
toggleReset.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); setMode('reset'); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const displayName = document.getElementById('displayName').value.trim();
  
  errorMsg.classList.add('hidden');
  successMsg.classList.add('hidden');
  btnSubmit.disabled = true;
  const originalText = btnSubmit.innerHTML;
  btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';

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
      successMsg.textContent = 'تم إنشاء الحساب بنجاح. يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.';
      successMsg.classList.remove('hidden');
      setMode('login');
      
    } else if (currentMode === 'reset') {
      await sendPasswordResetEmail(auth, email);
      successMsg.textContent = 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.';
      successMsg.classList.remove('hidden');
      setMode('login');
    }
  } catch (error) {
    console.error(error);
    errorMsg.textContent = error.message || 'حدث خطأ أثناء العملية.';
    
    if (error.code === 'auth/email-already-in-use') errorMsg.textContent = 'هذا البريد مستخدم بالفعل.';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') errorMsg.textContent = 'بيانات الدخول غير صحيحة.';
    if (error.code === 'auth/weak-password') errorMsg.textContent = 'كلمة المرور ضعيفة.';
    
    errorMsg.classList.remove('hidden');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalText;
  }
});

