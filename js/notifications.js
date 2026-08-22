import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let unsubscribeNotifs = null;

function initNotifications() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadNotifications(user.uid);
    } else {
      if (unsubscribeNotifs) {
        unsubscribeNotifs();
        unsubscribeNotifs = null;
      }
      clearNotificationsUI();
    }
  });
}

function loadNotifications(uid) {
  const notifRef = collection(db, "notifications");
  const q = query(notifRef, where("userId", "in", [uid, "all"]), orderBy("createdAt", "desc"), limit(30));
  
  unsubscribeNotifs = onSnapshot(q, (snapshot) => {
    const notifications = [];
    let unreadCount = 0;
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      data.id = docSnap.id;
      
      // Global notifications use readBy array since they are shared
      if (data.userId === 'all') {
         data.read = data.readBy && data.readBy.includes(uid);
      }
      
      if (!data.read) unreadCount++;
      notifications.push(data);
    });
    
    updateNotificationsUI(notifications, unreadCount, uid);
  }, (error) => {
    console.error("Notifications fetch error (likely blocked by client):", error);
  });
}

function updateNotificationsUI(notifications, unreadCount, uid) {
  const notifDot = document.getElementById("notifDot");
  const notifList = document.getElementById("notificationsList");
  
  if (unreadCount > 0) {
    if (notifDot) {
      notifDot.classList.remove("hidden");
      notifDot.textContent = unreadCount > 99 ? '99+' : unreadCount;
    }
  } else {
    if (notifDot) {
      notifDot.classList.add("hidden");
      notifDot.textContent = '';
    }
  }
  
  if (!notifList) return;
  
  notifList.innerHTML = ''; // Clear current
  
  if (notifications.length === 0) {
    notifList.innerHTML = '<li class="px-4 py-3 text-sm text-[var(--color-text-meta)] text-center">لا توجد إشعارات بعد</li>';
    return;
  }
  
  // Mark all as read button
  if (unreadCount > 0) {
    const markAllDiv = document.createElement("div");
    markAllDiv.className = "px-4 py-2 border-b border-[var(--color-border-subtle)] text-right";
    markAllDiv.innerHTML = `<button id="markAllReadBtn" class="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-bold">تحديد الكل كمقروء</button>`;
    notifList.appendChild(markAllDiv);
    markAllDiv.querySelector('#markAllReadBtn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.read) {
          if (n.userId === 'all') {
            batch.update(doc(db, "notifications", n.id), { readBy: arrayUnion(uid) });
          } else {
            batch.update(doc(db, "notifications", n.id), { read: true });
          }
        }
      });
      await batch.commit();
    });
  }
  
  notifications.forEach(n => {
    const li = document.createElement("li");
    li.className = `px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-accent-10 cursor-pointer transition relative group border-b border-[var(--color-border-subtle)] ${n.read ? 'opacity-70 bg-transparent' : 'bg-[var(--color-bg-surface)]'}`;
    
    const timeStr = (n.createdAt && n.createdAt.toDate) ? n.createdAt.toDate().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'الآن';
    const typeLabel = n.type === 'story_approved' ? '<span class="text-green-500">تمت الموافقة</span>' : 
                      n.type === 'story_rejected' ? '<span class="text-[var(--color-accent)]">تم الرفض</span>' : 
                      n.type === 'comment_reply' ? '<span class="text-blue-400">رد جديد</span>' : 
                      n.type === 'admin_announcement' ? '<span class="text-[var(--color-accent)] font-bold">إعلان إداري</span>' :
                      '<span class="text-yellow-500">تحديث</span>';
    
    li.innerHTML = `
      <div class="flex justify-between items-start mb-1">
        <strong class="block">${typeLabel} - ${n.title}</strong>
        ${!n.read ? '<span class="w-2 h-2 bg-[var(--color-accent)] rounded-full inline-block shrink-0 mt-1"></span>' : ''}
      </div>
      <span class="text-[var(--color-text-secondary)] block mb-2">${n.message}</span>
      <div class="flex justify-between items-center text-xs text-[var(--color-text-meta)]">
        <span>${timeStr}</span>
        ${n.link ? `<a href="${n.link}" class="text-[var(--color-accent)] hover:underline">عرض</a>` : ''}
      </div>
    `;
    
    li.addEventListener('click', async (e) => {
      // Don't trigger if clicked on link directly
      if (e.target.tagName === 'A') return;
      
      if (!n.read) {
        if (n.userId === 'all') {
          await updateDoc(doc(db, "notifications", n.id), { readBy: arrayUnion(uid) });
        } else {
          await updateDoc(doc(db, "notifications", n.id), { read: true });
        }
      }
      if (n.link) {
        window.location.href = n.link;
      }
    });
    
    notifList.appendChild(li);
  });
}

function clearNotificationsUI() {
  const notifDot = document.getElementById("notifDot");
  const notifList = document.getElementById("notificationsList");
  if (notifDot) notifDot.classList.add("hidden");
  if (notifList) notifList.innerHTML = '<li class="px-4 py-3 text-sm text-[var(--color-text-meta)] text-center">لا توجد إشعارات بعد</li>';
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initNotifications();
} else {
  window.addEventListener('DOMContentLoaded', initNotifications);
}
