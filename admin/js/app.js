import { db } from '../../js/firebase-init.js';
import { showToast, showConfirmModal, showPromptModal } from '../../js/ui-utils.js';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc, getCountFromServer, startAfter, getAggregateFromServer, sum, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const fSeoDesc = document.getElementById('post-seo-desc');
const fPublishAt = document.getElementById('post-publish-at');
const fUpdatedAt = document.getElementById('post-updated-at');
const fFeatured = document.getElementById('post-featured');
const btnPreview = document.getElementById('btn-preview-post');
const charCountContent = document.getElementById('char-count-content');

let currentTags = [];

// Content character count logic
fContentHtml.addEventListener('input', () => {
  const count = fContentHtml.value.length;
  charCountContent.textContent = `${count} حرف`;
});

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

let currentPostsLoadToken = 0;
let lastDoc_Posts = null;

// Load Posts
async function loadPosts(isLoadMore = false) {
  const token = ++currentPostsLoadToken;
  if (!isLoadMore) {
    loadingIndicator.classList.remove('hidden');
    tableBody.innerHTML = '';
    lastDoc_Posts = null;
  }
  
  try {
    const { limit, startAfter } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [orderBy("createdAt", "desc"), limit(50)];
    if (isLoadMore && lastDoc_Posts) {
      constraints.push(startAfter(lastDoc_Posts));
    }
    const q = query(collection(db, "posts"), ...constraints);
    const querySnapshot = await getDocs(q);
    
    if (token !== currentPostsLoadToken) return;
    
    loadingIndicator.classList.add('hidden');
    
    if (querySnapshot.empty && !isLoadMore) {
      tableBody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-folder-open text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا يوجد محتوى حالياً</p></div></td></tr>`;
      document.getElementById('btn-load-posts-container')?.classList.add('hidden');
      return;
    }
    
    const renderedIds = new Set();
    querySnapshot.forEach((docSnap) => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      
      const data = docSnap.data();
      if (document.getElementById('posts-table-body').querySelector(`tr[data-id="${id}"]`)) return; // Prevent duplicate
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.dataset.id = id;
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

    if (querySnapshot.docs.length > 0) {
      lastDoc_Posts = querySnapshot.docs[querySnapshot.docs.length - 1];
    }
    
    if (querySnapshot.docs.length === 50) {
      document.getElementById('btn-load-posts-container')?.classList.remove('hidden');
    } else {
      document.getElementById('btn-load-posts-container')?.classList.add('hidden');
    }

    // Attach events
    document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', (e) => editPost(e.target.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', (e) => deletePost(e.target.dataset.id, e.target)));
    
  } catch (error) {
    if (token !== currentPostsLoadToken) return;
    console.error("Error loading posts:", error);
    loadingIndicator.innerHTML = '<span class="text-red-500 font-bold p-4 block">حدث خطأ أثناء جلب البيانات. (تأكد أنك أدمن).</span>';
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
    fUpdatedAt.textContent = '-';
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
      
      fSeoDesc.value = data.seoDescription || '';
      fFeatured.checked = !!data.isFeatured;
      
      if (data.publishAt) {
        // Firestore timestamp to datetime-local
        const d = data.publishAt.toDate();
        // format: YYYY-MM-DDThh:mm
        const pad = n => n.toString().padStart(2, '0');
        fPublishAt.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else {
        fPublishAt.value = '';
      }
      
      if (data.updatedAt) {
        fUpdatedAt.textContent = new Date(data.updatedAt.toDate()).toLocaleString('ar-EG');
      } else if (data.createdAt) {
        fUpdatedAt.textContent = new Date(data.createdAt.toDate()).toLocaleString('ar-EG');
      } else {
        fUpdatedAt.textContent = '-';
      }
      
      btnPreview.classList.remove('hidden');
      btnPreview.onclick = () => {
        window.open(`/${data.type}/${data.slug}?preview=true`, '_blank');
      };
      
      if (data.data) {
        fContentHtml.value = data.data.contentHtml || '';
        fEmbedCode.value = data.data.embedCode || '';
        fReadTime.value = data.data.readTimeMinutes || '';
      }
      
      // Update char count
      charCountContent.textContent = `${fContentHtml.value.length} حرف`;
      
      fType.dispatchEvent(new Event('change'));
    }
  } catch (e) {
    showToast({ type: 'error', message: 'خطأ في جلب البيانات' });
    console.error(e);
  }
}

// Delete Post
async function deletePost(id, btnElement) {
  if (btnElement && btnElement.disabled) return;
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  if (await showConfirmModal({ title: 'تأكيد الحذف', message: 'هل أنت متأكد من حذف هذا المحتوى نهائياً؟' })) {
    try {
      await deleteDoc(doc(db, "posts", id));
      loadPosts();
    } catch (e) {
      showToast({ type: 'error', message: 'فشل الحذف. تأكد من أن حسابك يمتلك صلاحيات الإدارة.' });
      console.error(e);
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = 'حذف';
      }
    }
  } else {
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = 'حذف';
    }
  }
}

// Save Post
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = fId.value || 'doc_' + Date.now(); // Auto-generate simple ID if new
  
  // Slug Normalization
  let normalizedSlug = fSlug.value.trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphen
    .replace(/[^\w\u0600-\u06FF-]/g, '') // Remove invalid URL chars (keeps alphanumeric, Arabic, hyphen)
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  fSlug.value = normalizedSlug;

  if (!normalizedSlug) {
    showToast({ type: 'error', message: 'الرابط (Slug) لا يمكن أن يكون فارغاً.' });
    return;
  }
  
  const btnSave = document.getElementById('btn-save');
  btnSave.textContent = "جاري التحقق...";
  btnSave.disabled = true;

  try {
    // Check Slug Uniqueness
    const { collection, getDocs, query, where, doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    
    const q = query(collection(db, "posts"), where("slug", "==", normalizedSlug));
    const snap = await getDocs(q);
    let isDuplicate = false;
    snap.forEach(docSnap => {
      if (docSnap.id !== id) { // Allow updating the same post
        isDuplicate = true;
      }
    });

    if (isDuplicate) {
      showToast({ type: 'error', title: 'تنبيه', message: 'هذا الرابط (Slug) مستخدم بالفعل في مقال آخر. يرجى تعديله ليكون فريداً.' });
      btnSave.textContent = "حفظ المحتوى";
      btnSave.disabled = false;
      return;
    }

    btnSave.textContent = "جاري الحفظ...";

    // Sanitize HTML Content
    const sanitizedHtml = window.DOMPurify ? DOMPurify.sanitize(fContentHtml.value, { USE_PROFILES: { html: true } }) : fContentHtml.value;
    
    // Sanitize Embed Code (allowing iframes safely)
    const sanitizedEmbed = window.DOMPurify ? DOMPurify.sanitize(fEmbedCode.value, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) : fEmbedCode.value;

    const postData = {
      id: id,
      slug: normalizedSlug,
      type: fType.value,
      category: fCategory.value,
      tags: currentTags,
      status: fStatus.value,
      title: fTitle.value,
      coverImage: fCover.value,
      seoDescription: fSeoDesc.value,
      isFeatured: fFeatured.checked,
      updatedAt: serverTimestamp(),
      data: {
        contentHtml: sanitizedHtml
      }
    };
    
    if (fPublishAt.value) {
      postData.publishAt = new Date(fPublishAt.value);
    } else {
      postData.publishAt = null;
    }
    
    if (!fId.value) {
      postData.createdAt = serverTimestamp();
    }

    // Type specific data
    if (fType.value === 'video') {
      postData.data.embedCode = sanitizedEmbed;
    } else if (fType.value === 'story') {
      postData.data.readTimeMinutes = parseInt(fReadTime.value) || 0;
    }
    
    await setDoc(doc(db, "posts", id), postData, { merge: true });
    
    hideEditor();
    loadPosts();
    showToast({ type: 'success', message: 'تم حفظ المحتوى بنجاح' });
    
    btnSave.textContent = "حفظ المحتوى";
    btnSave.disabled = false;
  } catch (error) {
    showToast({ type: 'error', title: 'خطأ', message: 'حدث خطأ أثناء الحفظ. تأكد من أن حسابك يمتلك صلاحيات الإدارة.' });
    console.error(error);
    btnSave.textContent = "حفظ المحتوى";
    btnSave.disabled = false;
  }
});
// Event Listeners
document.getElementById('btn-load-ads')?.addEventListener('click', () => loadAds(true));
document.getElementById('btn-load-audit')?.addEventListener('click', () => loadAuditAdmin(true));
document.getElementById('btn-load-reports')?.addEventListener('click', () => loadReports(true));
document.getElementById('btn-load-comments')?.addEventListener('click', () => loadCommentsAdmin(true));
document.getElementById('btn-load-users')?.addEventListener('click', () => loadUsersAdmin(true));
document.getElementById('btn-load-submissions')?.addEventListener('click', () => loadSubmissions(true));
document.getElementById('btn-load-posts')?.addEventListener('click', () => loadPosts(true));
document.getElementById('btn-new-post').addEventListener('click', () => showEditor(true));
document.getElementById('btn-back').addEventListener('click', hideEditor);
document.getElementById('btn-cancel').addEventListener('click', hideEditor);

// Wait for auth state to be resolved before loading posts.
// The auth-guard.js script will handle redirecting unauthenticated users.
import { auth } from '../../js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    const menuOverview = document.getElementById('menu-overview');
    if (menuOverview) {
      menuOverview.click();
    } else {
      loadPosts();
    }
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

let currentSubLoadToken = 0;
let lastDoc_Submissions = null;

async function loadSubmissions(isLoadMore = false) {
  const token = ++currentSubLoadToken;
  if (!isLoadMore) {
    loadingIndicatorSub.classList.remove('hidden');
    submissionsTableBody.innerHTML = '';
    lastDoc_Submissions = null;
  }
  
  try {
    const { collection, getDocs, query, where, orderBy, limit, startAfter } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [where("status", "==", "submitted"), orderBy("createdAt", "asc"), limit(50)];
    if (isLoadMore && lastDoc_Submissions) {
      constraints.push(startAfter(lastDoc_Submissions));
    }
    
    const q = query(collection(db, "user_submissions"), ...constraints);
    const snap = await getDocs(q);
    
    if (token !== currentSubLoadToken) return;
    
    loadingIndicatorSub.classList.add('hidden');
    
    if (snap.empty && !isLoadMore) {
      submissionsTableBody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-inbox text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا توجد مشاركات جديدة تحتاج للمراجعة</p></div></td></tr>`;
      document.getElementById('btn-load-submissions-container')?.classList.add('hidden');
      return;
    }
    
    const renderedIds = new Set();
    snap.forEach(docSnap => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      
      const data = docSnap.data();
      if (document.getElementById('submissions-table-body').querySelector(`tr[data-id="${id}"]`)) return; // Prevent duplicate
      
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

    if (snap.docs.length > 0) {
      lastDoc_Submissions = snap.docs[snap.docs.length - 1];
    }
    
    if (snap.docs.length === 50) {
      document.getElementById('btn-load-submissions-container')?.classList.remove('hidden');
    } else {
      document.getElementById('btn-load-submissions-container')?.classList.add('hidden');
    }

    document.querySelectorAll('.btn-read-sub').forEach(tr => {
      tr.addEventListener('click', () => readSubmission(tr.dataset.id));
    });
    
  } catch (error) {
    if (token !== currentSubLoadToken) return;
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
    showToast({ type: 'error', message: 'حدث خطأ' });
  }
}

document.getElementById('btn-reader-back')?.addEventListener('click', () => {
  viewSubmissionReader.classList.add('hidden');
  viewSubmissions.classList.remove('hidden');
});

document.getElementById('btn-sub-approve')?.addEventListener('click', async () => {
  if(!currentSubmission) return;
  
  const btn = document.getElementById('btn-sub-approve');
  if (btn.disabled) return;

  if (await showConfirmModal({ title: 'نشر القصة', message: 'هل أنت متأكد من الموافقة على هذه القصة ونشرها للعامة؟', confirmColor: 'green' })) {
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري النشر...';

    try {
      const { doc, collection, serverTimestamp, runTransaction } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      
      await runTransaction(db, async (transaction) => {
        const subRef = doc(db, "user_submissions", currentSubmission.id);
        const subDoc = await transaction.get(subRef);
        
        if (!subDoc.exists()) {
          throw new Error("NOT_FOUND");
        }
        
        const subData = subDoc.data();
        if (subData.status === 'approved' || subData.publishedPostId) {
          throw new Error("ALREADY_APPROVED");
        }

        // 1. Create Post
        const postId = 'story_' + Date.now();
        const postRef = doc(db, "posts", postId);
        
        let slug = currentSubmission.title.trim().replace(/\s+/g, '-');
        slug += '-' + Math.floor(Math.random() * 1000);
        
        const postData = {
          id: postId,
          slug: slug,
          type: 'story',
          status: 'published',
          title: currentSubmission.title,
          coverImage: '',
          authorUid: currentSubmission.uid || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          sourceSubmissionId: currentSubmission.id,
          data: {
            contentHtml: window.DOMPurify 
              ? DOMPurify.sanitize(`<p><strong>قصة مرسلة من: ${currentSubmission.authorName}</strong></p><p>${currentSubmission.content.replace(/\n/g, '</p><p>')}</p>`, { USE_PROFILES: { html: true } })
              : `<p><strong>قصة مرسلة من: ${currentSubmission.authorName}</strong></p><p>${currentSubmission.content.replace(/\n/g, '</p><p>')}</p>`,
            readTimeMinutes: Math.ceil(currentSubmission.content.length / 1000)
          }
        };
        
        transaction.set(postRef, postData);
        
        // 2. Send Notification
        if (currentSubmission.uid) {
          const notifRef = doc(collection(db, "notifications"));
          transaction.set(notifRef, {
            userId: currentSubmission.uid,
            type: 'story_approved',
            title: 'تمت الموافقة على قصتك',
            message: `تم نشر قصتك "${currentSubmission.title}".`,
            link: `/story/${slug}`,
            read: false,
            createdAt: serverTimestamp()
          });
        }
        
        // 3. Update Submission Status
        transaction.update(subRef, {
          status: 'approved',
          publishedPostId: postId,
          publishedSlug: slug,
          updatedAt: serverTimestamp()
        });
        
        // 4. Audit Log
        const auditRef = doc(collection(db, "audit_logs"));
        transaction.set(auditRef, {
          adminUid: auth.currentUser.uid,
          action: 'APPROVE_SUBMISSION',
          targetUid: currentSubmission.id,
          targetType: 'user_submission',
          timestamp: serverTimestamp(),
          metadata: { postId: postId, title: currentSubmission.title }
        });
      });
      
      showToast({ type: 'success', message: 'تم النشر بنجاح!' });
      viewSubmissionReader.classList.add('hidden');
      viewSubmissions.classList.remove('hidden');
      loadSubmissions();
    } catch(e) {
      console.error(e);
      if (e.message === "ALREADY_APPROVED") {
        showToast({ type: 'warning', message: 'هذه المشاركة تمت الموافقة عليها مسبقاً.' });
        viewSubmissionReader.classList.add('hidden');
        viewSubmissions.classList.remove('hidden');
        loadSubmissions();
      } else {
        showToast({ type: 'error', message: 'حدث خطأ أثناء النشر.' });
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
});

let pendingAction = null; // 'reject' | 'edit'

document.getElementById('btn-sub-needs-edit')?.addEventListener('click', () => {
  if(!currentSubmission) return;
  pendingAction = 'edit';
  document.getElementById('action-reason-container').classList.remove('hidden');
  document.getElementById('reader-action-buttons').classList.add('hidden');
});

document.getElementById('btn-sub-reject')?.addEventListener('click', () => {
  if(!currentSubmission) return;
  pendingAction = 'reject';
  document.getElementById('action-reason-container').classList.remove('hidden');
  document.getElementById('reader-action-buttons').classList.add('hidden');
});

document.getElementById('btn-cancel-action')?.addEventListener('click', () => {
  pendingAction = null;
  document.getElementById('action-reason-text').value = '';
  document.getElementById('action-reason-container').classList.add('hidden');
  document.getElementById('reader-action-buttons').classList.remove('hidden');
});

document.getElementById('btn-confirm-action')?.addEventListener('click', async () => {
  if(!currentSubmission || !pendingAction) return;
  
  const btn = document.getElementById('btn-confirm-action');
  if (btn.disabled) return;
  
  const reason = document.getElementById('action-reason-text').value.trim();
  if(!reason) {
    showToast({ type: 'warning', message: 'يرجى كتابة السبب.' });
    return;
  }
  
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
  
  try {
    const { doc, collection, serverTimestamp, runTransaction } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    
    let status, notifType, notifTitle, notifMsg;
    
    if (pendingAction === 'edit') {
      status = 'needs_edit';
      notifType = 'story_rejected';
      notifTitle = 'قصتك تحتاج إلى تعديل';
      notifMsg = `يرجى إجراء بعض التعديلات على قصتك "${currentSubmission.title}". السبب: ${reason}`;
    } else {
      status = 'rejected';
      notifType = 'story_rejected';
      notifTitle = 'تم رفض قصتك';
      notifMsg = `نأسف، لم نتمكن من قبول قصتك "${currentSubmission.title}". السبب: ${reason}`;
    }
    
    await runTransaction(db, async (transaction) => {
      const subRef = doc(db, "user_submissions", currentSubmission.id);
      const subDoc = await transaction.get(subRef);
      
      if (!subDoc.exists()) {
        throw new Error("NOT_FOUND");
      }
      
      const subData = subDoc.data();
      if (subData.status === status) {
        throw new Error("ALREADY_PROCESSED");
      }
      
      transaction.update(subRef, {
        status: status,
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
      
      if (currentSubmission.uid) {
        const notifRef = doc(collection(db, "notifications"));
        transaction.set(notifRef, {
          userId: currentSubmission.uid,
          type: notifType,
          title: notifTitle,
          message: notifMsg,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      const auditRef = doc(collection(db, "audit_logs"));
      transaction.set(auditRef, {
        adminUid: auth.currentUser.uid,
        action: pendingAction === 'edit' ? 'REQUEST_EDIT_SUBMISSION' : 'REJECT_SUBMISSION',
        targetUid: currentSubmission.id,
        targetType: 'user_submission',
        timestamp: serverTimestamp(),
        metadata: { reason: reason, title: currentSubmission.title }
      });
    });
    
    showToast({ type: 'success', message: 'تم الإجراء بنجاح.' });
    pendingAction = null;
    document.getElementById('action-reason-text').value = '';
    document.getElementById('action-reason-container').classList.add('hidden');
    document.getElementById('reader-action-buttons').classList.remove('hidden');
    
    viewSubmissionReader.classList.add('hidden');
    viewSubmissions.classList.remove('hidden');
    loadSubmissions();
  } catch(e) {
    console.error(e);
    if (e.message === "ALREADY_PROCESSED") {
      showToast({ type: 'warning', message: 'تمت معالجة هذه المشاركة بالفعل.' });
      viewSubmissionReader.classList.add('hidden');
      viewSubmissions.classList.remove('hidden');
      loadSubmissions();
    } else {
      showToast({ type: 'error', message: 'حدث خطأ أثناء تنفيذ الإجراء.' });
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
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

const viewOverview = document.getElementById('view-overview');
const viewUsers = document.getElementById('view-users');
const viewComments = document.getElementById('view-comments');
const viewAudit = document.getElementById('view-audit');
const viewReports = document.getElementById('view-reports');
const menuReports = document.getElementById('menu-reports');

function overrideHideAllViews() {
  hideAllViews();
  if(viewOverview) viewOverview.classList.add('hidden');
  if(viewUsers) viewUsers.classList.add('hidden');
  if(viewComments) viewComments.classList.add('hidden');
  if(viewAudit) viewAudit.classList.add('hidden');
  if(viewReports) viewReports.classList.add('hidden');
  
  [menuOverview, menuUsers, menuComments, menuAudit, menuReports].forEach(m => {
    if(m) {
      m.classList.remove('bg-gray-800', 'text-white');
      m.classList.add('text-gray-300');
    }
  });
}

if(menuOverview) {
  menuOverview.addEventListener('click', () => {
    overrideHideAllViews();
    menuOverview.classList.add('bg-gray-800', 'text-white');
    menuOverview.classList.remove('text-gray-300');
    viewOverview.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'إحصائيات النظام (Overview)';
    loadOverviewData();
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
let lastDoc_Users = null;

async function loadUsersAdmin(isLoadMore = false) {
  const tbody = document.getElementById('users-table-body');
  if (!isLoadMore) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">جاري التحميل...</td></tr>';
    lastDoc_Users = null;
  } else {
    document.getElementById('btn-load-users').textContent = "جاري التحميل...";
    document.getElementById('btn-load-users').disabled = true;
  }

  try {
    const { collection, getDocs, query, orderBy, limit, startAfter } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [orderBy('createdAt', 'desc'), limit(50)];
    if (isLoadMore && lastDoc_Users) {
      constraints.push(startAfter(lastDoc_Users));
    }
    
    const snapshot = await getDocs(query(collection(db, "users"), ...constraints));
    
    if (!isLoadMore) {
      tbody.innerHTML = '';
    }

    if (snapshot.empty && !isLoadMore) {
      tbody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-users text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا يوجد مستخدمين</p></div></td></tr>`;
      document.getElementById('btn-load-users-container')?.classList.add('hidden');
      return;
    }
    
    const renderedIds = new Set();
    snapshot.forEach(docSnap => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      
      const data = docSnap.data();
      if (document.getElementById('users-table-body').querySelector(`tr[data-id="${id}"]`)) return; // Prevent duplicate
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="px-6 py-4">${data.displayName || 'بدون اسم'}</td>
        <td class="px-6 py-4" dir="ltr" style="text-align: right;">${data.email}</td>
        <td class="px-6 py-4">${data.role === 'admin' ? '<span class="text-red-600 font-bold">Admin</span>' : 'User'}</td>
        <td class="px-6 py-4">${data.status === 'banned' ? '<span class="text-red-600">محظور</span>' : '<span class="text-green-600">نشط</span>'}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">
          ${data.status !== 'banned' ? `<button class="text-red-600 hover:underline text-sm" onclick="banUser('${docSnap.id}')">حظر</button>` : `<button class="text-green-600 hover:underline text-sm" onclick="unbanUser('${docSnap.id}')">فك الحظر</button>`}
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (snapshot.docs.length > 0) {
      lastDoc_Users = snapshot.docs[snapshot.docs.length - 1];
    }
    
    if (snapshot.docs.length === 50) {
      document.getElementById('btn-load-users-container')?.classList.remove('hidden');
    } else {
      document.getElementById('btn-load-users-container')?.classList.add('hidden');
    }

  } catch(e) {
    console.error("Error loading users:", e);
    if(!isLoadMore) tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">حدث خطأ</td></tr>';
  } finally {
    if (isLoadMore) {
      document.getElementById('btn-load-users').textContent = "تحميل المزيد";
      document.getElementById('btn-load-users').disabled = false;
    }
  }
}

window.changeUserStatus = async (uid, newStatus, btnElement) => {
  if (btnElement && btnElement.disabled) return;
  if (!(await showConfirmModal({ title: 'تغيير حالة المستخدم', message: `هل أنت متأكد من تغيير حالة المستخدم إلى ${newStatus}؟` }))) return;
  
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  try {
    const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "users", uid), { status: newStatus });
    await addDoc(collection(db, "audit_logs"), {
      action: newStatus === 'banned' ? 'ban_user' : 'unban_user',
      targetType: 'user',
      targetId: uid,
      adminUid: auth.currentUser?.uid || 'unknown',
      timestamp: serverTimestamp()
    });
    loadUsersAdmin();
  } catch(e) { 
    showToast({ type: 'error', message: 'حدث خطأ.' }); 
    console.error(e); 
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = btnElement.dataset.originalText;
    }
  }
};

window.changeUserRole = async (uid, newRole, btnElement) => {
  if (btnElement && btnElement.disabled) return;
  if (!(await showConfirmModal({ title: 'تغيير صلاحية المستخدم', message: `هل أنت متأكد من تغيير صلاحية المستخدم إلى ${newRole}؟` }))) return;
  
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  try {
    const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "users", uid), { role: newRole });
    await addDoc(collection(db, "audit_logs"), {
      action: 'change_role',
      targetType: 'user',
      targetId: uid,
      metadata: { newRole },
      adminUid: auth.currentUser?.uid || 'unknown',
      timestamp: serverTimestamp()
    });
    loadUsersAdmin();
  } catch(e) { 
    showToast({ type: 'error', message: 'حدث خطأ.' }); 
    console.error(e); 
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = btnElement.dataset.originalText;
    }
  }
};

// Comments Admin Logic
let lastDoc_Comments = null;

async function loadCommentsAdmin(isLoadMore = false) {
  const tbody = document.getElementById('comments-table-body');
  if (!isLoadMore) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">جاري التحميل...</td></tr>';
    lastDoc_Comments = null;
  } else {
    document.getElementById('btn-load-comments').textContent = "جاري التحميل...";
    document.getElementById('btn-load-comments').disabled = true;
  }
  
  try {
    const { collection, getDocs, query, orderBy, limit, startAfter } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [orderBy('createdAt', 'desc'), limit(50)];
    if (isLoadMore && lastDoc_Comments) {
      constraints.push(startAfter(lastDoc_Comments));
    }
    
    const snapshot = await getDocs(query(collection(db, "comments"), ...constraints));
    
    if (!isLoadMore) {
      tbody.innerHTML = '';
    }
    
    if (snapshot.empty && !isLoadMore) {
      tbody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-comments text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا توجد تعليقات</p></div></td></tr>`;
      document.getElementById('btn-load-comments-container')?.classList.add('hidden');
      return;
    }
    
    const renderedIds = new Set();
    snapshot.forEach(docSnap => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      
      const data = docSnap.data();
      if (document.getElementById('comments-table-body').querySelector(`tr[data-id="${id}"]`)) return; // Prevent duplicate
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="px-6 py-4">${data.authorName}</td>
        <td class="px-6 py-4">${data.contentId}</td>
        <td class="px-6 py-4 truncate max-w-xs" title="${data.text}">${data.text}</td>
        <td class="px-6 py-4">${data.status === 'visible' ? '<span class="text-green-600">مرئي</span>' : '<span class="text-red-600">مخفي/محذوف</span>'}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">
          <button class="text-red-600 hover:underline text-sm" onclick="moderateComment('${docSnap.id}', 'deleted', this)">حذف</button>
          <button class="text-green-600 hover:underline text-sm" onclick="moderateComment('${docSnap.id}', 'visible', this)">إظهار</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (snapshot.docs.length > 0) {
      lastDoc_Comments = snapshot.docs[snapshot.docs.length - 1];
    }
    
    if (snapshot.docs.length === 50) {
      document.getElementById('btn-load-comments-container')?.classList.remove('hidden');
    } else {
      document.getElementById('btn-load-comments-container')?.classList.add('hidden');
    }

  } catch(e) {
    console.error("Error loading comments:", e);
    if (!isLoadMore) tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">حدث خطأ</td></tr>';
  } finally {
    if (isLoadMore) {
      document.getElementById('btn-load-comments').textContent = "تحميل المزيد";
      document.getElementById('btn-load-comments').disabled = false;
    }
  }
}

window.moderateComment = async (commentId, newStatus, btnElement) => {
  if (btnElement && btnElement.disabled) return;
  if (!(await showConfirmModal({ title: 'تغيير حالة التعليق', message: 'تأكيد تغيير حالة التعليق؟' }))) return;
  
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  try {
    const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "comments", commentId), { status: newStatus });
    await addDoc(collection(db, "audit_logs"), {
      action: newStatus === 'deleted' ? 'delete_comment' : 'approve_comment',
      targetType: 'comment',
      targetId: commentId,
      adminUid: auth.currentUser?.uid || 'unknown',
      timestamp: serverTimestamp()
    });
    loadCommentsAdmin();
  } catch(e) { 
    showToast({ type: 'error', message: 'حدث خطأ.' }); 
    console.error(e); 
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = btnElement.dataset.originalText;
    }
  }
};

// Audit Logs Logic
let lastDoc_Audit = null;

async function loadAuditAdmin(isLoadMore = false) {
  const tbody = document.getElementById('audit-table-body');
  if (!isLoadMore) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">جاري التحميل...</td></tr>';
    lastDoc_Audit = null;
  } else {
    document.getElementById('btn-load-audit').textContent = "جاري التحميل...";
    document.getElementById('btn-load-audit').disabled = true;
  }
  
  try {
    const { collection, getDocs, query, orderBy, limit, startAfter } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [orderBy('timestamp', 'desc'), limit(50)];
    if (isLoadMore && lastDoc_Audit) {
      constraints.push(startAfter(lastDoc_Audit));
    }
    
    const snapshot = await getDocs(query(collection(db, "audit_logs"), ...constraints));
    
    if (!isLoadMore) {
      tbody.innerHTML = '';
    }
    
    if (snapshot.empty && !isLoadMore) {
      tbody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-clipboard-list text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا توجد سجلات نشاط</p></div></td></tr>`;
      document.getElementById('btn-load-audit-container')?.classList.add('hidden');
      return;
    }
    
    const renderedIds = new Set();
    snapshot.forEach(docSnap => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      
      const data = docSnap.data();
      if (document.getElementById('audit-table-body').querySelector(`tr[data-id="${id}"]`)) return; // Prevent duplicate
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50 text-sm';
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="px-6 py-4">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString('ar-EG') : '-'}</td>
        <td class="px-6 py-4" dir="ltr" style="text-align: right; font-size: 0.75rem;">${data.adminUid}</td>
        <td class="px-6 py-4 font-bold text-gray-700">${data.action}</td>
        <td class="px-6 py-4">${data.targetType}: <span dir="ltr" class="text-xs text-gray-500">${data.targetUid || data.targetId || '-'}</span></td>
        <td class="px-6 py-4 text-gray-500">${data.metadata ? JSON.stringify(data.metadata) : '-'}</td>
      `;
      tbody.appendChild(tr);
    });

    if (snapshot.docs.length > 0) {
      lastDoc_Audit = snapshot.docs[snapshot.docs.length - 1];
    }
    
    if (snapshot.docs.length === 50) {
      document.getElementById('btn-load-audit-container')?.classList.remove('hidden');
    } else {
      document.getElementById('btn-load-audit-container')?.classList.add('hidden');
    }

  } catch(e) {
    console.error("Error loading audit:", e);
    if (!isLoadMore) tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">حدث خطأ</td></tr>';
  } finally {
    if (isLoadMore) {
      document.getElementById('btn-load-audit').textContent = "تحميل المزيد";
      document.getElementById('btn-load-audit').disabled = false;
    }
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
      tbody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-bullhorn text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا توجد إعلانات</p></div></td></tr>`;
      return;
    }
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (document.getElementById('ads-table-body').querySelector(`tr[data-id="${id}"]`)) return; // Prevent duplicate
      
      const id = docSnap.id;
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.dataset.id = id;
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
      if (await showConfirmModal({ title: 'تأكيد الحذف', message: 'هل أنت متأكد من الحذف؟' })) {
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
    showToast({ type: 'error', message: 'خطأ في الحفظ' });
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
    const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    // Add to notifications collection for all users
    await addDoc(collection(db, "notifications"), {
      userId: 'all',
      type: 'admin_announcement',
      title: 'إعلان إداري جديد',
      message: text,
      link,
      image,
      readBy: [],
      createdAt: serverTimestamp()
    });
    
    document.getElementById('notif-form').reset();
    const st = document.getElementById('notif-status');
    st.textContent = 'تم إرسال الإشعار لجميع المستخدمين!';
    st.classList.remove('hidden');
    setTimeout(() => st.classList.add('hidden'), 5000);
  } catch(err) {
    showToast({ type: 'error', message: 'خطأ في إرسال الإشعار' });
  } finally {
    btn.disabled = false;
    btn.textContent = 'إرسال الإشعار الآن';
  }
});


// --- Reports Logic ---
if(menuReports) {
  menuReports.addEventListener('click', () => {
    overrideHideAllViews();
    menuReports.classList.add('bg-gray-800', 'text-white');
    menuReports.classList.remove('text-gray-300');
    if(viewReports) viewReports.classList.remove('hidden');
    document.querySelector('header h2').textContent = 'إدارة التبليغات والمراجعة';
    loadReports();
  });
}

document.getElementById('btn-load-reports').addEventListener('click', loadReports);

let lastDoc_Reports = null;

async function loadReports(isLoadMore = false) {
  const tbody = document.getElementById('reports-table-body');
  const loading = document.getElementById('loading-indicator-reports');
  const statusFilter = document.getElementById('report-filter-status').value;
  
  if (!isLoadMore) {
    tbody.innerHTML = '';
    loading.classList.remove('hidden');
    lastDoc_Reports = null;
  } else {
    document.getElementById('btn-load-reports').textContent = "جاري التحميل...";
    document.getElementById('btn-load-reports').disabled = true;
  }
  
  try {
    const { collection, getDocs, query, where, orderBy, limit, startAfter } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [where("status", "==", statusFilter), orderBy("createdAt", "desc"), limit(50)];
    if (isLoadMore && lastDoc_Reports) {
      constraints.push(startAfter(lastDoc_Reports));
    }
    
    const q = query(collection(db, "reports"), ...constraints);
    const snap = await getDocs(q);
    
    if (!isLoadMore) {
      loading.classList.add('hidden');
    }
    
    if (snap.empty && !isLoadMore) {
      tbody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-flag text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا توجد إبلاغات بهذه الحالة</p></div></td></tr>`;
      document.getElementById('btn-load-reports-container')?.classList.add('hidden');
      return;
    }
    
    const renderedIds = new Set();
    snap.forEach(docSnap => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      
      const data = docSnap.data();
      if (document.getElementById('reports-table-body').querySelector(`tr[data-id="${id}"]`)) return; // Prevent duplicate
      
      let actionHtml = '';
      if (data.status === 'pending') {
        actionHtml = `
          <button class="text-blue-600 hover:underline text-sm" onclick="updateReportStatus('${id}', 'reviewing', this)">بدء المراجعة</button>
          <button class="text-red-600 hover:underline text-sm" onclick="updateReportStatus('${id}', 'rejected', this)">رفض كاذب</button>
        `;
      } else if (data.status === 'reviewing') {
         actionHtml = `
          <button class="text-green-600 hover:underline text-sm font-bold" onclick="resolveReport('${id}', '${data.targetType}', '${data.targetId}', this)">اتخاذ إجراء (حذف)</button>
          <button class="text-red-600 hover:underline text-sm" onclick="updateReportStatus('${id}', 'rejected', this)">رفض كاذب</button>
        `;
      } else {
         actionHtml = '<span class="text-gray-400 text-sm">تمت المعالجة</span>';
      }

      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="px-6 py-4 text-sm">${data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleString('ar-EG') : '-'}</td>
        <td class="px-6 py-4">${data.targetType}</td>
        <td class="px-6 py-4" dir="ltr" style="text-align: right; font-size: 0.8rem;">${data.reporterId}</td>
        <td class="px-6 py-4">${data.reason}</td>
        <td class="px-6 py-4">${data.status}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">${actionHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    if (snap.docs.length > 0) {
      lastDoc_Reports = snap.docs[snap.docs.length - 1];
    }
    
    if (snap.docs.length === 50) {
      document.getElementById('btn-load-reports-container')?.classList.remove('hidden');
    } else {
      document.getElementById('btn-load-reports-container')?.classList.add('hidden');
    }
  } catch(e) {
    console.error("Error loading reports", e);
    if (!isLoadMore) loading.innerHTML = '<span class="text-red-500">حدث خطأ</span>';
  } finally {
    if (isLoadMore) {
      document.getElementById('btn-load-reports').textContent = "تحميل المزيد";
      document.getElementById('btn-load-reports').disabled = false;
    }
  }
}

window.updateReportStatus = async (reportId, newStatus, btnElement) => {
  if (btnElement && btnElement.disabled) return;
  if (!(await showConfirmModal({ title: 'تغيير حالة الإبلاغ', message: `هل أنت متأكد من تغيير الحالة إلى ${newStatus}؟` }))) return;
  
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  try {
    const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "reports", reportId), { status: newStatus, updatedAt: serverTimestamp() });
    
    await addDoc(collection(db, "audit_logs"), {
      action: 'update_report_status',
      targetType: 'report',
      targetId: reportId,
      metadata: { newStatus },
      adminUid: 'admin_ui',
      timestamp: serverTimestamp()
    });
    loadReports();
  } catch(e) {
    showToast({ type: 'error', message: 'حدث خطأ.' });
    console.error(e);
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = btnElement.dataset.originalText;
    }
  }
};

window.resolveReport = async (reportId, targetType, targetId, btnElement) => {
  if (btnElement && btnElement.disabled) return;
  const action = await showPromptModal({ title: 'إجراءات الإدارة', message: 'الرجاء اختيار الإجراء:\n- للتعليق: اكتب "hide" أو "remove"\n- للمحتوى: اكتب "suspend"\n- للمستخدم: اكتب "review"', placeholder: 'اكتب الإجراء هنا...' });
  if (!action) return;
  
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  
  try {
    const { doc, updateDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const { auth } = await import("../../js/firebase-init.js");
    
    let reasonText = '';
    if (targetType === 'comment') {
      if (action === 'hide') {
        await updateDoc(doc(db, "comments", targetId), { status: 'hidden' });
        reasonText = `Hidden due to report ${reportId}`;
      } else if (action === 'remove') {
        await updateDoc(doc(db, "comments", targetId), { status: 'deleted' });
        reasonText = `Removed due to report ${reportId}`;
      }
    } else if (targetType === 'content') {
      if (action === 'suspend') {
        await updateDoc(doc(db, "posts", targetId), { status: 'suspended' });
        reasonText = `Suspended due to report ${reportId}`;
      }
    } else if (targetType === 'user') {
      if (action === 'review') {
        await updateDoc(doc(db, "users", targetId), { status: 'under_review' });
        reasonText = `Under review due to report ${reportId}`;
      }
    }
    
    await updateDoc(doc(db, "reports", reportId), { status: 'resolved', updatedAt: serverTimestamp() });
    
    await addDoc(collection(db, "audit_logs"), {
      action: 'resolve_report',
      targetType: targetType,
      targetId: targetId,
      metadata: { reportId, appliedAction: action },
      adminUid: auth.currentUser?.uid || 'unknown',
      timestamp: serverTimestamp()
    });
    
    showToast({ type: 'success', message: 'تم اتخاذ الإجراء وحل الإبلاغ.' });
    loadReports();
  } catch(e) {
    showToast({ type: 'error', message: 'حدث خطأ في تنفيذ الإجراء.' });
    console.error(e);
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = btnElement.dataset.originalText;
    }
  }
};

// --- Dashboard Analytics ---
const periodSelect = document.getElementById('overview-period');
if (periodSelect) {
  periodSelect.addEventListener('change', loadOverviewData);
}

async function loadOverviewData() {
  const period = document.getElementById('overview-period').value;
  let startDate = null;
  
  if (period !== 'all') {
    startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0,0,0,0);
    } else if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    }
  }

  const getQ = (colName, statusField, statusVal) => {
    let constraints = [];
    if (statusField && statusVal) {
      constraints.push(where(statusField, "==", statusVal));
    }
    if (startDate) {
      constraints.push(where("createdAt", ">=", startDate));
      
      // Use existing indexed directions based on firestore.indexes.json
      let dir = 'desc';
      if (colName === 'user_submissions') {
        dir = 'asc';
      }
      constraints.push(orderBy("createdAt", dir));
    }
    return query(collection(db, colName), ...constraints);
  };

  try {
    const uiMetrics = ['users', 'posts', 'submissions', 'comments', 'reports', 'views', 'likes'];
    uiMetrics.forEach(m => document.getElementById('stat-' + m).innerHTML = '<i class="fas fa-spinner fa-spin text-sm text-gray-400"></i>');
    document.getElementById('chart-types-loading').classList.remove('hidden');
    document.getElementById('chart-types-container').classList.add('hidden');

    // Users
    try {
      const usersSnap = await getCountFromServer(getQ('users'));
      document.getElementById('stat-users').textContent = usersSnap.data().count;
    } catch(e) { document.getElementById('stat-users').textContent = '-'; console.log("Users count error:", e.message); }

    // Submissions (Use 'user_submissions' instead of 'submissions' and correct status 'submitted')
    try {
      const subSnap = await getCountFromServer(getQ('user_submissions', 'status', 'submitted'));
      document.getElementById('stat-submissions').textContent = subSnap.data().count;
    } catch(e) { document.getElementById('stat-submissions').textContent = '-'; console.log("Submissions count error:", e.message); }

    // Comments
    try {
      const commSnap = await getCountFromServer(getQ('comments'));
      document.getElementById('stat-comments').textContent = commSnap.data().count;
    } catch(e) { document.getElementById('stat-comments').textContent = '-'; console.log("Comments count error:", e.message); }

    // Reports
    try {
      const repSnap = await getCountFromServer(getQ('reports'));
      document.getElementById('stat-reports').textContent = repSnap.data().count;
    } catch(e) { document.getElementById('stat-reports').textContent = '-'; console.log("Reports count error:", e.message); }

    // Posts, Views, Likes & Distribution
    try {
      const qPosts = getQ('posts', 'status', 'published');
      
      let totalPosts = 0;
      let totalViews = 0;
      let totalLikes = 0;
      
      const totalPostsSnap = await getCountFromServer(qPosts);
      totalPosts = totalPostsSnap.data().count;

      try {
        const aggSnap = await getAggregateFromServer(qPosts, {
          views: sum('views'),
          likes: sum('likesCount')
        });
        totalViews = aggSnap.data().views || 0;
        totalLikes = aggSnap.data().likes || 0;
      } catch (aggErr) {
        console.warn("Aggregation requires index, falling back to client-side.", aggErr.message);
        const docsSnap = await getDocs(qPosts);
        docsSnap.forEach(d => {
          totalViews += d.data().views || 0;
          totalLikes += d.data().likesCount || 0;
        });
      }

      let typeCounts = { story: 0, news: 0, video: 0 };
      
      const getQType = (typeVal) => {
        let constraints = [where("status", "==", "published"), where("type", "==", typeVal)];
        if (startDate) {
          constraints.push(where("createdAt", ">=", startDate));
          constraints.push(orderBy("createdAt", "desc"));
        }
        return query(collection(db, "posts"), ...constraints);
      };

      const [storySnap, newsSnap, videoSnap] = await Promise.all([
        getCountFromServer(getQType('story')),
        getCountFromServer(getQType('news')),
        getCountFromServer(getQType('video'))
      ]);

      typeCounts.story = storySnap.data().count;
      typeCounts.news = newsSnap.data().count;
      typeCounts.video = videoSnap.data().count;

      document.getElementById('stat-posts').textContent = totalPosts;
      document.getElementById('stat-views').textContent = totalViews;
      document.getElementById('stat-likes').textContent = totalLikes;
      
      // Update Chart
      document.getElementById('count-story').textContent = typeCounts.story;
      document.getElementById('count-news').textContent = typeCounts.news;
      document.getElementById('count-video').textContent = typeCounts.video;
      
      let pStory = totalPosts === 0 ? 0 : (typeCounts.story / totalPosts) * 100;
      let pNews = totalPosts === 0 ? 0 : (typeCounts.news / totalPosts) * 100;
      let pVideo = totalPosts === 0 ? 0 : (typeCounts.video / totalPosts) * 100;
      
      document.getElementById('bar-story').style.width = pStory + '%';
      document.getElementById('bar-news').style.width = pNews + '%';
      document.getElementById('bar-video').style.width = pVideo + '%';
      
      document.getElementById('chart-types-loading').classList.add('hidden');
      document.getElementById('chart-types-container').classList.remove('hidden');

    } catch(e) { 
      document.getElementById('stat-posts').textContent = '-'; 
      document.getElementById('stat-views').textContent = '-'; 
      document.getElementById('stat-likes').textContent = '-'; 
      console.log("Posts fetch error:", e.message);
    }

  } catch (error) {
    console.error("Overview error", error);
  } finally {
    document.getElementById('chart-types-loading').classList.add('hidden');
    // Ensure container is shown even if empty so it doesn't just spin forever
    document.getElementById('chart-types-container').classList.remove('hidden');
  }
}

// Safe string escaper for HTML
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
