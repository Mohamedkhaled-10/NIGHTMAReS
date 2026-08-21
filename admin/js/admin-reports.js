import { db, auth } from '../../js/firebase-init.js';
import { showToast, showConfirmModal, showPromptModal } from '../../js/ui-utils.js';

let lastDoc_Reports = null;

export async function loadReports(isLoadMore = false) {
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
      if (document.getElementById('reports-table-body').querySelector(`tr[data-id="${id}"]`)) return; 
      
      let actionHtml = '';
      if (data.status === 'pending') {
        actionHtml = `
          <button class="text-blue-600 hover:underline text-sm" onclick="window.updateReportStatus('${id}', 'reviewing', this)">بدء المراجعة</button>
          <button class="text-red-600 hover:underline text-sm" onclick="window.updateReportStatus('${id}', 'rejected', this)">رفض كاذب</button>
        `;
      } else if (data.status === 'reviewing') {
         actionHtml = `
          <button class="text-green-600 hover:underline text-sm font-bold" onclick="window.resolveReport('${id}', '${data.targetType}', '${data.targetId}', this)">اتخاذ إجراء (حذف)</button>
          <button class="text-red-600 hover:underline text-sm" onclick="window.updateReportStatus('${id}', 'rejected', this)">رفض كاذب</button>
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
    
    const { logAdminAction } = await import('./admin-core.js');
    const actionLabel = newStatus === 'reviewing' ? 'بدأ بمراجعة البلاغ' : 'رفض البلاغ كاذب';
    await logAdminAction(
      'update_report_status',
      'report',
      reportId,
      actionLabel,
      'بلاغ',
      { newStatus }
    );

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
    
    const { logAdminAction } = await import('./admin-core.js');
    await logAdminAction(
      'resolve_report',
      targetType,
      targetId,
      'حل البلاغ باتخاذ إجراء (' + action + ')',
      targetType,
      { reportId, appliedAction: action }
    );
    
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

document.getElementById('btn-load-reports')?.addEventListener('click', () => loadReports(true));

document.getElementById('report-filter-status')?.addEventListener('change', () => loadReports(false));
document.getElementById('btn-refresh-reports')?.addEventListener('click', () => loadReports(false));
