import { auth, db, storage } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const loader = document.getElementById('loader');
const content = document.getElementById('profile-content');
const form = document.getElementById('profile-form');
const btnLogout = document.getElementById('btn-logout');
const btnSave = document.getElementById('btn-save');
const profileMsg = document.getElementById('profile-msg');

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
  roleBadge.textContent = data.role === 'admin' ? 'مدير (Admin)' : 'مستخدم (User)';
  
  const statusBadge = document.getElementById('status-badge');
  const statuses = {
    'active': 'نشط',
    'pending_verification': 'بانتظار التفعيل',
    'suspended': 'موقوف مؤقتاً',
    'banned': 'محظور',
    'deleted': 'محذوف'
  };
  statusBadge.textContent = statuses[data.accountStatus] || 'غير معروف';
  if (data.accountStatus !== 'active') {
    statusBadge.className = 'px-2 py-1 text-xs rounded bg-red-900 text-red-200';
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
  
  try {
    const user = auth.currentUser;
    await updateDoc(doc(db, 'users', user.uid), {
      displayName: newName,
      updatedAt: serverTimestamp()
    });
    
    document.getElementById('display-name-text').textContent = newName;
    profileMsg.textContent = 'تم حفظ التعديلات بنجاح!';
    profileMsg.className = 'text-sm font-semibold text-green-500 mt-2 block';
  } catch (error) {
    console.error(error);
    profileMsg.textContent = 'فشل في حفظ التعديلات.';
    profileMsg.className = 'text-sm font-semibold text-red-500 mt-2 block';
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'حفظ التعديلات';
  }
});

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
});
