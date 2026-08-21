import { db } from '../../js/firebase-init.js';
import { showToast, showConfirmModal } from '../../js/ui-utils.js';

export async function loadAds() {
  const tbody = document.getElementById('ads-table-body');
  if(!tbody) return;
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
      const id = docSnap.id;
      if (document.getElementById('ads-table-body').querySelector(`tr[data-id="${id}"]`)) return; 
      
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

document.getElementById('btn-load-ads')?.addEventListener('click', () => loadAds(true));
