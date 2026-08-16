import { auth, db, storage } from './firebase-init.js';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const loader = document.getElementById('loader');
const content = document.getElementById('profile-content');
const form = document.getElementById('profile-form');
const btnLogout = document.getElementById('btn-logout');
const btnSave = document.getElementById('btn-save');
const profileMsg = document.getElementById('profile-msg');
const btnResetPassword = document.getElementById('btn-reset-password');

let currentUserDoc = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        currentUserDoc = docSnap.data();
        
        // Update last login
        await updateDoc(docRef, { lastLoginAt: serverTimestamp() });
        
        if (currentUserDoc.accountStatus === 'banned' || currentUserDoc.accountStatus === 'deleted') {
          await signOut(auth);
          alert('هذا الحساب محظور أو محذوف.');
          window.location.href = '/login';
          return;
        }

        populateUI(user, currentUserDoc);
      } else {
        alert('حدث خطأ في جلب بيانات الحساب.');
        await signOut(auth);
        window.location.href = '/login';
      }
    } catch (err) {
      console.error(err);
      alert('خطأ في الاتصال بقاعدة البيانات.');
    }
  } else {
    window.location.replace('/login');
  }
});

// Handle BFCache navigation
window.addEventListener("pageshow", (event) => {
  if (event.persisted && auth.currentUser === null) {
    window.location.replace('/login');
  }
});

function populateUI(user, data) {
  loader.classList.add('hidden');
  content.classList.remove('hidden');

  document.getElementById('display-name-text').textContent = data.displayName || 'مستخدم جديد';
  document.getElementById('email-text').textContent = user.email;
  
  if (data.photoURL) {
    document.getElementById('profile-img').src = data.photoURL;
  }
  
  document.getElementById('input-display-name').value = data.displayName || '';
  document.getElementById('input-email').value = user.email || '';
  
  const roleBadge = document.getElementById('role-badge');
  roleBadge.innerHTML = `<i class="fas fa-shield-alt"></i> ${data.role === 'admin' ? 'مدير (Admin)' : 'مستخدم (User)'}`;
  
  const statusBadge = document.getElementById('status-badge');
  const statuses = {
    'active': 'نشط',
    'pending_verification': 'بانتظار التفعيل',
    'suspended': 'موقوف مؤقتاً',
    'banned': 'محظور',
    'deleted': 'محذوف'
  };
  statusBadge.innerHTML = `<i class="fas fa-check-circle"></i> ${statuses[data.accountStatus] || 'غير معروف'}`;
  
  if (data.accountStatus !== 'active') {
    statusBadge.className = 'px-3 py-1.5 text-sm font-bold rounded-lg bg-red-950/30 text-red-400 border border-red-900/50 shadow-sm flex items-center gap-2';
    statusBadge.innerHTML = `<i class="fas fa-times-circle"></i> ${statuses[data.accountStatus] || 'غير معروف'}`;
  }

  // Populate join date if available
  if (data.createdAt) {
    const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
    const dateString = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    
    const joinDateBadge = document.getElementById('join-date-badge');
    const joinDateText = document.getElementById('join-date-text');
    const sidebarJoinDate = document.getElementById('sidebar-join-date');
    
    if (joinDateBadge) joinDateBadge.classList.remove('hidden');
    if (joinDateText) joinDateText.textContent = dateString;
    if (sidebarJoinDate) sidebarJoinDate.textContent = dateString;
  }
}

// Upload Profile Image
document.getElementById('img-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate type and size (max 2MB)
  if (!file.type.startsWith('image/')) {
    alert('الرجاء رفع صورة صالحة.');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت.');
    return;
  }
  
  try {
    const user = auth.currentUser;
    const storageRef = ref(storage, `profile_images/${user.uid}_${Date.now()}`);
    
    document.getElementById('profile-img').style.opacity = '0.5';
    
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);
    
    await updateDoc(doc(db, 'users', user.uid), {
      photoURL: photoURL,
      updatedAt: serverTimestamp()
    });
    
    document.getElementById('profile-img').src = photoURL;
    alert('تم تحديث الصورة بنجاح!');
  } catch (error) {
    console.error(error);
    alert('حدث خطأ أثناء رفع الصورة.');
  } finally {
    document.getElementById('profile-img').style.opacity = '1';
  }
});

// Save Profile Info
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newName = document.getElementById('input-display-name').value.trim();
  
  if (!newName) return;
  
  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
  profileMsg.classList.add('hidden');
  profileMsg.classList.remove('bg-green-900/20', 'border-green-900/50', 'text-green-400', 'bg-red-900/20', 'border-red-900/50', 'text-red-400');
  
  try {
    const user = auth.currentUser;
    await updateDoc(doc(db, 'users', user.uid), {
      displayName: newName,
      updatedAt: serverTimestamp()
    });
    
    document.getElementById('display-name-text').textContent = newName;
    profileMsg.innerHTML = '<i class="fas fa-check-circle mr-1"></i> تم حفظ التعديلات بنجاح!';
    profileMsg.classList.add('bg-green-900/20', 'border-green-900/50', 'text-green-400');
    profileMsg.classList.remove('hidden');
  } catch (error) {
    console.error(error);
    profileMsg.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> فشل في حفظ التعديلات.';
    profileMsg.classList.add('bg-red-900/20', 'border-red-900/50', 'text-red-400');
    profileMsg.classList.remove('hidden');
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
  }
});

// Password Reset
if (btnResetPassword) {
  btnResetPassword.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    
    const originalText = btnResetPassword.innerHTML;
    btnResetPassword.disabled = true;
    btnResetPassword.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني.');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إرسال الرابط. يرجى المحاولة لاحقاً.');
    } finally {
      btnResetPassword.disabled = false;
      btnResetPassword.innerHTML = originalText;
    }
  });
}

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
});
