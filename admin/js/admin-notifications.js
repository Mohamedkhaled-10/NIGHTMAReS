import { db } from "../../js/firebase-init.js";
import { showToast, showConfirmModal } from "../../js/ui-utils.js";
import { logAdminAction } from "./admin-core.js";

// --- Ads Management ---
export async function loadAds() {
  const tbody = document.getElementById("ads-table-body");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">جاري التحميل...</td></tr>';
  try {
    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const querySnapshot = await getDocs(collection(db, "ads_templates"));

    tbody.innerHTML = "";
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-bullhorn text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا توجد إعلانات</p></div></td></tr>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      if (document.getElementById("ads-table-body").querySelector(`tr[data-id="${id}"]`)) return;

      const tr = document.createElement("tr");
      tr.className = "border-b hover:bg-gray-50";
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="p-3"><img src="${data.image}" class="h-12 w-20 object-cover rounded"></td>
        <td class="p-3">${data.text || "-"}</td>
        <td class="p-3">
          <span class="px-2 py-1 rounded text-xs text-white ${data.isActive ? "bg-green-600" : "bg-red-600"}">
            ${data.isActive ? "مفعل" : "معطل"}
          </span>
        </td>
        <td class="p-3">
          <button class="text-indigo-600 hover:text-indigo-900 ml-3 btn-edit-ad" data-id="${id}">تعديل</button>
          <button class="text-red-600 hover:text-red-900 btn-delete-ad" data-id="${id}">حذف</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".btn-edit-ad").forEach(btn => btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docSnap = await getDoc(doc(db, "ads_templates", id));
      if (docSnap.exists()) {
        const d = docSnap.data();
        document.getElementById("ad-id").value = id;
        document.getElementById("ad-image").value = d.image;
        document.getElementById("ad-link").value = d.link;
        document.getElementById("ad-text").value = d.text || "";
        document.getElementById("ad-active").checked = d.isActive;
      }
    }));

    document.querySelectorAll(".btn-delete-ad").forEach(btn => btn.addEventListener("click", async (e) => {
      if (await showConfirmModal({ title: "تأكيد الحذف", message: "هل أنت متأكد من الحذف؟" })) {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await deleteDoc(doc(db, "ads_templates", e.target.dataset.id));
        loadAds();
      }
    }));

  } catch (error) {
    console.error(error);
  }
}

document.getElementById("ad-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("ad-id").value || "ad_" + Date.now();
  const data = {
    image: document.getElementById("ad-image").value,
    link: document.getElementById("ad-link").value,
    text: document.getElementById("ad-text").value,
    isActive: document.getElementById("ad-active").checked,
  };

  try {
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await setDoc(doc(db, "ads_templates", id), data);
    document.getElementById("ad-form").reset();
    document.getElementById("ad-id").value = "";
    loadAds();
  } catch (err) {
    showToast({ type: "error", message: "خطأ في الحفظ" });
  }
});

document.getElementById("btn-load-ads")?.addEventListener("click", () => loadAds(true));

// --- Enhanced Notification Logic (Single / Multiple / All) ---

let selectedUsers = []; // Array of { uid, displayName, email }
let cachedUsersList = null; // In-memory cache for user search
let searchDebounceTimeout = null;

// Handle Target Type radio change
const radioTargetTypes = document.querySelectorAll('input[name="notif-target-type"]');
const userSelectContainer = document.getElementById("notif-user-selection-container");
const userSearchInput = document.getElementById("notif-user-search-input");
const searchResultsBox = document.getElementById("notif-user-search-results");
const searchSpinner = document.getElementById("notif-user-search-spinner");

radioTargetTypes.forEach(radio => {
  radio.addEventListener("change", (e) => {
    const mode = e.target.value;
    if (mode === "all") {
      userSelectContainer.classList.add("hidden");
      selectedUsers = [];
      renderSelectedUsers();
    } else {
      userSelectContainer.classList.remove("hidden");
      const label = document.getElementById("notif-user-search-label");
      if (label) {
        label.textContent = mode === "single" ? "اختر مستخدماً واحداً (البحث بالاسم أو البريد)" : "اختر المستخدمين المستهدفين (متعدد)";
      }
      if (mode === "single" && selectedUsers.length > 1) {
        // Keep only the first selected user in single mode
        selectedUsers = [selectedUsers[0]];
        renderSelectedUsers();
      }
      fetchUsersForPicker();
    }
  });
});

async function fetchUsersForPicker() {
  if (cachedUsersList !== null) return;
  if (searchSpinner) searchSpinner.classList.remove("hidden");

  try {
    const { collection, getDocs, query, limit } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const snap = await getDocs(query(collection(db, "users"), limit(200)));
    cachedUsersList = [];
    snap.forEach(docSnap => {
      const d = docSnap.data();
      cachedUsersList.push({
        uid: docSnap.id,
        displayName: d.displayName || d.name || "مستخدم",
        email: d.email || "",
        photoURL: d.photoURL || "/assets/images/logo1.png",
        role: d.role || "user"
      });
    });
  } catch (err) {
    console.error("Error fetching users for picker:", err);
  } finally {
    if (searchSpinner) searchSpinner.classList.add("hidden");
  }
}

userSearchInput?.addEventListener("input", (e) => {
  const queryText = e.target.value.trim().toLowerCase();
  clearTimeout(searchDebounceTimeout);
  
  if (!queryText) {
    searchResultsBox.classList.add("hidden");
    searchResultsBox.innerHTML = "";
    return;
  }

  searchDebounceTimeout = setTimeout(async () => {
    await fetchUsersForPicker();
    if (!cachedUsersList) return;

    const filtered = cachedUsersList.filter(u => 
      u.displayName.toLowerCase().includes(queryText) ||
      u.email.toLowerCase().includes(queryText) ||
      u.uid.toLowerCase().includes(queryText)
    ).slice(0, 10);

    renderSearchResults(filtered);
  }, 200);
});

function renderSearchResults(results) {
  if (!searchResultsBox) return;

  if (results.length === 0) {
    searchResultsBox.innerHTML = '<div class="p-3 text-xs text-gray-500 text-center">لم يتم العثور على مستخدمين يطابقون البحث</div>';
    searchResultsBox.classList.remove("hidden");
    return;
  }

  searchResultsBox.innerHTML = "";
  results.forEach(user => {
    const isSelected = selectedUsers.some(u => u.uid === user.uid);
    const div = document.createElement("div");
    div.className = `p-2.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer text-xs ${isSelected ? "bg-red-50 text-red-700" : ""}`;
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <img src="${user.photoURL}" class="w-6 h-6 rounded-full object-cover" onerror="this.src='/assets/images/logo1.png'">
        <div>
          <strong class="block text-gray-900">${user.displayName}</strong>
          <span class="text-gray-500 font-mono" dir="ltr">${user.email || user.uid.substring(0, 12) + "..."}</span>
        </div>
      </div>
      <div>
        ${isSelected 
          ? '<span class="text-red-600 font-bold"><i class="fas fa-check"></i> محدد</span>' 
          : '<button type="button" class="text-blue-600 hover:text-blue-800 font-semibold">+ تحديد</button>'}
      </div>
    `;

    div.addEventListener("click", () => {
      const mode = document.querySelector('input[name="notif-target-type"]:checked')?.value;
      if (mode === "single") {
        selectedUsers = [user];
      } else {
        if (!selectedUsers.some(u => u.uid === user.uid)) {
          selectedUsers.push(user);
        } else {
          selectedUsers = selectedUsers.filter(u => u.uid !== user.uid);
        }
      }
      renderSelectedUsers();
      searchResultsBox.classList.add("hidden");
      if (userSearchInput) userSearchInput.value = "";
    });

    searchResultsBox.appendChild(div);
  });

  searchResultsBox.classList.remove("hidden");
}

function renderSelectedUsers() {
  const container = document.getElementById("notif-selected-users-list");
  if (!container) return;

  if (selectedUsers.length === 0) {
    container.innerHTML = '<span class="text-xs text-gray-400 italic py-1" id="notif-no-users-hint">لم يتم تحديد مستخدمين بعد</span>';
    return;
  }

  container.innerHTML = "";
  selectedUsers.forEach(user => {
    const badge = document.createElement("span");
    badge.className = "bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold";
    badge.innerHTML = `
      <span>${user.displayName}</span>
      <button type="button" class="text-red-500 hover:text-red-700 font-bold ml-1 text-sm leading-none" data-uid="${user.uid}">&times;</button>
    `;
    badge.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      selectedUsers = selectedUsers.filter(u => u.uid !== user.uid);
      renderSelectedUsers();
    });
    container.appendChild(badge);
  });
}

// Global click to close search results
document.addEventListener("click", (e) => {
  if (!userSelectContainer?.contains(e.target)) {
    searchResultsBox?.classList.add("hidden");
  }
});

// Form Submit Handler
document.getElementById("notif-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const targetType = document.querySelector('input[name="notif-target-type"]:checked')?.value || "all";
  const title = document.getElementById("notif-title")?.value.trim() || "إعلان إداري جديد";
  const text = document.getElementById("notif-text")?.value.trim();
  const link = document.getElementById("notif-link")?.value.trim() || "";
  const image = document.getElementById("notif-image")?.value.trim() || "";

  if (!text) {
    showToast({ type: "warning", message: "يرجى كتابة محتوى الإشعار." });
    return;
  }

  if (targetType !== "all" && selectedUsers.length === 0) {
    showToast({ type: "warning", message: "يرجى تحديد مستخدم واحد على الأقل." });
    return;
  }

  const btn = document.getElementById("btn-send-notif");
  btn.disabled = true;
  const originalBtnHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

  try {
    const { collection, addDoc, doc, writeBatch, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    if (targetType === "all") {
      // 1. Send broadcast notification (all)
      await addDoc(collection(db, "notifications"), {
        userId: "all",
        type: "admin_announcement",
        title: title,
        message: text,
        link: link,
        image: image,
        readBy: [],
        createdAt: serverTimestamp()
      });

      await logAdminAction(
        "SEND_BROADCAST_NOTIFICATION",
        "notification",
        "all",
        "أرسل إشعاراً جماعياً للكل",
        "كل المستخدمين",
        { title, messagePreview: text.substring(0, 50), link }
      );

      showToast({ type: "success", message: "تم إرسال الإشعار لجميع المستخدمين بنجاح." });
    } else if (targetType === "single" || selectedUsers.length === 1) {
      // 2. Send single user notification
      const targetUser = selectedUsers[0];
      await addDoc(collection(db, "notifications"), {
        userId: targetUser.uid,
        type: "admin_announcement",
        title: title,
        message: text,
        link: link,
        image: image,
        read: false,
        createdAt: serverTimestamp()
      });

      await logAdminAction(
        "SEND_USER_NOTIFICATION",
        "user",
        targetUser.uid,
        `أرسل إشعاراً للمستخدم (${targetUser.displayName})`,
        targetUser.displayName,
        { userId: targetUser.uid, title, messagePreview: text.substring(0, 50), link }
      );

      showToast({ type: "success", message: `تم إرسال الإشعار للمستخدم (${targetUser.displayName}) بنجاح.` });
    } else {
      // 3. Send batch notifications to multiple specific users
      const batch = writeBatch(db);
      selectedUsers.forEach(user => {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          userId: user.uid,
          type: "admin_announcement",
          title: title,
          message: text,
          link: link,
          image: image,
          read: false,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();

      await logAdminAction(
        "SEND_BATCH_NOTIFICATION",
        "users_group",
        "batch_" + Date.now(),
        `أرسل إشعاراً لـ ${selectedUsers.length} مستخدمين محددين`,
        `${selectedUsers.length} مستخدمين`,
        {
          count: selectedUsers.length,
          recipients: selectedUsers.map(u => ({ uid: u.uid, name: u.displayName })),
          title,
          messagePreview: text.substring(0, 50),
          link
        }
      );

      showToast({ type: "success", message: `تم إرسال الإشعار لـ ${selectedUsers.length} مستخدمين بنجاح.` });
    }

    // Reset Form
    document.getElementById("notif-form").reset();
    selectedUsers = [];
    renderSelectedUsers();
    userSelectContainer?.classList.add("hidden");
    const radioAll = document.querySelector('input[name="notif-target-type"][value="all"]');
    if (radioAll) radioAll.checked = true;

  } catch (err) {
    console.error("Error sending notification:", err);
    showToast({ type: "error", message: "حدث خطأ أثناء إرسال الإشعار." });
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnHtml;
  }
});
