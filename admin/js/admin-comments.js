import { db, auth } from '../../js/firebase-init.js';
import { showToast, showConfirmModal } from '../../js/ui-utils.js';

let lastDoc_Comments = null;
const postDataCache = {};

export async function loadCommentsAdmin(isLoadMore = false) {
  const tbody = document.getElementById('comments-table-body');
  if (!isLoadMore) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">جاري التحميل...</td></tr>';
    lastDoc_Comments = null;
  } else {
    document.getElementById('btn-load-comments').textContent = "جاري التحميل...";
    document.getElementById('btn-load-comments').disabled = true;
  }

  try {
    const { collection, getDocs, query, orderBy, limit, startAfter, documentId, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    
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
    
    // Extract unique contentIds
    const contentIdsToFetch = new Set();
    const commentDocs = [];
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      data._id = docSnap.id;
      commentDocs.push(data);
      if (data.contentId && postDataCache[data.contentId] === undefined) {
        contentIdsToFetch.add(data.contentId);
      }
    });

    // Fetch missing posts in batches of 10 (Firestore 'in' constraint limit)
    const idsArray = Array.from(contentIdsToFetch);
    const fetchPromises = [];
    
    for (let i = 0; i < idsArray.length; i += 10) {
      const chunk = idsArray.slice(i, i + 10);
      const q = query(collection(db, 'posts'), where(documentId(), 'in', chunk));
      fetchPromises.push(getDocs(q).then(postSnap => {
        postSnap.forEach(p => {
          postDataCache[p.id] = p.data();
        });
      }));
    }
    
    await Promise.all(fetchPromises);
    
    // Mark unfetched IDs as null (meaning deleted/not found)
    idsArray.forEach(id => {
      if (postDataCache[id] === undefined) {
        postDataCache[id] = null;
      }
    });

    const renderedIds = new Set();
    
    commentDocs.forEach(data => {
      const id = data._id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      
      const postData = postDataCache[data.contentId];
      
      let pType = 'unknown';
      let pTitle = '';
      let pSlug = data.contentId;
      
      if (postData) {
        pType = postData.type || 'unknown';
        pTitle = postData.title || 'بدون عنوان';
        pSlug = postData.slug || data.contentId;
      }

      if (document.getElementById('comments-table-body').querySelector(`tr[data-id="${id}"]`)) return;
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.dataset.id = id;
      tr.dataset.type = pType;
      tr.dataset.title = pTitle.toLowerCase();
      
      const dateText = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('ar-EG') : '-';
      
      const typeMap = {
        'story': 'قصة',
        'news': 'خبر',
        'video': 'فيديو',
        'unknown': 'غير معروف'
      };
      const displayType = typeMap[pType] || pType;
      
      let linkHtml = '';
      if (postData) {
        linkHtml = `<a href="/post.html?id=${pSlug}" target="_blank" class="text-blue-600 hover:underline font-semibold" title="رؤية المقال">على: ${pTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")} <span class="text-xs text-gray-500">(${displayType})</span></a>`;
      } else {
        linkHtml = `<span class="text-red-500 font-semibold"><i class="fas fa-exclamation-triangle ml-1"></i>المحتوى الأصلي محذوف</span>`;
      }
      
      tr.innerHTML = `
        <td class="px-4 py-4 text-gray-500 text-sm whitespace-nowrap">${dateText}</td>
        <td class="px-4 py-4 font-medium text-gray-800">${data.authorName || 'مجهول'}</td>
        <td class="px-4 py-4 text-sm">${linkHtml}</td>
        <td class="px-4 py-4 text-gray-700 max-w-sm" title="${(data.text || '').replace(/"/g, '&quot;')}"><div class="line-clamp-2">${data.text || ''}</div></td>
        <td class="px-4 py-4">${data.status === 'visible' ? '<span class="bg-green-50 text-green-600 text-xs px-2 py-1 rounded border border-green-200">مرئي</span>' : '<span class="bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-200">مخفي</span>'}</td>
        <td class="px-4 py-4 space-x-2 space-x-reverse whitespace-nowrap">
          ${data.status === 'visible' 
            ? `<button class="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs font-semibold transition" onclick="window.moderateComment('${id}', 'deleted', this)">إخفاء</button>`
            : `<button class="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-xs font-semibold transition" onclick="window.moderateComment('${id}', 'visible', this)">إظهار</button>`}
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
    
    applyCommentFilters();
    
  } catch(e) {
    console.error("Error loading comments:", e);
    if (!isLoadMore) tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-red-500">حدث خطأ</td></tr>';
  } finally {
    if (isLoadMore) {
      document.getElementById('btn-load-comments').textContent = "تحميل المزيد";
      document.getElementById('btn-load-comments').disabled = false;
    }
  }
}

function applyCommentFilters() {
  const filterType = document.getElementById('filter-comment-type')?.value || 'all';
  const filterTitle = (document.getElementById('search-comment-post')?.value || '').toLowerCase();
  
  const rows = document.querySelectorAll('#comments-table-body tr');
  rows.forEach(row => {
    if (row.children.length < 2) return;
    
    const pType = row.dataset.type || 'unknown';
    const pTitle = row.dataset.title || '';
    
    let match = true;
    if (filterType !== 'all' && pType !== filterType) {
      match = false;
    }
    if (filterTitle && !pTitle.includes(filterTitle)) {
      match = false;
    }
    
    row.style.display = match ? '' : 'none';
  });
}

document.getElementById('search-comment-post')?.addEventListener('input', applyCommentFilters);
document.getElementById('filter-comment-type')?.addEventListener('change', applyCommentFilters);
document.getElementById('btn-refresh-comments')?.addEventListener('click', () => loadCommentsAdmin(false));

window.moderateComment = async (commentId, newStatus, btnElement) => {
  if (btnElement && btnElement.disabled) return;
  if (!(await showConfirmModal({ title: 'تغيير حالة التعليق', message: 'تأكيد تغيير حالة التعليق؟' }))) return;
  
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  try {
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "comments", commentId), { status: newStatus });
    
    const { logAdminAction } = await import('./admin-core.js');
    const actionLabel = newStatus === 'deleted' ? 'قام بإخفاء تعليق' : 'قام بإظهار تعليق';
    await logAdminAction(
      newStatus === 'deleted' ? 'delete_comment' : 'approve_comment',
      'comment',
      commentId,
      actionLabel,
      'تعليق'
    );
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

document.getElementById('btn-load-comments')?.addEventListener('click', () => loadCommentsAdmin(true));
