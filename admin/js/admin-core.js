import { db, auth } from '../../js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, query, orderBy, getCountFromServer, getAggregateFromServer, sum, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Import modules for routing
import { loadUsersAdmin } from './admin-users.js';
import { loadCommentsAdmin } from './admin-comments.js';
import { loadAuditAdmin } from './admin-audit.js';
import { loadReports } from './admin-reports.js';
import { loadPosts } from './admin-posts.js';
import { loadSubmissions } from './admin-submissions.js';
import { loadAds } from "./admin-notifications.js";
import { loadOverviewData } from "./admin-overview.js";

export const viewList = document.getElementById('view-list');
export const viewEditor = document.getElementById('view-editor');
export const menuPosts = document.getElementById('menu-posts');
export const menuSubmissions = document.getElementById('menu-submissions');
export const viewSubmissions = document.getElementById('view-submissions');
export const viewSubmissionReader = document.getElementById('view-submission-reader');
export const menuAds = document.getElementById('menu-ads');
export const menuNotifications = document.getElementById('menu-notifications');
export const viewAds = document.getElementById('view-ads');
export const viewNotifications = document.getElementById('view-notifications');
export const menuOverview = document.getElementById('menu-overview');
export const menuUsers = document.getElementById('menu-users');
export const menuComments = document.getElementById('menu-comments');
export const menuAudit = document.getElementById('menu-audit');
export const viewOverview = document.getElementById('view-overview');
export const viewUsers = document.getElementById('view-users');
export const viewComments = document.getElementById('view-comments');
export const viewAudit = document.getElementById('view-audit');
export const viewReports = document.getElementById('view-reports');
export const menuReports = document.getElementById('menu-reports');

export function hideAllViews() {
  if(viewList) viewList.classList.add('hidden');
  if(viewEditor) viewEditor.classList.add('hidden');
  if(viewSubmissionReader) viewSubmissionReader.classList.add('hidden');
  if(viewSubmissions) viewSubmissions.classList.add('hidden');
  if(viewAds) viewAds.classList.add('hidden');
  if(viewNotifications) viewNotifications.classList.add('hidden');
  
  [menuPosts, menuSubmissions, menuAds, menuNotifications].forEach(m => {
    if(m) {
      m.classList.remove('bg-gray-800', 'text-white');
      m.classList.add('text-gray-300');
    }
  });
  const newPostBtn = document.getElementById('btn-new-post');
  if(newPostBtn) newPostBtn.classList.add('hidden');
}

export function overrideHideAllViews() {
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

export function escapeHTML(str) {
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

// Analytics and period
export const periodSelect = document.getElementById('overview-period');
if (periodSelect) {
  periodSelect.addEventListener('change', loadOverviewData);
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

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (menuOverview) {
      menuOverview.click();
    } else {
      loadPosts();
    }
  }
});

export async function logAdminAction(actionType, targetType, targetId, actionLabel, targetLabel, metadata = {}, transaction = null) {
  try {
    const { collection, doc, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const adminUid = auth.currentUser?.uid || 'unknown';
    const adminName = auth.currentUser?.displayName || auth.currentUser?.email || 'آدمن';

    const payload = {
      action: actionType,
      targetType: targetType,
      targetId: targetId,
      adminUid: adminUid,
      adminName: adminName,
      actionLabel: actionLabel,
      targetLabel: targetLabel,
      metadata: metadata,
      timestamp: serverTimestamp()
    };

    if (transaction) {
      const auditRef = doc(collection(db, "audit_logs"));
      transaction.set(auditRef, payload);
    } else {
      await addDoc(collection(db, "audit_logs"), payload);
    }
  } catch(e) {
    console.error("Failed to write audit log:", e);
  }
}
