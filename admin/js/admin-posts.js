import { db } from '../../js/firebase-init.js';
import { showToast, showConfirmModal } from '../../js/ui-utils.js';
import { viewList, viewEditor } from './admin-core.js';


const loadingIndicator = document.getElementById('loading-indicator');
const postForm = document.getElementById('post-form');

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

if (fContentHtml) {
  fContentHtml.addEventListener('input', () => {
    const count = fContentHtml.value.length;
    charCountContent.textContent = `${count} حرف`;
  });
}

if (fTagsInput) {
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
}

function renderTags() {
  if(!tagsContainer) return;
  tagsContainer.innerHTML = '';
  currentTags.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm flex items-center gap-1';
    el.innerHTML = `
      ${tag}
      <button type="button" class="text-red-500 hover:text-red-700" onclick="window.removeTag('${tag}')">&times;</button>
    `;
    tagsContainer.appendChild(el);
  });
}

window.removeTag = function(tag) {
  currentTags = currentTags.filter(t => t !== tag);
  renderTags();
};

if (fType) {
  fType.addEventListener('change', () => {
    const type = fType.value;
    if (type === 'video') {
      document.getElementById('field-embed-code').classList.remove('hidden');
      document.getElementById('field-read-time').classList.add('hidden');
    } else if (type === 'news') {
      document.getElementById('field-embed-code').classList.add('hidden');
      document.getElementById('field-read-time').classList.add('hidden');
    } else {
      document.getElementById('field-embed-code').classList.add('hidden');
      document.getElementById('field-read-time').classList.remove('hidden');
    }
  });
}



let currentPostsTab = 'story';
let lastDocs = {
  story: null,
  news: null,
  video: null
};
let isTabLoaded = {
  story: false,
  news: false,
  video: false
};
let currentPostsLoadToken = 0;

export async function loadPosts(isLoadMore = false, forceRefresh = false) {
  const token = ++currentPostsLoadToken;
  const activeTbody = document.getElementById('posts-table-' + currentPostsTab);
  
  if (!isLoadMore) {
    if (!forceRefresh && isTabLoaded[currentPostsTab]) {
      // Already loaded, just show it
      updateLoadMoreButtonVisibility(); applyPostsClientFilter();
      return;
    }
    loadingIndicator.classList.remove('hidden');
    activeTbody.innerHTML = '';
    lastDocs[currentPostsTab] = null;
    isTabLoaded[currentPostsTab] = false;
    document.getElementById('btn-load-posts-container')?.classList.add('hidden');
  } else {
    document.getElementById('btn-load-posts').textContent = "جاري التحميل...";
    document.getElementById('btn-load-posts').disabled = true;
  }
  
  try {
    const { collection, getDocs, query, orderBy, limit, startAfter, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [
      where("type", "==", currentPostsTab),
      orderBy("createdAt", "desc"),
      limit(50)
    ];
    if (isLoadMore && lastDocs[currentPostsTab]) {
      constraints.push(startAfter(lastDocs[currentPostsTab]));
    }

    let snap;
    try {
      snap = await getDocs(query(collection(db, "posts"), ...constraints));
    } catch(err) {
      if (err.message.includes('index')) {
        console.warn("Missing index, falling back to basic query for posts", err);
        constraints = [where("type", "==", currentPostsTab), limit(50)];
        if (isLoadMore && lastDocs[currentPostsTab]) constraints.push(startAfter(lastDocs[currentPostsTab]));
        snap = await getDocs(query(collection(db, "posts"), ...constraints));
      } else {
        throw err;
      }
    }

    if (token !== currentPostsLoadToken) return;

    if (!isLoadMore) {
      activeTbody.innerHTML = '';
      loadingIndicator.classList.add('hidden');
    }
    
    if (snap.empty && !isLoadMore) {
      activeTbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-gray-500">لا يوجد محتوى في هذا القسم.</td></tr>';
      document.getElementById('btn-load-posts-container')?.classList.add('hidden');
      isTabLoaded[currentPostsTab] = true;
      return;
    }

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      if (activeTbody.querySelector(`tr[data-id="${id}"]`)) return;

      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.dataset.id = id;
      tr.dataset.title = (data.title || '').toLowerCase();
      
      const typeMap = { 'story': 'قصة', 'news': 'خبر', 'video': 'فيديو' };
      const statusMap = { 'published': '<span class="text-green-600 font-bold">منشور</span>', 'draft': '<span class="text-orange-500 font-bold">مسودة</span>' };
      const t = typeMap[data.type] || data.type;
      const s = statusMap[data.status] || data.status;
      
      let dateStr = '-';
      if (data.createdAt) {
        dateStr = new Date(data.createdAt.toMillis()).toLocaleDateString('ar-EG');
      }
      
      const featuredIcon = data.isFeatured ? '<i class="fas fa-star text-yellow-400 ml-1" title="مميز"></i>' : '';
      
      tr.innerHTML = `
        <td class="px-6 py-4 font-semibold">${featuredIcon} ${data.title}</td>
        <td class="px-6 py-4">${t}</td>
        <td class="px-6 py-4">${s}</td>
        <td class="px-6 py-4 text-gray-500">${dateStr}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">
          <button class="text-blue-600 hover:underline btn-edit font-semibold" data-id="${id}">تعديل</button>
          <button class="text-red-600 hover:underline btn-delete font-semibold" data-id="${id}">حذف</button>
        </td>
      `;
      activeTbody.appendChild(tr);
    });

    if (snap.docs.length > 0) {
      lastDocs[currentPostsTab] = snap.docs[snap.docs.length - 1];
    }
    
    isTabLoaded[currentPostsTab] = true;
    updateLoadMoreButtonVisibility(snap.docs.length);

    document.querySelectorAll('#posts-table-' + currentPostsTab + ' .btn-edit').forEach(btn => btn.addEventListener('click', (e) => editPost(e.target.dataset.id)));
    document.querySelectorAll('#posts-table-' + currentPostsTab + ' .btn-delete').forEach(btn => btn.addEventListener('click', (e) => deletePost(e.target.dataset.id, e.target)));
    
    applyPostsClientFilter();
    
  } catch (error) {
    if (token !== currentPostsLoadToken) return;
    console.error("Error loading posts:", error);
    loadingIndicator.innerHTML = '<span class="text-red-500 font-bold p-4 block">حدث خطأ أثناء جلب البيانات.</span>';
  } finally {
    if (isLoadMore) {
      document.getElementById('btn-load-posts').textContent = "تحميل المزيد";
      document.getElementById('btn-load-posts').disabled = false;
    }
  }
}

function updateLoadMoreButtonVisibility(docsLength = null) {
  // If we just loaded and docsLength is passed
  if (docsLength === 50) {
    document.getElementById('btn-load-posts-container')?.classList.remove('hidden');
    return;
  } else if (docsLength !== null) {
    document.getElementById('btn-load-posts-container')?.classList.add('hidden');
    return;
  }
  
  // If we are just switching tabs, we have to guess based on lastDocs (if lastDocs is not null, assume there might be more, but actually we should store hasMore per tab). 
  // For simplicity, if lastDocs is present we'll show it, but it might lead to empty load if exactly 50 were loaded. 
  if (lastDocs[currentPostsTab]) {
    document.getElementById('btn-load-posts-container')?.classList.remove('hidden');
  } else {
    document.getElementById('btn-load-posts-container')?.classList.add('hidden');
  }
}

function applyPostsClientFilter() {
  const filterTitle = (document.getElementById('search-posts')?.value || '').toLowerCase();
  const rows = document.querySelectorAll('#posts-table-' + currentPostsTab + ' tr');
  rows.forEach(row => {
    if (row.children.length < 2) return;
    const pTitle = row.dataset.title || '';
    if (filterTitle && !pTitle.includes(filterTitle)) {
      row.style.display = 'none';
    } else {
      row.style.display = '';
    }
  });
}

document.querySelectorAll('.post-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.post-tab-btn').forEach(b => {
      b.classList.remove('active', 'text-red-600', 'border-b-2', 'border-red-600');
      b.classList.add('text-gray-500', 'hover:text-gray-800');
    });
    e.target.classList.remove('text-gray-500', 'hover:text-gray-800');
    e.target.classList.add('active', 'text-red-600', 'border-b-2', 'border-red-600');
    
    // Hide all tbodys
    document.getElementById('posts-table-story').classList.add('hidden');
    document.getElementById('posts-table-news').classList.add('hidden');
    document.getElementById('posts-table-video').classList.add('hidden');
    
    currentPostsTab = e.target.dataset.type;
    document.getElementById('posts-table-' + currentPostsTab).classList.remove('hidden');
    
    // Clear search when switching tabs to avoid confusion
    const searchInput = document.getElementById('search-posts');
    if (searchInput) searchInput.value = '';
    
    loadPosts(false);
  });
});

document.getElementById('search-posts')?.addEventListener('input', applyPostsClientFilter);
document.getElementById('btn-refresh-posts')?.addEventListener('click', () => loadPosts(false, true));


export function showEditor(isNew = true) {
  if(viewList) viewList.classList.add('hidden');
  if(viewEditor) viewEditor.classList.remove('hidden');
  document.getElementById('editor-title').textContent = isNew ? 'إضافة محتوى' : 'تعديل المحتوى';
  if (isNew) {
    postForm.reset();
    fId.value = '';
    currentTags = [];
    fUpdatedAt.textContent = '-';
    renderTags();
    fType.dispatchEvent(new Event('change'));
  }
}

export function hideEditor() {
  if(viewEditor) viewEditor.classList.add('hidden');
  if(viewList) viewList.classList.remove('hidden');
}

export async function editPost(id) {
  showEditor(false);
  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
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
        const d = data.publishAt.toDate();
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
      
      charCountContent.textContent = `${fContentHtml.value.length} حرف`;
      fType.dispatchEvent(new Event('change'));
    }
  } catch (e) {
    showToast({ type: 'error', message: 'خطأ في جلب البيانات' });
    console.error(e);
  }
}

export async function deletePost(id, btnElement) {
  if (btnElement && btnElement.disabled) return;
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  if (await showConfirmModal({ title: 'تأكيد الحذف', message: 'هل أنت متأكد من حذف هذا المحتوى نهائياً؟' })) {
    try {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await deleteDoc(doc(db, "posts", id));
      
      const { logAdminAction } = await import('./admin-core.js');
      await logAdminAction('delete_post', 'post', id, 'قام بحذف محتوى (مقال/قصة)', 'محتوى ' + id);
      isTabLoaded[currentPostsTab] = false;
      loadPosts(false, true);
    }


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

if (postForm) {
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = fId.value || 'doc_' + Date.now();
    
    let normalizedSlug = fSlug.value.trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-') 
      .replace(/[^\w\u0600-\u06FF-]/g, '') 
      .replace(/-+/g, '-') 
      .replace(/^-+|-+$/g, ''); 

    fSlug.value = normalizedSlug;

    if (!normalizedSlug) {
      showToast({ type: 'error', message: 'الرابط (Slug) لا يمكن أن يكون فارغاً.' });
      return;
    }
    
    const btnSave = document.getElementById('btn-save');
    btnSave.textContent = "جاري التحقق...";
    btnSave.disabled = true;

    try {
      const { collection, getDocs, query, where, doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      
      const q = query(collection(db, "posts"), where("slug", "==", normalizedSlug));
      const snap = await getDocs(q);
      let isDuplicate = false;
      snap.forEach(docSnap => {
        if (docSnap.id !== id) {
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

      const sanitizedHtml = window.DOMPurify ? DOMPurify.sanitize(fContentHtml.value, { USE_PROFILES: { html: true } }) : fContentHtml.value;
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

      if (fType.value === 'video') {
        postData.data.embedCode = sanitizedEmbed;
      } else if (fType.value === 'story') {
        postData.data.readTimeMinutes = parseInt(fReadTime.value) || 0;
      }
      
      await setDoc(doc(db, "posts", id), postData, { merge: true });
      
      hideEditor();
      
      
      currentPostsTab = fType.value;
      isTabLoaded[currentPostsTab] = false; // force refresh
      const tabBtn = document.querySelector(`.post-tab-btn[data-type="${fType.value}"]`);
      if (tabBtn) {
        tabBtn.click();
      } else {
        loadPosts(false, true);
      }


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
}

document.getElementById('btn-load-posts')?.addEventListener('click', () => loadPosts(true));
document.getElementById('btn-new-post')?.addEventListener('click', () => showEditor(true));
document.getElementById('btn-back')?.addEventListener('click', hideEditor);
document.getElementById('btn-cancel')?.addEventListener('click', hideEditor);
