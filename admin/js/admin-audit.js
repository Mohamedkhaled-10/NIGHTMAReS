import { db } from '../../js/firebase-init.js';

let lastDoc_Audit = null;

export async function loadAuditAdmin(isLoadMore = false) {
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
      if (document.getElementById('audit-table-body').querySelector(`tr[data-id="${id}"]`)) return; 
      
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50 text-sm';
      tr.dataset.id = id;
      let readableSentence = '';
      if (data.adminName && data.actionLabel) {
        readableSentence = `${data.adminName} ${data.actionLabel} ${data.targetLabel ? '"' + data.targetLabel + '"' : ''}`;
      } else {
        // Fallback for older logs
        readableSentence = `المدير قام بـ ${data.action || 'إجراء'} على ${data.targetType || 'عنصر'} (${data.targetUid || data.targetId || 'غير معروف'})`;
      }

      const technicalDetails = `
        <details class="text-xs text-gray-500 mt-1 cursor-pointer">
          <summary class="outline-none">تفاصيل تقنية</summary>
          <div class="mt-2 p-2 bg-gray-100 rounded text-left" dir="ltr">
            <div><strong>Admin UID:</strong> ${data.adminUid}</div>
            <div><strong>Action:</strong> ${data.action}</div>
            <div><strong>Target ID:</strong> ${data.targetUid || data.targetId || '-'}</div>
            <div><strong>Target Type:</strong> ${data.targetType}</div>
            ${data.metadata ? `<div><strong>Metadata:</strong> ${JSON.stringify(data.metadata)}</div>` : ''}
          </div>
        </details>
      `;

      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString('ar-EG') : '-'}</td>
        <td class="px-6 py-4 font-medium text-gray-800">${readableSentence}</td>
        <td class="px-6 py-4">${technicalDetails}</td>
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

document.getElementById('btn-load-audit')?.addEventListener('click', () => loadAuditAdmin(true));
