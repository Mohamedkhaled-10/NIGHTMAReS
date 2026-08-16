// admin/js/auth-guard.js
import { auth, db } from '../../js/firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Ensure body is hidden until auth completes
document.body.classList.add('hidden');

const overlay = document.createElement('div');
overlay.className = 'fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-white z-[9999]';
overlay.innerHTML = `
  <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
  <p class="text-lg font-semibold">جارٍ التحقق من الصلاحيات...</p>
`;
document.documentElement.appendChild(overlay);

let authGuardResolved = false;

onAuthStateChanged(auth, (user) => {
  if (authGuardResolved) return;
  
  if (!user) {
    window.location.href = '/login';
    return;
  }
  
  const checkAdmin = async () => {
    try {
      // 5-second timeout for Firestore to prevent indefinite hanging
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000));
      const userDoc = await Promise.race([
        getDoc(doc(db, "users", user.uid)),
        timeoutPromise
      ]);
      
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        overlay.innerHTML = `
          <div class="text-center">
            <i class="fas fa-lock text-5xl text-red-500 mb-4"></i>
            <h2 class="text-2xl font-bold mb-2">غير مصرح</h2>
            <p class="mb-4 text-gray-300">ليس لديك صلاحية الدخول إلى لوحة الإدارة.</p>
            <a href="/" class="bg-red-600 px-6 py-2 rounded text-white hover:bg-red-700 transition">العودة للرئيسية</a>
          </div>
        `;
        setTimeout(() => { window.location.href = '/'; }, 3000);
        return;
      }
      
      // Success
      authGuardResolved = true;
      if (document.documentElement.contains(overlay)) {
        document.documentElement.removeChild(overlay);
      }
      document.body.classList.remove('hidden');
      
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          signOut(auth).then(() => {
            window.location.href = '/login';
          });
        });
      }
      
    } catch (e) {
      if (e.message === 'TIMEOUT' || e.message.includes('offline') || e.message.includes('reach Cloud Firestore')) {
        overlay.innerHTML = `
          <div class="text-center">
            <i class="fas fa-wifi text-5xl text-yellow-500 mb-4"></i>
            <h2 class="text-2xl font-bold mb-2">تعذر الاتصال بقاعدة البيانات</h2>
            <p class="mb-6 text-gray-400">الخادم لا يستجيب حالياً أو الاتصال ضعيف.</p>
            <div class="flex gap-4 justify-center">
              <button id="btn-retry-auth" class="bg-gray-700 px-6 py-2 rounded text-white hover:bg-gray-600 transition font-semibold">إعادة المحاولة</button>
              <a href="/" class="bg-red-600 px-6 py-2 rounded text-white hover:bg-red-700 transition font-semibold">العودة للرئيسية</a>
            </div>
          </div>
        `;
        document.getElementById('btn-retry-auth').addEventListener('click', () => {
          overlay.innerHTML = `
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
            <p class="text-lg font-semibold">جارٍ إعادة المحاولة...</p>
          `;
          checkAdmin();
        });
      } else {
        console.error('Error verifying admin status:', e);
        window.location.href = '/';
      }
    }
  };
  
  checkAdmin();
});
