import { db, auth } from '../../js/firebase-init.js';
import { showToast, showConfirmModal } from '../../js/ui-utils.js';
import { viewSubmissions, viewSubmissionReader } from './admin-core.js';


const loadingIndicatorSub = document.getElementById('loading-indicator-sub');


let currentSubmission = null;
let currentSubLoadToken = 0;

let currentSubTab = 'submitted';
let lastDocsSub = {
  submitted: null,
  needs_edit: null,
  rejected: null,
  approved: null
};
let isSubTabLoaded = {
  submitted: false,
  needs_edit: false,
  rejected: false,
  approved: false
};

function timeAgo(dateInput) {
  if (!dateInput) return '-';
  const diffInMs = new Date() - dateInput;
  const diffInMins = Math.floor(diffInMs / 60000);
  if (diffInMins < 1) return 'الآن';
  if (diffInMins < 60) return `منذ ${diffInMins} دقيقة`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `منذ ${diffInDays} يوم`;
}

export async function loadSubmissions(isLoadMore = false, forceRefresh = false) {
  const token = ++currentSubLoadToken;
  const activeTbody = document.getElementById('submissions-table-' + currentSubTab);
  
  if (!isLoadMore) {
    if (!forceRefresh && isSubTabLoaded[currentSubTab]) {
      updateSubLoadMoreVisibility();
      applySubClientFilter();
      return;
    }
    loadingIndicatorSub.classList.remove('hidden');
    activeTbody.innerHTML = '';
    lastDocsSub[currentSubTab] = null;
    isSubTabLoaded[currentSubTab] = false;
    document.getElementById('btn-load-submissions-container')?.classList.add('hidden');
  } else {
    document.getElementById('btn-load-submissions').textContent = "جاري التحميل...";
    document.getElementById('btn-load-submissions').disabled = true;
  }
  
  try {
    const { collection, getDocs, query, where, orderBy, limit, startAfter } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [
      where("status", "==", currentSubTab),
      orderBy("createdAt", "asc"),
      limit(50)
    ];
    if (isLoadMore && lastDocsSub[currentSubTab]) {
      constraints.push(startAfter(lastDocsSub[currentSubTab]));
    }
    
    let snap;
    try {
      snap = await getDocs(query(collection(db, "user_submissions"), ...constraints));
    } catch (err) {
      if (err.message.includes('index')) {
        console.warn("Missing index, falling back to basic query for submissions", err);
        constraints = [where("status", "==", currentSubTab), limit(50)];
        if (isLoadMore && lastDocsSub[currentSubTab]) constraints.push(startAfter(lastDocsSub[currentSubTab]));
        snap = await getDocs(query(collection(db, "user_submissions"), ...constraints));
      } else {
        throw err;
      }
    }
    
    if (token !== currentSubLoadToken) return;
    
    if (!isLoadMore) {
      loadingIndicatorSub.classList.add('hidden');
      activeTbody.innerHTML = '';
    }
    
    if (snap.empty && !isLoadMore) {
      let emptyMsg = "لا توجد مشاركات.";
      if (currentSubTab === 'submitted') emptyMsg = "لا توجد مشاركات جديدة تحتاج للمراجعة.";
      
      activeTbody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-inbox text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">${emptyMsg}</p></div></td></tr>`;
      document.getElementById('btn-load-submissions-container')?.classList.add('hidden');
      isSubTabLoaded[currentSubTab] = true;
      return;
    }
    
    snap.forEach(docSnap => {
      const id = docSnap.id;
      if (activeTbody.querySelector(`tr[data-id="${id}"]`)) return;
      
      const data = docSnap.data();
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50 cursor-pointer btn-read-sub';
      tr.dataset.id = id;
      tr.dataset.author = (data.authorName || 'مجهول').toLowerCase();
      tr.dataset.title = (data.title || '').toLowerCase();
      
      let dateStr = '-';
      let elapsedStr = '';
      if (data.createdAt) {
        const d = data.createdAt.toMillis();
        dateStr = new Date(d).toLocaleDateString('ar-EG');
        elapsedStr = timeAgo(d);
      }
      
      let actionLabel = 'قراءة ومراجعة';
      if (currentSubTab === 'approved' || currentSubTab === 'rejected') actionLabel = 'عرض';
      else if (currentSubTab === 'needs_edit') actionLabel = 'تعديل/مراجعة';
      
      tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-gray-900">${data.authorName || 'مجهول'}</td>
        <td class="px-6 py-4 font-semibold">${data.title}</td>
        <td class="px-6 py-4 text-gray-500">
          <div>${dateStr}</div>
          <div class="text-xs text-gray-400 mt-1">${elapsedStr}</div>
        </td>
        <td class="px-6 py-4 text-sm font-medium text-blue-600">${actionLabel}</td>
      `;
      activeTbody.appendChild(tr);
    });
    
    if (snap.docs.length > 0) {
      lastDocsSub[currentSubTab] = snap.docs[snap.docs.length - 1];
    }
    
    isSubTabLoaded[currentSubTab] = true;
    updateSubLoadMoreVisibility(snap.docs.length);
    
    document.querySelectorAll('#submissions-table-' + currentSubTab + ' .btn-read-sub').forEach(tr => {
      tr.addEventListener('click', () => readSubmission(tr.dataset.id));
    });
    
    applySubClientFilter();
    
  } catch (error) {
    if (token !== currentSubLoadToken) return;
    console.error("Error loading submissions:", error);
    loadingIndicatorSub.innerHTML = '<span class="text-red-500 font-bold p-4 block">حدث خطأ أثناء جلب البيانات. (تأكد أنك أدمن).</span>';
  } finally {
    if (isLoadMore) {
      document.getElementById('btn-load-submissions').textContent = "تحميل المزيد";
      document.getElementById('btn-load-submissions').disabled = false;
    }
  }
}

function updateSubLoadMoreVisibility(docsLength = null) {
  if (docsLength === 50) {
    document.getElementById('btn-load-submissions-container')?.classList.remove('hidden');
    return;
  } else if (docsLength !== null) {
    document.getElementById('btn-load-submissions-container')?.classList.add('hidden');
    return;
  }
  if (lastDocsSub[currentSubTab]) {
    document.getElementById('btn-load-submissions-container')?.classList.remove('hidden');
  } else {
    document.getElementById('btn-load-submissions-container')?.classList.add('hidden');
  }
}

function applySubClientFilter() {
  const filterText = (document.getElementById('search-submissions')?.value || '').toLowerCase();
  const rows = document.querySelectorAll('#submissions-table-' + currentSubTab + ' tr.btn-read-sub');
  rows.forEach(row => {
    const author = row.dataset.author || '';
    const title = row.dataset.title || '';
    if (filterText && !author.includes(filterText) && !title.includes(filterText)) {
      row.style.display = 'none';
    } else {
      row.style.display = '';
    }
  });
}

document.querySelectorAll('.sub-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.sub-tab-btn').forEach(b => {
      b.classList.remove('active', 'text-red-600', 'border-b-2', 'border-red-600');
      b.classList.add('text-gray-500', 'hover:text-gray-800');
    });
    e.target.classList.remove('text-gray-500', 'hover:text-gray-800');
    e.target.classList.add('active', 'text-red-600', 'border-b-2', 'border-red-600');
    
    document.getElementById('submissions-table-submitted').classList.add('hidden');
    document.getElementById('submissions-table-needs_edit').classList.add('hidden');
    document.getElementById('submissions-table-rejected').classList.add('hidden');
    document.getElementById('submissions-table-approved').classList.add('hidden');
    
    currentSubTab = e.target.dataset.status;
    document.getElementById('submissions-table-' + currentSubTab).classList.remove('hidden');
    
    const searchInput = document.getElementById('search-submissions');
    if (searchInput) searchInput.value = '';
    
    loadSubmissions(false);
  });
});

document.getElementById('search-submissions')?.addEventListener('input', applySubClientFilter);
document.getElementById('btn-refresh-submissions')?.addEventListener('click', () => loadSubmissions(false, true));


export async function readSubmission(id) {
  if(viewSubmissions) viewSubmissions.classList.add('hidden');
  if(viewSubmissionReader) viewSubmissionReader.classList.remove('hidden');
  document.getElementById('reader-content').innerHTML = 'جاري التحميل...';
  
  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = doc(db, "user_submissions", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      currentSubmission = { id, ...docSnap.data() };
      document.getElementById('reader-title').textContent = currentSubmission.title;
      document.getElementById('reader-author').textContent = 'بواسطة: ' + (currentSubmission.authorName || 'مجهول');
      
      const content = currentSubmission.content.replace(/\n/g, '<br>');
      document.getElementById('reader-content').innerHTML = content;
      
      const typeSelect = document.getElementById('review-horror-type');
      if (typeSelect) typeSelect.value = currentSubmission.suggestedHorrorType || 'other';

      const warningCheck = document.getElementById('review-content-warning');
      const noteContainer = document.getElementById('review-warning-note-container');
      const noteInput = document.getElementById('review-warning-note');

      if (warningCheck && noteInput && noteContainer) {
        warningCheck.checked = !!currentSubmission.suggestedContentWarning;
        if (warningCheck.checked) {
          noteContainer.classList.remove('hidden');
          noteInput.value = currentSubmission.suggestedContentWarningNote || '';
        } else {
          noteContainer.classList.add('hidden');
          noteInput.value = '';
        }
      }
    }
  } catch (e) {
    console.error(e);
    showToast({ type: 'error', message: 'حدث خطأ' });
  }
}

document.getElementById('review-content-warning')?.addEventListener('change', (e) => {
  const container = document.getElementById('review-warning-note-container');
  if (e.target.checked) {
    if(container) container.classList.remove('hidden');
  } else {
    if(container) container.classList.add('hidden');
  }
});

document.getElementById('btn-reader-back')?.addEventListener('click', () => {
  if(viewSubmissionReader) viewSubmissionReader.classList.add('hidden');
  if(viewSubmissions) viewSubmissions.classList.remove('hidden');
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

        const postId = 'story_' + Date.now();
        const postRef = doc(db, "posts", postId);
        
        let slug = currentSubmission.title.trim().replace(/\s+/g, '-');
        slug += '-' + Math.floor(Math.random() * 1000);
        
        const finalHorrorType = document.getElementById('review-horror-type')?.value || currentSubmission.suggestedHorrorType || 'other';
        const finalWarning = document.getElementById('review-content-warning')?.checked || false;
        const finalWarningNoteRaw = document.getElementById('review-warning-note')?.value || '';
        const finalWarningNote = finalWarning && finalWarningNoteRaw.trim() ? (window.DOMPurify ? DOMPurify.sanitize(finalWarningNoteRaw.trim()) : finalWarningNoteRaw.trim()) : null;
        
        const rawHtml = `<p><strong>قصة مرسلة من: ${currentSubmission.authorName}</strong></p><p>${currentSubmission.content.replace(/\n/g, '</p><p>')}</p>`;
        const sanitizedHtml = window.DOMPurify ? DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } }) : rawHtml;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedHtml;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 180));

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
          horrorType: finalHorrorType,
          contentWarning: finalWarning,
          contentWarningNote: finalWarningNote,
          readingTime: readingTime,
          randomWeight: Math.random(),
          weeklyViews: 0,
          weeklyViewsResetAt: serverTimestamp(),
          data: {
            contentHtml: sanitizedHtml,
            readTimeMinutes: readingTime
          }
        };
        
        transaction.set(postRef, postData);
        
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
        
        transaction.update(subRef, {
          status: 'approved',
          publishedPostId: postId,
          publishedSlug: slug,
          updatedAt: serverTimestamp()
        });
        
        const { logAdminAction } = await import('./admin-core.js');
        await logAdminAction(
          'APPROVE_SUBMISSION',
          'user_submission',
          currentSubmission.id,
          'وافق على مساهمة ونشرها',
          currentSubmission.title,
          { postId: postId, title: currentSubmission.title },
          transaction
        );
      });
      
      showToast({ type: 'success', message: 'تم النشر بنجاح!' });
      if(viewSubmissionReader) viewSubmissionReader.classList.add('hidden');
      if(viewSubmissions) viewSubmissions.classList.remove('hidden');
      isSubTabLoaded['submitted'] = false;
      isSubTabLoaded['approved'] = false;
      isSubTabLoaded['rejected'] = false;
      isSubTabLoaded['needs_edit'] = false;
      loadSubmissions(false, true);
    } catch(e) {
      console.error(e);
      if (e.message === "ALREADY_APPROVED") {
        showToast({ type: 'warning', message: 'هذه المشاركة تمت الموافقة عليها مسبقاً.' });
        if(viewSubmissionReader) viewSubmissionReader.classList.add('hidden');
      if(viewSubmissions) viewSubmissions.classList.remove('hidden');
      isSubTabLoaded['submitted'] = false;
      isSubTabLoaded['approved'] = false;
      isSubTabLoaded['rejected'] = false;
      isSubTabLoaded['needs_edit'] = false;
      loadSubmissions(false, true);
      } else {
        showToast({ type: 'error', message: 'حدث خطأ أثناء النشر.' });
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
});

let pendingAction = null; 

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
      
      const { logAdminAction } = await import('./admin-core.js');
      const actionLabel = pendingAction === 'edit' ? 'طلب تعديل على مساهمة' : 'رفض مساهمة';
      await logAdminAction(
        pendingAction === 'edit' ? 'REQUEST_EDIT_SUBMISSION' : 'REJECT_SUBMISSION',
        'user_submission',
        currentSubmission.id,
        actionLabel,
        currentSubmission.title,
        { reason: reason, title: currentSubmission.title },
        transaction
      );
    });
    
    showToast({ type: 'success', message: 'تم الإجراء بنجاح.' });
    pendingAction = null;
    document.getElementById('action-reason-text').value = '';
    document.getElementById('action-reason-container').classList.add('hidden');
    document.getElementById('reader-action-buttons').classList.remove('hidden');
    
    if(viewSubmissionReader) viewSubmissionReader.classList.add('hidden');
      if(viewSubmissions) viewSubmissions.classList.remove('hidden');
      isSubTabLoaded['submitted'] = false;
      isSubTabLoaded['approved'] = false;
      isSubTabLoaded['rejected'] = false;
      isSubTabLoaded['needs_edit'] = false;
      loadSubmissions(false, true);
  } catch(e) {
    console.error(e);
    if (e.message === "ALREADY_PROCESSED") {
      showToast({ type: 'warning', message: 'تمت معالجة هذه المشاركة بالفعل.' });
      if(viewSubmissionReader) viewSubmissionReader.classList.add('hidden');
      if(viewSubmissions) viewSubmissions.classList.remove('hidden');
      isSubTabLoaded['submitted'] = false;
      isSubTabLoaded['approved'] = false;
      isSubTabLoaded['rejected'] = false;
      isSubTabLoaded['needs_edit'] = false;
      loadSubmissions(false, true);
    } else {
      showToast({ type: 'error', message: 'حدث خطأ أثناء تنفيذ الإجراء.' });
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

document.getElementById('btn-load-submissions')?.addEventListener('click', () => loadSubmissions(true, false));
