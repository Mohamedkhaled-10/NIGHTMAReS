import { auth, db, storage } from './firebase-init.js';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { UILoadingSkeleton, UIEmptyState, UIErrorState, UISpinner } from './ui-utils.js';

const loader = document.getElementById('loader');
const content = document.getElementById('profile-content');
const form = document.getElementById('profile-form');
const btnLogout = document.getElementById('btn-logout');
const btnSave = document.getElementById('btn-save');
const profileMsg = document.getElementById('profile-msg');
const btnResetPassword = document.getElementById('btn-reset-password');

let currentUserDoc = null;

loader.innerHTML = UISpinner("استحضار بيانات الحساب...");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        currentUserDoc = docSnap.data();
        
        // Update last login in background (non-blocking)
        updateDoc(docRef, { lastLoginAt: serverTimestamp() }).catch(e => console.error("Error updating login time:", e));
        
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

  // Load Bookmarks and History
  loadUserBookmarks(user.uid);
  loadUserHistory(user.uid);
  loadUserSubmissions(user.uid);
}

async function loadUserSubmissions(uid) {
  const container = document.getElementById('submissions-list');
  try {
    const q = query(collection(db, 'user_submissions'), where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      container.innerHTML = UIEmptyState("لا توجد مساهمات لك بعد.", "fa-pen-nib");
      return;
    }
    
    container.innerHTML = '';
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ar-EG') : '';
      
      let statusHtml = '';
      if (data.status === 'submitted' || data.status === 'pending') statusHtml = '<span class="text-yellow-500 bg-yellow-900/30 px-2 py-0.5 rounded text-xs">قيد المراجعة</span>';
      else if (data.status === 'approved' || data.status === 'published') statusHtml = '<span class="text-green-500 bg-green-900/30 px-2 py-0.5 rounded text-xs">منشورة</span>';
      else if (data.status === 'rejected') statusHtml = '<span class="text-red-500 bg-red-900/30 px-2 py-0.5 rounded text-xs">مرفوضة</span>';
      else if (data.status === 'needs_edit') statusHtml = '<span class="text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded text-xs">تحتاج تعديل</span>';
      else statusHtml = `<span class="text-gray-400 bg-gray-900 px-2 py-0.5 rounded text-xs">${data.status}</span>`;

      const reasonHtml = data.rejectionReason ? `<p class="mt-2 text-xs text-red-400 p-2 bg-red-950/30 rounded border border-red-900/50"><strong>سبب الرفض/التعديل:</strong> ${data.rejectionReason}</p>` : '';

      let actionBtnHtml = '';
      if (data.status === 'needs_edit') {
        actionBtnHtml = `<button onclick="editSubmission('${docSnap.id}')" class="mt-2 text-orange-400 border border-orange-900/50 bg-orange-950/20 px-4 py-1.5 rounded-lg text-xs hover:bg-orange-900/40 transition">تعديل التقديم</button>`;
      }

      container.innerHTML += `
        <div class="p-4 bg-black/40 border border-gray-800/50 rounded-xl hover:border-red-900/50 transition-colors">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold text-gray-200">${data.title || 'بدون عنوان'}</h4>
            ${statusHtml}
          </div>
          <div class="text-xs text-gray-500 mb-2">${dateStr}</div>
          ${reasonHtml}
          ${actionBtnHtml}
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading submissions:", error);
    if (error.code === 'failed-precondition') {
       container.innerHTML = UIErrorState("فهرس قاعدة البيانات لم يكتمل بعد. يرجى المحاولة لاحقاً.", "retry-submissions");
    } else {
       container.innerHTML = UIErrorState("تعذر تحميل المساهمات. يرجى المحاولة لاحقاً.", "retry-submissions");
    }
    document.getElementById('retry-submissions')?.addEventListener('click', () => loadUserSubmissions(uid));
  }
}

window.editSubmission = (id) => {
  // Store the submission ID to be edited in sessionStorage and redirect to submit page
  sessionStorage.setItem('editSubmissionId', id);
  window.location.href = '/submit.html';
};

async function loadUserBookmarks(uid) {
  const container = document.getElementById('saved-content-list');
  container.innerHTML = UILoadingSkeleton(1);
  try {
    const q = query(collection(db, 'user_bookmarks'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      container.innerHTML = UIEmptyState("لا توجد عناصر محفوظة.", "fa-bookmark");
      return;
    }
    
    container.innerHTML = '';
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      container.innerHTML += renderMiniCard(data.contentId, data, false, docSnap.id);
    });
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    container.innerHTML = UIErrorState("حدث خطأ في جلب المحفوظات.", "retry-bookmarks");
    document.getElementById('retry-bookmarks')?.addEventListener('click', () => loadUserBookmarks(uid));
  }
}

async function loadUserHistory(uid) {
  const container = document.getElementById('history-content-list');
  container.innerHTML = UILoadingSkeleton(1);
  try {
    const q = query(collection(db, 'user_history'), where('userId', '==', uid), orderBy('viewedAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      container.innerHTML = UIEmptyState("سجل القراءة فارغ.", "fa-clock-rotate-left");
      return;
    }
    
    container.innerHTML = '';
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      container.innerHTML += renderMiniCard(data.contentId, data, true);
    });
  } catch (error) {
    console.error("Error loading history:", error);
    container.innerHTML = UIErrorState("حدث خطأ في جلب السجل.", "retry-history");
    document.getElementById('retry-history')?.addEventListener('click', () => loadUserHistory(uid));
  }
}

function renderMiniCard(id, data, isHistory = false, docId = null) {
  const dateObj = isHistory && data.viewedAt ? data.viewedAt.toDate() : 
                  (!isHistory && data.createdAt ? data.createdAt.toDate() : null);
  const dateStr = dateObj ? dateObj.toLocaleDateString('ar-EG') : '';
  const typeText = data.contentType === 'story' ? 'قصة' : data.contentType === 'news' ? 'خبر' : data.contentType === 'video' ? 'فيديو' : 'محتوى';
  const url = `/${data.contentType}/${data.contentId}`;
  
  const actionHtml = isHistory ? 
    `<i class="fas fa-chevron-left text-gray-600 group-hover:text-red-500 transition-colors pl-2"></i>` :
    `<button onclick="removeBookmark('${docId}', event)" class="p-2 text-gray-500 hover:text-red-500 transition-colors" title="إزالة من المحفوظات"><i class="fas fa-trash"></i></button>`;

  return `
    <a href="${url}" class="flex items-center gap-4 p-3 bg-black/40 border border-gray-800/50 rounded-xl hover:border-red-900/50 transition-colors group">
      <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-900">
        <img src="${data.image || '/assets/images/logo1.png'}" alt="cover" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onerror="this.src='/assets/images/logo1.png'">
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-gray-200 truncate group-hover:text-red-400 transition-colors">${data.title || 'بدون عنوان'}</h4>
        <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span class="px-2 py-0.5 rounded bg-gray-900 border border-gray-800">${typeText}</span>
          <span>${dateStr}</span>
        </div>
      </div>
      ${actionHtml}
    </a>
  `;
}

window.removeBookmark = async (bookmarkId, event) => {
  event.preventDefault();
  if (!confirm('هل أنت متأكد من إزالة هذا المحتوى من المحفوظات؟')) return;
  try {
    const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await deleteDoc(doc(db, 'user_bookmarks', bookmarkId));
    loadUserBookmarks(auth.currentUser.uid);
  } catch (error) {
    console.error("Error removing bookmark:", error);
    alert('حدث خطأ أثناء الإزالة.');
  }
};

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
