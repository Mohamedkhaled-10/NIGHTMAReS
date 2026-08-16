import { db } from '../../js/firebase-init.js';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const viewList = document.getElementById('view-list');
const viewEditor = document.getElementById('view-editor');
const tableBody = document.getElementById('posts-table-body');
const loadingIndicator = document.getElementById('loading-indicator');
const postForm = document.getElementById('post-form');

// Form Fields
const fId = document.getElementById('post-id');
const fTitle = document.getElementById('post-title');
const fSlug = document.getElementById('post-slug');
const fType = document.getElementById('post-type');
const fStatus = document.getElementById('post-status');
const fCover = document.getElementById('post-cover');
const fCategory = document.getElementById('post-category');
const fTagsInput = document.getElementById('post-tags-input');
const tagsContainer = document.getElementById('tags-container');
const fContentHtml = document.getElementById('post-content-html');
const fEmbedCode = document.getElementById('post-embed-code');
const fReadTime = document.getElementById('post-read-time');

let currentTags = [];

// Tags logic
fTagsInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const tag = fTagsInput.value.trim().replace(/^,+|,+$/g, '');
    if (tag && !currentTags.includes(tag)) {
      currentTags.push(tag);
      renderTags();
    }
    fTagsInput.value = '';
  }
});

function renderTags() {
  tagsContainer.innerHTML = '';
  currentTags.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm flex items-center gap-1';
    el.innerHTML = `
      ${tag}
      <button type="button" class="text-red-500 hover:text-red-700" onclick="removeTag('${tag}')">&times;</button>
    `;
    tagsContainer.appendChild(el);
  });
}

window.removeTag = function(tag) {
  currentTags = currentTags.filter(t => t !== tag);
  renderTags();
};

// UI Toggles for fields based on type
fType.addEventListener('change', () => {
  const type = fType.value;
  if (type === 'video') {
    document.getElementById('field-embed-code').classList.remove('hidden');
    document.getElementById('field-read-time').classList.add('hidden');
  } else if (type === 'news') {
    document.getElementById('field-embed-code').classList.add('hidden');
    document.getElementById('field-read-time').classList.add('hidden');
  } else {
    // story
    document.getElementById('field-embed-code').classList.add('hidden');
    document.getElementById('field-read-time').classList.remove('hidden');
  }
});

// Load Posts
async function loadPosts() {
  loadingIndicator.classList.remove('hidden');
  tableBody.innerHTML = '';
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    loadingIndicator.classList.add('hidden');
    
    if (querySnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">لا يوجد محتوى حالياً.</td></tr>';
      return;
    }
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-gray-900">${data.title}</td>
        <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">${data.type}</span></td>
        <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${data.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${data.status === 'published' ? 'منشور' : 'مسودة'}</span></td>
        <td class="px-6 py-4 text-gray-500">${data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('ar-EG') : '-'}</td>
        <td class="px-6 py-4 text-sm font-medium">
          <button class="text-indigo-600 hover:text-indigo-900 ml-3 btn-edit" data-id="${id}">تعديل</button>
          <button class="text-red-600 hover:text-red-900 btn-delete" data-id="${id}">حذف</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach events
    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e) => editPost(e.target.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => deletePost(e.target.dataset.id)));
    
  } catch (error) {
    console.error("Error loading posts:", error);
    loadingIndicator.innerHTML = '<span class="text-red-500 font-bold p-4 block">حدث خطأ أثناء جلب البيانات. (تأكد أن حسابك لديه صلاحيات الأدمن).</span>';
  }
}

// Show Editor
function showEditor(isNew = true) {
  viewList.classList.add('hidden');
  viewEditor.classList.remove('hidden');
  document.getElementById('editor-title').textContent = isNew ? 'إضافة محتوى' : 'تعديل المحتوى';
  if (isNew) {
    postForm.reset();
    fId.value = '';
    currentTags = [];
    renderTags();
    // trigger change to hide/show fields
    fType.dispatchEvent(new Event('change'));
  }
}

// Hide Editor
function hideEditor() {
  viewEditor.classList.add('hidden');
  viewList.classList.remove('hidden');
}

// Edit Post
async function editPost(id) {
  showEditor(false);
  try {
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      fId.value = docSnap.id;
      fTitle.value = data.title || '';
      fSlug.value = data.slug || '';
      fType.value = data.type || 'story';
      fStatus.value = data.status || 'draft';
      fCover.value = data.coverImage || '';
      fCategory.value = data.category || '';
      
      currentTags = Array.isArray(data.tags) ? data.tags : [];
      renderTags();
      
      if (data.data) {
        fContentHtml.value = data.data.contentHtml || '';
        fEmbedCode.value = data.data.embedCode || '';
        fReadTime.value = data.data.readTimeMinutes || '';
      }
      
      fType.dispatchEvent(new Event('change'));
    }
  } catch (e) {
    alert("Error fetching document.");
    console.error(e);
  }
}

// Delete Post
async function deletePost(id) {
  if (confirm("هل أنت متأكد من حذف هذا المحتوى نهائياً؟")) {
    try {
      await deleteDoc(doc(db, "posts", id));
      loadPosts();
    } catch (e) {
      alert("فشل الحذف. تأكد من أن حسابك يمتلك صلاحيات الإدارة.");
      console.error(e);
    }
  }
}

// Save Post
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = fId.value || 'doc_' + Date.now(); // Auto-generate simple ID if new
  
  const postData = {
    id: id,
    slug: fSlug.value,
    type: fType.value,
    category: fCategory.value,
    tags: currentTags,
    status: fStatus.value,
    title: fTitle.value,
    coverImage: fCover.value,
    updatedAt: serverTimestamp(),
    data: {
      contentHtml: fContentHtml.value
    }
  };
  
  if (!fId.value) {
    postData.createdAt = serverTimestamp();
  }

  // Type specific data
  if (fType.value === 'video') {
    postData.data.embedCode = fEmbedCode.value;
  } else if (fType.value === 'story') {
    postData.data.readTimeMinutes = parseInt(fReadTime.value) || 0;
  }
  
  try {
    const btnSave = document.getElementById('btn-save');
    btnSave.textContent = "جاري الحفظ...";
    btnSave.disabled = true;
    
    await setDoc(doc(db, "posts", id), postData, { merge: true });
    
    hideEditor();
    loadPosts();
    
    btnSave.textContent = "حفظ المحتوى";
    btnSave.disabled = false;
  } catch (error) {
    alert("حدث خطأ أثناء الحفظ. تأكد من أن حسابك يمتلك صلاحيات الإدارة.");
    console.error(error);
    const btnSave = document.getElementById('btn-save');
    btnSave.textContent = "حفظ المحتوى";
    btnSave.disabled = false;
  }
});

// Event Listeners
document.getElementById('btn-new-post').addEventListener('click', () => showEditor(true));
document.getElementById('btn-back').addEventListener('click', hideEditor);
document.getElementById('btn-cancel').addEventListener('click', hideEditor);

// Wait for auth state to be resolved before loading posts.
// The auth-guard.js script will handle redirecting unauthenticated users.
import { auth } from '../../js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPosts();
  }
});


// --- Submissions Logic ---
const menuPosts = document.getElementById('menu-posts');
const menuSubmissions = document.getElementById('menu-submissions');
const viewSubmissions = document.getElementById('view-submissions');
const viewSubmissionReader = document.getElementById('view-submission-reader');
const submissionsTableBody = document.getElementById('submissions-table-body');
const loadingIndicatorSub = document.getElementById('loading-indicator-sub');

let currentSubmission = null;

if (menuSubmissions) {
  menuSubmissions.addEventListener('click', () => {
    menuPosts.classList.remove('bg-gray-800', 'text-white');
    menuPosts.classList.add('text-gray-300');
    menuSubmissions?.classList.add('bg-gray-800', 'text-white');
    menuSubmissions?.classList.remove('text-gray-300');
    
    viewList.classList.add('hidden');
    viewEditor.classList.add('hidden');
    viewSubmissionReader.classList.add('hidden');
    viewSubmissions.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'مراجعة قصص المتابعين';
    document.getElementById('btn-new-post').classList.add('hidden');
    
    loadSubmissions();
  });
}

menuPosts.addEventListener('click', () => {
  menuSubmissions?.classList.remove('bg-gray-800', 'text-white');
  menuSubmissions?.classList.add('text-gray-300');
  menuPosts.classList.add('bg-gray-800', 'text-white');
  menuPosts.classList.remove('text-gray-300');
  
  viewSubmissions.classList.add('hidden');
  viewSubmissionReader.classList.add('hidden');
  viewEditor.classList.add('hidden');
  viewList.classList.remove('hidden');
  document.querySelector('header h2').textContent = 'إدارة المحتوى';
  document.getElementById('btn-new-post').classList.remove('hidden');
  
  loadPosts();
});

async function loadSubmissions() {
  loadingIndicatorSub.classList.remove('hidden');
  submissionsTableBody.innerHTML = '';
  try {
    const { collection, getDocs, query, where, orderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const q = query(collection(db, "user_submissions"), where("status", "==", "pending"), orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    loadingIndicatorSub.classList.add('hidden');
    
    if (querySnapshot.empty) {
      submissionsTableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">لا يوجد قصص بانتظار المراجعة.</td></tr>';
      return;
    }
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50 cursor-pointer btn-read-sub';
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-gray-900">${data.authorName || 'مجهول'}</td>
        <td class="px-6 py-4">${data.title}</td>
        <td class="px-6 py-4 text-gray-500">${data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('ar-EG') : '-'}</td>
        <td class="px-6 py-4 text-sm font-medium text-blue-600">قراءة ومراجعة</td>
      `;
      submissionsTableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-read-sub').forEach(tr => {
      tr.addEventListener('click', () => readSubmission(tr.dataset.id));
    });
    
  } catch (error) {
    console.error("Error loading submissions:", error);
    loadingIndicatorSub.innerHTML = '<span class="text-red-500 font-bold p-4 block">حدث خطأ أثناء جلب البيانات. (تأكد أنك أدمن).</span>';
  }
}

async function readSubmission(id) {
  viewSubmissions.classList.add('hidden');
  viewSubmissionReader.classList.remove('hidden');
  document.getElementById('reader-content').innerHTML = 'جاري التحميل...';
  
  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = doc(db, "user_submissions", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      currentSubmission = { id, ...docSnap.data() };
      document.getElementById('reader-title').textContent = currentSubmission.title;
      document.getElementById('reader-author').textContent = 'بواسطة: ' + (currentSubmission.authorName || 'مجهول');
      
      // Basic formatting for newlines
      const content = currentSubmission.content.replace(/\n/g, '<br>');
      document.getElementById('reader-content').innerHTML = content;
    }
  } catch (e) {
    console.error(e);
    alert('حدث خطأ');
  }
}

document.getElementById('btn-reader-back')?.addEventListener('click', () => {
  viewSubmissionReader.classList.add('hidden');
  viewSubmissions.classList.remove('hidden');
});

document.getElementById('btn-sub-approve')?.addEventListener('click', async () => {
  if(!currentSubmission) return;
  if(confirm('هل أنت متأكد من الموافقة على هذه القصة ونشرها للعامة؟')) {
    try {
      const { doc, setDoc, deleteDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      
      // 1. Create Post
      const postId = 'story_' + Date.now();
      
      // Auto-generate slug from title (basic)
      let slug = currentSubmission.title.trim().replace(/\s+/g, '-');
      // Append a random number to avoid conflicts
      slug += '-' + Math.floor(Math.random() * 1000);
      
      const postData = {
        id: postId,
        slug: slug,
        type: 'story',
        status: 'published',
        title: currentSubmission.title,
        coverImage: '', // default
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        data: {
          contentHtml: `<p><strong>قصة مرسلة من: ${currentSubmission.authorName}</strong></p><p>${currentSubmission.content.replace(/\n/g, '</p><p>')}</p>`,
          readTimeMinutes: Math.ceil(currentSubmission.content.length / 1000)
        }
      };
      
      await setDoc(doc(db, "posts", postId), postData);
      
      // 2. Delete from submissions
      await deleteDoc(doc(db, "user_submissions", currentSubmission.id));
      
      alert('تم النشر بنجاح!');
      viewSubmissionReader.classList.add('hidden');
      viewSubmissions.classList.remove('hidden');
      loadSubmissions();
    } catch(e) {
      console.error(e);
      alert('حدث خطأ أثناء النشر.');
    }
  }
});

document.getElementById('btn-sub-reject')?.addEventListener('click', async () => {
  if(!currentSubmission) return;
  if(confirm('هل أنت متأكد من رفض هذه القصة وحذفها؟')) {
    try {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await deleteDoc(doc(db, "user_submissions", currentSubmission.id));
      
      alert('تم الحذف بنجاح.');
      viewSubmissionReader.classList.add('hidden');
      viewSubmissions.classList.remove('hidden');
      loadSubmissions();
    } catch(e) {
      console.error(e);
      alert('حدث خطأ أثناء الحذف.');
    }
  }
});
// --- End Submissions Logic ---


// --- Ads and Notifications Logic ---
const menuAds = document.getElementById('menu-ads');
const menuNotifications = document.getElementById('menu-notifications');
const viewAds = document.getElementById('view-ads');
const viewNotifications = document.getElementById('view-notifications');

function hideAllViews() {
  viewList.classList.add('hidden');
  viewEditor.classList.add('hidden');
  viewSubmissionReader.classList.add('hidden');
  viewSubmissions.classList.add('hidden');
  if(viewAds) viewAds.classList.add('hidden');
  if(viewNotifications) viewNotifications.classList.add('hidden');
  
  [menuPosts, menuSubmissions, menuAds, menuNotifications].forEach(m => {
    if(m) {
      m.classList.remove('bg-gray-800', 'text-white');
      m.classList.add('text-gray-300');
    }
  });
  document.getElementById('btn-new-post').classList.add('hidden');
}

if(menuAds) {
  menuAds.addEventListener('click', () => {
    hideAllViews();
    menuAds.classList.add('bg-gray-800', 'text-white');
    menuAds.classList.remove('text-gray-300');
    viewAds.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'إدارة الإعلانات';
    loadAds();
  });
}

if(menuNotifications) {
  menuNotifications.addEventListener('click', () => {
    hideAllViews();
    menuNotifications.classList.add('bg-gray-800', 'text-white');
    menuNotifications.classList.remove('text-gray-300');
    viewNotifications.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'إدارة الإشعارات';
  });
}

// Override previous clicks to use hideAllViews
if(menuPosts) {
  menuPosts.addEventListener('click', () => {
    hideAllViews();
    menuPosts.classList.add('bg-gray-800', 'text-white');
    menuPosts.classList.remove('text-gray-300');
    viewList.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'إدارة المحتوى';
    document.getElementById('btn-new-post').classList.remove('hidden');
    loadPosts();
  });
}

if(menuSubmissions) {
  menuSubmissions.addEventListener('click', () => {
    hideAllViews();
    menuSubmissions?.classList.add('bg-gray-800', 'text-white');
    menuSubmissions?.classList.remove('text-gray-300');
    viewSubmissions.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'مراجعة قصص المتابعين';
    loadSubmissions();
  });
}

// --- Dashboard New Views (Users, Comments, Audit) ---
const menuOverview = document.getElementById('menu-overview');
const menuUsers = document.getElementById('menu-users');
const menuComments = document.getElementById('menu-comments');
const menuAudit = document.getElementById('menu-audit');

const viewUsers = document.getElementById('view-users');
const viewComments = document.getElementById('view-comments');
const viewAudit = document.getElementById('view-audit');

function overrideHideAllViews() {
  hideAllViews();
  if(viewUsers) viewUsers.classList.add('hidden');
  if(viewComments) viewComments.classList.add('hidden');
  if(viewAudit) viewAudit.classList.add('hidden');
  
  [menuOverview, menuUsers, menuComments, menuAudit].forEach(m => {
    if(m) {
      m.classList.remove('bg-gray-800', 'text-white');
      m.classList.add('text-gray-300');
    }
  });
}

if(menuUsers) {
  menuUsers.addEventListener('click', () => {
    overrideHideAllViews();
    menuUsers.classList.add('bg-gray-800', 'text-white');
    menuUsers.classList.remove('text-gray-300');
    viewUsers.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'إدارة المستخدمين (Users)';
    loadUsersAdmin();
  });
}

if(menuComments) {
  menuComments.addEventListener('click', () => {
    overrideHideAllViews();
    menuComments.classList.add('bg-gray-800', 'text-white');
    menuComments.classList.remove('text-gray-300');
    viewComments.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'إدارة التعليقات (Comments)';
    loadCommentsAdmin();
  });
}

if(menuAudit) {
  menuAudit.addEventListener('click', () => {
    overrideHideAllViews();
    menuAudit.classList.add('bg-gray-800', 'text-white');
    menuAudit.classList.remove('text-gray-300');
    viewAudit.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'سجلات النظام (Audit Logs)';
    loadAuditAdmin();
  });
}

// Users Admin Logic
async function loadUsersAdmin() {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">جاري التحميل...</td></tr>';
  try {
    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const snapshot = await getDocs(collection(db, "users"));
    tbody.innerHTML = '';
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.innerHTML = `
        <td class="px-6 py-4">${data.displayName || 'بدون اسم'}</td>
        <td class="px-6 py-4" dir="ltr" style="text-align: right;">${data.email}</td>
        <td class="px-6 py-4">${data.role === 'admin' ? '<span class="text-red-600 font-bold">Admin</span>' : 'User'}</td>
        <td class="px-6 py-4">${data.accountStatus === 'banned' ? '<span class="text-red-600">محظور</span>' : data.accountStatus === 'deleted' ? '<span class="text-gray-500">محذوف</span>' : '<span class="text-green-600">نشط</span>'}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">
          <button class="bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300 text-xs" onclick="changeUserStatus('${data.uid}', 'active')">تنشيط</button>
          <button class="bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 text-xs" onclick="changeUserStatus('${data.uid}', 'banned')">حظر</button>
          <button class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 text-xs" onclick="changeUserRole('${data.uid}', '${data.role === 'admin' ? 'user' : 'admin'}')">تغيير Role</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
  }
}

window.changeUserStatus = async (uid, newStatus) => {
  if(!confirm(`هل أنت متأكد من تغيير حالة المستخدم إلى ${newStatus}؟`)) return;
  try {
    const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "users", uid), { accountStatus: newStatus });
    
    // Log Audit
    await addDoc(collection(db, "audit_logs"), {
      adminUid: auth.currentUser.uid,
      action: 'CHANGE_USER_STATUS',
      targetUid: uid,
      targetType: 'user',
      timestamp: serverTimestamp(),
      metadata: { newStatus }
    });
    
    loadUsersAdmin();
  } catch(e) { alert("حدث خطأ."); console.error(e); }
};

window.changeUserRole = async (uid, newRole) => {
  if(!confirm(`هل أنت متأكد من تغيير صلاحية المستخدم إلى ${newRole}؟`)) return;
  try {
    const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "users", uid), { role: newRole });
    
    // Log Audit
    await addDoc(collection(db, "audit_logs"), {
      adminUid: auth.currentUser.uid,
      action: 'CHANGE_USER_ROLE',
      targetUid: uid,
      targetType: 'user',
      timestamp: serverTimestamp(),
      metadata: { newRole }
    });
    
    loadUsersAdmin();
  } catch(e) { alert("حدث خطأ."); console.error(e); }
};

// Comments Admin Logic
async function loadCommentsAdmin() {
  const tbody = document.getElementById('comments-table-body');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">جاري التحميل...</td></tr>';
  try {
    const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const snapshot = await getDocs(query(collection(db, "comments"), orderBy('createdAt', 'desc')));
    tbody.innerHTML = '';
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.innerHTML = `
        <td class="px-6 py-4">${data.authorName}</td>
        <td class="px-6 py-4">${data.contentId}</td>
        <td class="px-6 py-4 truncate max-w-xs" title="${data.text}">${data.text}</td>
        <td class="px-6 py-4">${data.status === 'visible' ? '<span class="text-green-600">مرئي</span>' : '<span class="text-red-600">مخفي/محذوف</span>'}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">
          <button class="text-red-600 hover:underline text-sm" onclick="moderateComment('${docSnap.id}', 'deleted')">حذف</button>
          <button class="text-green-600 hover:underline text-sm" onclick="moderateComment('${docSnap.id}', 'visible')">إظهار</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
  }
}

window.moderateComment = async (commentId, newStatus) => {
  if(!confirm(`تأكيد تغيير حالة التعليق؟`)) return;
  try {
    const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "comments", commentId), { status: newStatus });
    
    // Log Audit
    await addDoc(collection(db, "audit_logs"), {
      adminUid: auth.currentUser.uid,
      action: 'MODERATE_COMMENT',
      targetUid: commentId,
      targetType: 'comment',
      timestamp: serverTimestamp(),
      metadata: { newStatus }
    });
    
    loadCommentsAdmin();
  } catch(e) { alert("حدث خطأ."); console.error(e); }
};

// Audit Logs Logic
async function loadAuditAdmin() {
  const tbody = document.getElementById('audit-table-body');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">جاري التحميل...</td></tr>';
  try {
    const { collection, getDocs, query, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const snapshot = await getDocs(query(collection(db, "audit_logs"), orderBy('timestamp', 'desc'), limit(50)));
    tbody.innerHTML = '';
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleString('ar-EG') : '';
      tr.innerHTML = `
        <td class="px-6 py-4 text-sm">${dateStr}</td>
        <td class="px-6 py-4 text-xs font-mono">${data.adminUid}</td>
        <td class="px-6 py-4 font-bold text-red-600">${data.action}</td>
        <td class="px-6 py-4 text-xs font-mono">${data.targetUid}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${JSON.stringify(data.metadata || {})}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 p-4">لا تملك صلاحية قراءة السجلات.</td></tr>';
  }
}
// Ads Logic
async function loadAds() {
  const tbody = document.getElementById('ads-table-body');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">جاري التحميل...</td></tr>';
  try {
    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const querySnapshot = await getDocs(collection(db, "ads_templates"));
    
    tbody.innerHTML = '';
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-500">لا توجد إعلانات.</td></tr>';
      return;
    }
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.innerHTML = `
        <td class="p-3"><img src="${data.image}" class="h-12 w-20 object-cover rounded"></td>
        <td class="p-3">${data.text || '-'}</td>
        <td class="p-3">
          <span class="px-2 py-1 rounded text-xs text-white ${data.isActive ? 'bg-green-600' : 'bg-red-600'}">
            ${data.isActive ? 'مفعل' : 'معطل'}
          </span>
        </td>
        <td class="p-3">
          <button class="text-indigo-600 hover:text-indigo-900 ml-3 btn-edit-ad" data-id="${id}">تعديل</button>
          <button class="text-red-600 hover:text-red-900 btn-delete-ad" data-id="${id}">حذف</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-edit-ad').forEach(btn => btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docSnap = await getDoc(doc(db, "ads_templates", id));
      if (docSnap.exists()) {
        const d = docSnap.data();
        document.getElementById('ad-id').value = id;
        document.getElementById('ad-image').value = d.image;
        document.getElementById('ad-link').value = d.link;
        document.getElementById('ad-text').value = d.text || '';
        document.getElementById('ad-active').checked = d.isActive;
      }
    }));

    document.querySelectorAll('.btn-delete-ad').forEach(btn => btn.addEventListener('click', async (e) => {
      if(confirm('متأكد؟')) {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await deleteDoc(doc(db, "ads_templates", e.target.dataset.id));
        loadAds();
      }
    }));
    
  } catch (error) {
    console.error(error);
  }
}

document.getElementById('ad-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('ad-id').value || 'ad_' + Date.now();
  const data = {
    image: document.getElementById('ad-image').value,
    link: document.getElementById('ad-link').value,
    text: document.getElementById('ad-text').value,
    isActive: document.getElementById('ad-active').checked,
  };
  
  try {
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await setDoc(doc(db, "ads_templates", id), data);
    document.getElementById('ad-form').reset();
    document.getElementById('ad-id').value = '';
    loadAds();
  } catch(err) {
    alert('خطأ في الحفظ');
  }
});

// Notifications Logic
document.getElementById('notif-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('notif-text').value;
  const link = document.getElementById('notif-link').value;
  const image = document.getElementById('notif-image').value;
  
  const btn = document.getElementById('btn-send-notif');
  btn.disabled = true;
  btn.textContent = 'جاري الإرسال...';
  
  try {
    const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    // We will save to a special document that the clients listen to for "live notification"
    await setDoc(doc(db, "system", "live_notification"), {
      text,
      link,
      image,
      timestamp: serverTimestamp()
    });
    
    document.getElementById('notif-form').reset();
    const st = document.getElementById('notif-status');
    st.textContent = 'تم إرسال الإشعار لجميع المستخدمين المتصلين!';
    st.classList.remove('hidden');
    setTimeout(() => st.classList.add('hidden'), 5000);
  } catch(err) {
    alert('خطأ في إرسال الإشعار');
  } finally {
    btn.disabled = false;
    btn.textContent = 'إرسال الإشعار الآن';
  }
});

