import { db } from '../../js/firebase-init.js';
import { showToast, showConfirmModal } from '../../js/ui-utils.js';

let lastDoc_Users = null;

export async function loadUsersAdmin(isLoadMore = false) {
  const tbody = document.getElementById('users-table-body');
  if (!isLoadMore) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">جاري التحميل...</td></tr>';
    lastDoc_Users = null;
  } else {
    document.getElementById('btn-load-users').textContent = "جاري التحميل...";
    document.getElementById('btn-load-users').disabled = true;
  }

  const roleFilter = document.getElementById('filter-user-role')?.value || 'all';
  const statusFilter = document.getElementById('filter-user-status')?.value || 'all';

  try {
    const { collection, getDocs, query, orderBy, limit, startAfter, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [];
    
    if (roleFilter !== 'all') constraints.push(where('role', '==', roleFilter));
    if (statusFilter !== 'all') constraints.push(where('status', '==', statusFilter));
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(50));

    if (isLoadMore && lastDoc_Users) {
      constraints.push(startAfter(lastDoc_Users));
    }
    
    let snapshot;
    try {
      snapshot = await getDocs(query(collection(db, "users"), ...constraints));
    } catch(err) {
      if (err.message.includes('index')) {
        console.warn("Missing index for query, falling back to basic query", err.message);
        // Fallback to basic order if composite index fails
        constraints = [orderBy('createdAt', 'desc'), limit(50)];
        if (isLoadMore && lastDoc_Users) constraints.push(startAfter(lastDoc_Users));
        snapshot = await getDocs(query(collection(db, "users"), ...constraints));
      } else {
        throw err;
      }
    }

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
      if (document.getElementById('users-table-body').querySelector(`tr[data-id="${id}"]`)) return; 
      
      // Client side filtering for fallback
      const dataRole = data.role || 'user';
      const dataStatus = data.status || 'active';
      if (roleFilter !== 'all' if (roleFilter !== 'all' && data.role !== roleFilter) return;if (roleFilter !== 'all' && data.role !== roleFilter) return; dataRole !== roleFilter) return;
      if (statusFilter !== 'all' if (statusFilter !== 'all' && data.status !== statusFilter) return;if (statusFilter !== 'all' && data.status !== statusFilter) return; dataStatus !== statusFilter) return;

      const tr = document.createElement('tr');
      const nameText = (data.displayName || 'بدون اسم');
      const emailText = (data.email || '');
      const dateText = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('ar-EG') : '-';
      
      tr.className = 'border-b hover:bg-gray-50';
      tr.dataset.id = id;
      tr.dataset.role = data.role || 'user';
      tr.dataset.status = data.status || 'active';
      
      tr.innerHTML = `
        <td class="px-4 py-4 text-center">
          <input type="checkbox" class="user-checkbox w-4 h-4 rounded border-gray-300 cursor-pointer" value="${docSnap.id}" data-name="${nameText.replace(/"/g, '&quot;')}">
        </td>
        <td class="px-4 py-4 font-medium text-gray-800">${nameText}</td>
        <td class="px-4 py-4 text-gray-600" dir="ltr" style="text-align: right;">${emailText}</td>
        <td class="px-4 py-4">${data.role === 'admin' ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">Admin</span>' : '<span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">User</span>'}</td>
        <td class="px-4 py-4">${data.status === 'banned' ? '<span class="bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-200">محظور</span>' : '<span class="bg-green-50 text-green-600 text-xs px-2 py-1 rounded border border-green-200">نشط</span>'}</td>
        <td class="px-4 py-4 text-gray-500 text-sm">${dateText}</td>
        <td class="px-4 py-4 space-x-2 space-x-reverse">
          ${data.role === 'admin' 
             ? `<button class="text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-xs font-semibold transition" onclick="window.changeUserRole('${docSnap.id}', 'user', this, '${nameText.replace(/'/g, "\\'")}')">سحب الإشراف</button>`
            : `<button class="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-xs font-semibold transition" onclick="window.changeUserRole('${docSnap.id}', 'admin', this, '${nameText.replace(/'/g, "\\'")}')">ترقية لآدمن</button>`}
          ${data.status !== 'banned' 
             ? `<button class="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs font-semibold transition" onclick="window.changeUserStatus('${docSnap.id}', 'banned', this, '${nameText.replace(/'/g, "\\'")}')">حظر</button>` 
             : `<button class="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-xs font-semibold transition" onclick="window.changeUserStatus('${docSnap.id}', 'active', this, '${nameText.replace(/'/g, "\\'")}')">فك الحظر</button>`}
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
    
    applyClientFilters();

  } catch(e) {
    console.error("Error loading users:", e);
    if(!isLoadMore) tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-red-500">حدث خطأ</td></tr>';
  } finally {
    if (isLoadMore) {
      document.getElementById('btn-load-users').textContent = "تحميل المزيد";
      document.getElementById('btn-load-users').disabled = false;
    }
    updateBatchButtonState();
  }
}

function applyClientFilters() {
  const term = (document.getElementById('search-users')?.value || '').toLowerCase();
  const rows = document.querySelectorAll('#users-table-body tr');
  
  rows.forEach(row => {
    if (row.children.length < 2) return; 
    const name = row.children[1].textContent.toLowerCase();
    const email = row.children[2].textContent.toLowerCase();
    
    let match = true;
    if (term && !name.includes(term) && !email.includes(term)) {
      match = false;
    }
    
    row.style.display = match ? '' : 'none';
  });
}

document.getElementById('search-users')?.addEventListener('input', applyClientFilters);
document.getElementById('filter-user-role')?.addEventListener('change', () => loadUsersAdmin(false));
document.getElementById('filter-user-status')?.addEventListener('change', () => loadUsersAdmin(false));
document.getElementById('btn-refresh-users')?.addEventListener('click', () => loadUsersAdmin(false));

// Checkbox selection logic
document.getElementById('selectAllUsers')?.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  const checkboxes = document.querySelectorAll('.user-checkbox');
  checkboxes.forEach(cb => {
    if (cb.closest('tr').style.display !== 'none') {
      cb.checked = isChecked;
    }
  });
  updateBatchButtonState();
});

document.getElementById('users-table-body')?.addEventListener('change', (e) => {
  if (e.target.classList.contains('user-checkbox')) {
    updateBatchButtonState();
  }
});

function updateBatchButtonState() {
  const checked = document.querySelectorAll('.user-checkbox:checked');
  const btn = document.getElementById('btn-batch-ban-users');
  if (btn) {
    if (checked.length > 0) {
      btn.classList.remove('hidden');
      btn.innerHTML = `<i class="fas fa-ban ml-1"></i> حظر المحددين (${checked.length})`;
    } else {
      btn.classList.add('hidden');
    }
  }
}

// Batch action
document.getElementById('btn-batch-ban-users')?.addEventListener('click', async () => {
  const checked = document.querySelectorAll('.user-checkbox:checked');
  if (checked.length === 0) return;
  
  if (!(await showConfirmModal({ title: 'تأكيد الحظر الجماعي', message: `هل أنت متأكد من حظر عدد ${checked.length} مستخدمين دفعة واحدة؟` }))) return;
  
  const btn = document.getElementById('btn-batch-ban-users');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التنفيذ...';

  try {
    const { doc, updateDoc, writeBatch } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const { logAdminAction } = await import('./admin-core.js');
    
    const batch = writeBatch(db);
    const uids = [];
    checked.forEach(cb => {
      const uid = cb.value;
      uids.push(uid);
      const ref = doc(db, 'users', uid);
      batch.update(ref, { status: 'banned' });
    });
    
    await batch.commit();
    
    await logAdminAction(
      'batch_ban_users',
      'user',
      'multiple',
      `حظر ${checked.length} مستخدمين دفعة واحدة`,
      'مجموعة مستخدمين',
      { uids }
    );
    
    showToast({ type: 'success', message: `تم حظر ${checked.length} مستخدمين بنجاح.` });
    document.getElementById('selectAllUsers').checked = false;
    loadUsersAdmin();
  } catch(e) {
    showToast({ type: 'error', message: 'حدث خطأ أثناء التنفيذ الجماعي.' });
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
});

window.changeUserStatus = async (uid, newStatus, btnElement, userName = 'هذا المستخدم') => {
  if (btnElement && btnElement.disabled) return;
  
  const actionText = newStatus === 'banned' ? 'حظر' : 'فك حظر';
  if (!(await showConfirmModal({ title: 'تأكيد الإجراء', message: `هل أنت متأكد من ${actionText} المستخدم "${userName}"؟` }))) return;
  
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  try {
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "users", uid), { status: newStatus });
    
    const { logAdminAction } = await import('./admin-core.js');
    const actionLabel = newStatus === 'banned' ? 'قام بحظر' : 'قام بفك حظر';
    await logAdminAction(
      newStatus === 'banned' ? 'ban_user' : 'unban_user',
      'user',
      uid,
      actionLabel,
      userName || 'المستخدم'
    );

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

window.changeUserRole = async (uid, newRole, btnElement, userName = 'هذا المستخدم') => {
  if (btnElement && btnElement.disabled) return;
  
  const messageText = newRole === 'admin' 
    ? `سيصبح المستخدم "${userName}" آدمن ويحصل على كل صلاحيات لوحة التحكم — هل أنت متأكد؟` 
    : `سيتم سحب صلاحيات الإشراف من المستخدم "${userName}" ويصبح مستخدماً عادياً — هل أنت متأكد؟`;
    
  if (!(await showConfirmModal({ title: 'تغيير صلاحية المستخدم', message: messageText }))) return;
  
  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  try {
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "users", uid), { role: newRole });
    
    const { logAdminAction } = await import('./admin-core.js');
    const actionLabel = newRole === 'admin' ? 'قام بترقية المستخدم إلى مشرف' : 'قام بسحب صلاحيات الإشراف من';
    await logAdminAction(
      'change_role',
      'user',
      uid,
      actionLabel,
      userName || 'المستخدم',
      { newRole }
    );

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

document.getElementById('btn-load-users')?.addEventListener('click', () => loadUsersAdmin(true));
