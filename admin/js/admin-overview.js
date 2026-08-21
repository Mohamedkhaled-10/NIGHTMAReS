import { db } from '../../js/firebase-init.js';
import { collection, getDocs, query, orderBy, getCountFromServer, getAggregateFromServer, sum, where, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function loadOverviewData() {
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

  const loadingHtml = '<i class="fas fa-spinner fa-spin text-sm text-gray-400"></i>';
  const elementIds = [
    'stat-posts', 'stat-count-story', 'stat-count-news', 'stat-count-video',
    'stat-views', 'stat-likes', 'stat-users-total', 'stat-users-new',
    'stat-submissions-pending', 'stat-reports-pending'
  ];
  elementIds.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = loadingHtml;
  });

  document.getElementById('overview-recent-activities').innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-500">جاري التحميل...</td></tr>';

  try {
    const subSnap = await getCountFromServer(query(collection(db, 'user_submissions'), where('status', '==', 'submitted')));
    document.getElementById('stat-submissions-pending').textContent = subSnap.data().count;
  } catch(e) { document.getElementById('stat-submissions-pending').textContent = '-'; }

  try {
    const repSnap = await getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'pending')));
    document.getElementById('stat-reports-pending').textContent = repSnap.data().count;
  } catch(e) { document.getElementById('stat-reports-pending').textContent = '-'; }

  const getQ = (colName, statusField, statusVal) => {
    let constraints = [];
    if (statusField && statusVal) {
      constraints.push(where(statusField, "==", statusVal));
    }
    if (startDate) {
      constraints.push(where("createdAt", ">=", startDate));
    }
    return query(collection(db, colName), ...constraints);
  };

  try {
    const totalUsersSnap = await getCountFromServer(query(collection(db, 'users')));
    document.getElementById('stat-users-total').textContent = totalUsersSnap.data().count;
    
    if (period === 'all') {
      document.getElementById('stat-users-new').textContent = totalUsersSnap.data().count;
    } else {
      const newUsersSnap = await getCountFromServer(getQ('users'));
      document.getElementById('stat-users-new').textContent = newUsersSnap.data().count;
    }
  } catch(e) { document.getElementById('stat-users-total').textContent = '-'; document.getElementById('stat-users-new').textContent = '-'; }

  try {
    const qPosts = getQ('posts', 'status', 'published');
    const totalPostsSnap = await getCountFromServer(qPosts);
    document.getElementById('stat-posts').textContent = totalPostsSnap.data().count;

    let totalViews = 0;
    let totalLikes = 0;
    try {
      const aggSnap = await getAggregateFromServer(qPosts, {
        views: sum('views'),
        likes: sum('likesCount')
      });
      totalViews = aggSnap.data().views || 0;
      totalLikes = aggSnap.data().likes || 0;
    } catch (aggErr) {
      const docsSnap = await getDocs(qPosts);
      docsSnap.forEach(d => {
        totalViews += d.data().views || 0;
        totalLikes += d.data().likesCount || 0;
      });
    }
    document.getElementById('stat-views').textContent = totalViews;
    document.getElementById('stat-likes').textContent = totalLikes;

    const getQType = (typeVal) => {
      let constraints = [where("status", "==", "published"), where("type", "==", typeVal)];
      if (startDate) constraints.push(where("createdAt", ">=", startDate));
      return query(collection(db, "posts"), ...constraints);
    };

    const [storySnap, newsSnap, videoSnap] = await Promise.all([
      getCountFromServer(getQType('story')),
      getCountFromServer(getQType('news')),
      getCountFromServer(getQType('video'))
    ]);

    document.getElementById('stat-count-story').textContent = storySnap.data().count;
    document.getElementById('stat-count-news').textContent = newsSnap.data().count;
    document.getElementById('stat-count-video').textContent = videoSnap.data().count;

  } catch(e) { console.error("Content metrics error:", e); }

  try {
    const auditSnap = await getDocs(query(collection(db, "audit_logs"), orderBy('timestamp', 'desc'), limit(5)));
    const tbody = document.getElementById('overview-recent-activities');
    tbody.innerHTML = '';
    
    if (auditSnap.empty) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-500">لا توجد أنشطة مسجلة بعد</td></tr>';
    } else {
      auditSnap.forEach(docSnap => {
        const data = docSnap.data();
        let readableSentence = '';
        if (data.adminName && data.actionLabel) {
          readableSentence = `${data.adminName} ${data.actionLabel} ${data.targetLabel ? '"' + data.targetLabel + '"' : ''}`;
        } else {
          readableSentence = `المدير قام بـ ${data.action || 'إجراء'} على ${data.targetType || 'عنصر'} (${data.targetUid || data.targetId || 'غير معروف'})`;
        }
        const timeStr = data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString('ar-EG', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' }) : '-';
        
        const tr = document.createElement('tr');
        tr.className = 'border-b last:border-0 hover:bg-gray-50';
        tr.innerHTML = `
          <td class="p-3 text-right text-gray-800 font-medium">${readableSentence}</td>
          <td class="p-3 text-left text-gray-500 text-xs whitespace-nowrap" dir="ltr">${timeStr}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch(e) {
    document.getElementById('overview-recent-activities').innerHTML = '<tr><td colspan="4" class="text-center p-4 text-red-500">حدث خطأ أثناء جلب الأنشطة</td></tr>';
  }
}

document.getElementById('btn-goto-submissions')?.addEventListener('click', () => {
  const mSub = document.getElementById('menu-submissions');
  if (mSub) mSub.click();
});

document.getElementById('btn-goto-reports')?.addEventListener('click', () => {
  const mRep = document.getElementById('menu-reports');
  if (mRep) {
    mRep.click();
    setTimeout(() => {
      const filter = document.getElementById('report-filter-status');
      if (filter) {
        filter.value = 'pending';
        filter.dispatchEvent(new Event('change'));
      }
    }, 100);
  }
});

document.getElementById('btn-goto-audit')?.addEventListener('click', () => {
  const mAud = document.getElementById('menu-audit');
  if (mAud) mAud.click();
});
