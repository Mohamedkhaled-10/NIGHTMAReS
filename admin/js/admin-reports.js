import { db } from "../../js/firebase-init.js";
import { showToast, showConfirmModal, showPromptModal } from "../../js/ui-utils.js";

let currentReportStatus = "pending";
let lastDocs_Reports = {
  pending: null,
  reviewing: null,
  resolved: null,
  rejected: null
};

let isReportTabLoaded = {
  pending: false,
  reviewing: false,
  resolved: false,
  rejected: false
};

let currentReportsLoadToken = 0;

function timeAgo(dateInput) {
  if (!dateInput) return "-";
  const diffInMs = new Date() - dateInput;
  const diffInMins = Math.floor(diffInMs / 60000);
  if (diffInMins < 1) return "الآن";
  if (diffInMins < 60) return `منذ ${diffInMins} دقيقة`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `منذ ${diffInDays} يوم`;
}

export async function loadReports(isLoadMore = false, forceRefresh = false) {
  const token = ++currentReportsLoadToken;
  const activeTbody = document.getElementById("reports-table-" + currentReportStatus);
  const loading = document.getElementById("loading-indicator-reports");

  if (!isLoadMore) {
    if (!forceRefresh && isReportTabLoaded[currentReportStatus]) {
      updateReportsLoadMoreVisibility();
      applyReportClientFilters();
      return;
    }
    if (activeTbody) activeTbody.innerHTML = "";
    if (loading) loading.classList.remove("hidden");
    lastDocs_Reports[currentReportStatus] = null;
    isReportTabLoaded[currentReportStatus] = false;
    document.getElementById("btn-load-reports-container")?.classList.add("hidden");
  } else {
    const btnLoad = document.getElementById("btn-load-reports");
    if (btnLoad) {
      btnLoad.textContent = "جاري التحميل...";
      btnLoad.disabled = true;
    }
  }

  try {
    const { collection, getDocs, query, where, orderBy, limit, startAfter } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    
    // In pending status: sort ASC (oldest first) to prioritize longest waiting.
    // In other statuses: sort DESC (newest first).
    const sortDirection = currentReportStatus === "pending" ? "asc" : "desc";
    
    let constraints = [
      where("status", "==", currentReportStatus),
      orderBy("createdAt", sortDirection),
      limit(50)
    ];

    if (isLoadMore && lastDocs_Reports[currentReportStatus]) {
      constraints.push(startAfter(lastDocs_Reports[currentReportStatus]));
    }

    let snap;
    try {
      snap = await getDocs(query(collection(db, "reports"), ...constraints));
    } catch (err) {
      if (err.message && err.message.includes("index")) {
        console.warn("Missing index, falling back to basic query for reports", err);
        constraints = [where("status", "==", currentReportStatus), limit(50)];
        if (isLoadMore && lastDocs_Reports[currentReportStatus]) {
          constraints.push(startAfter(lastDocs_Reports[currentReportStatus]));
        }
        snap = await getDocs(query(collection(db, "reports"), ...constraints));
      } else {
        throw err;
      }
    }

    if (token !== currentReportsLoadToken) return;

    if (!isLoadMore && loading) {
      loading.classList.add("hidden");
      if (activeTbody) activeTbody.innerHTML = "";
    }

    if (snap.empty && !isLoadMore) {
      if (activeTbody) {
        activeTbody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-flag text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">لا توجد إبلاغات في هذه الحالة</p></div></td></tr>`;
      }
      document.getElementById("btn-load-reports-container")?.classList.add("hidden");
      isReportTabLoaded[currentReportStatus] = true;
      return;
    }

    const renderedIds = new Set();
    snap.forEach(docSnap => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);

      const data = docSnap.data();
      if (activeTbody && activeTbody.querySelector(`tr[data-id="${id}"]`)) return;

      let actionHtml = "";
      if (data.status === "pending") {
        actionHtml = `
          <button class="text-blue-600 hover:underline text-xs font-semibold block mb-1" onclick="window.updateReportStatus('${id}', 'reviewing', this)"><i class="fas fa-play-circle ml-1"></i>بدء المراجعة</button>
          <button class="text-red-600 hover:underline text-xs font-semibold block" onclick="window.updateReportStatus('${id}', 'rejected', this)"><i class="fas fa-times-circle ml-1"></i>رفض كاذب</button>
        `;
      } else if (data.status === "reviewing") {
        actionHtml = `
          <button class="text-green-600 hover:underline text-xs font-bold block mb-1" onclick="window.resolveReport('${id}', '${data.targetType}', '${data.targetId}', this)"><i class="fas fa-check-circle ml-1"></i>اتخاذ إجراء</button>
          <button class="text-red-600 hover:underline text-xs font-semibold block" onclick="window.updateReportStatus('${id}', 'rejected', this)"><i class="fas fa-times-circle ml-1"></i>رفض كاذب</button>
        `;
      } else if (data.status === "resolved") {
        actionHtml = `<span class="text-green-600 font-semibold text-xs"><i class="fas fa-check ml-1"></i>تم اتخاذ الإجراء</span>`;
      } else {
        actionHtml = `<span class="text-gray-400 text-xs">مرفوض</span>`;
      }

      // Format target type
      let targetTypeBadge = "";
      let targetTypeRaw = (data.targetType || "unknown").toLowerCase();
      if (targetTypeRaw === "content" || targetTypeRaw === "post") {
        targetTypeBadge = `<span class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold"><i class="fas fa-file-alt ml-1"></i>منشور</span>`;
      } else if (targetTypeRaw === "comment") {
        targetTypeBadge = `<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold"><i class="fas fa-comment ml-1"></i>تعليق</span>`;
      } else if (targetTypeRaw === "user") {
        targetTypeBadge = `<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-semibold"><i class="fas fa-user ml-1"></i>مستخدم</span>`;
      } else {
        targetTypeBadge = `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">${data.targetType || "غير محدد"}</span>`;
      }

      // Date & elapsed
      let dateStr = "-";
      let elapsedStr = "";
      if (data.createdAt) {
        const d = data.createdAt.toMillis();
        dateStr = new Date(d).toLocaleDateString("ar-EG");
        elapsedStr = timeAgo(d);
      }

      // Direct target link button
      const targetIdShort = data.targetId ? (data.targetId.length > 15 ? data.targetId.substring(0, 15) + "..." : data.targetId) : "-";
      const targetLinkHtml = `
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-gray-500" dir="ltr">${targetIdShort}</span>
          <button type="button" class="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded font-semibold transition flex items-center gap-1" onclick="window.openReportTarget('${data.targetType}', '${data.targetId}', this)">
            <i class="fas fa-external-link-alt"></i> فتح
          </button>
        </div>
      `;

      // Status badge
      const statusMap = {
        pending: `<span class="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-bold border border-yellow-200">قيد الانتظار</span>`,
        reviewing: `<span class="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold border border-blue-200">قيد المراجعة</span>`,
        resolved: `<span class="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-200">محلول</span>`,
        rejected: `<span class="text-gray-500 bg-gray-50 px-2 py-1 rounded text-xs font-bold border border-gray-200">مرفوض</span>`
      };
      const statusBadge = statusMap[data.status] || data.status;

      const tr = document.createElement("tr");
      tr.className = "border-b hover:bg-gray-50 text-sm";
      tr.dataset.id = id;
      tr.dataset.targetType = targetTypeRaw;
      tr.dataset.targetId = (data.targetId || "").toLowerCase();
      tr.dataset.reporterId = (data.reporterUid || data.reporterId || "").toLowerCase();
      tr.dataset.reason = (data.reason || "").toLowerCase();
      tr.dataset.details = (data.details || "").toLowerCase();

      tr.innerHTML = `
        <td class="px-4 py-4 text-gray-500 whitespace-nowrap">
          <div>${dateStr}</div>
          <div class="text-xs text-gray-400 mt-1">${elapsedStr}</div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap">${targetTypeBadge}</td>
        <td class="px-4 py-4">${targetLinkHtml}</td>
        <td class="px-4 py-4">
          <div class="font-semibold text-gray-900">${data.reason || "بدون سبب"}</div>
          ${data.details ? `<div class="text-xs text-gray-500 mt-1 max-w-xs line-clamp-2" title="${data.details.replace(/"/g, "&quot;")}">${data.details}</div>` : ""}
        </td>
        <td class="px-4 py-4 font-mono text-xs text-gray-600 whitespace-nowrap" dir="ltr" style="text-align: right;">
          ${(data.reporterUid || data.reporterId || "-").substring(0, 12)}...
        </td>
        <td class="px-4 py-4 whitespace-nowrap">${statusBadge}</td>
        <td class="px-4 py-4 whitespace-nowrap">${actionHtml}</td>
      `;
      if (activeTbody) activeTbody.appendChild(tr);
    });

    if (snap.docs.length > 0) {
      lastDocs_Reports[currentReportStatus] = snap.docs[snap.docs.length - 1];
    }

    isReportTabLoaded[currentReportStatus] = true;
    updateReportsLoadMoreVisibility(snap.docs.length);
    applyReportClientFilters();

  } catch (e) {
    if (token !== currentReportsLoadToken) return;
    console.error("Error loading reports", e);
    if (!isLoadMore && loading) {
      loading.innerHTML = '<span class="text-red-500 font-bold p-4 block">حدث خطأ أثناء جلب البلاغات.</span>';
    }
  } finally {
    if (isLoadMore) {
      const btnLoad = document.getElementById("btn-load-reports");
      if (btnLoad) {
        btnLoad.textContent = "تحميل المزيد";
        btnLoad.disabled = false;
      }
    }
  }
}

function updateReportsLoadMoreVisibility(docsLength = null) {
  const container = document.getElementById("btn-load-reports-container");
  if (!container) return;

  if (docsLength === 50) {
    container.classList.remove("hidden");
    return;
  } else if (docsLength !== null) {
    container.classList.add("hidden");
    return;
  }

  if (lastDocs_Reports[currentReportStatus]) {
    container.classList.remove("hidden");
  } else {
    container.classList.add("hidden");
  }
}

function applyReportClientFilters() {
  const filterType = document.getElementById("report-filter-target-type")?.value || "all";
  const searchText = (document.getElementById("search-reports")?.value || "").toLowerCase().trim();

  const rows = document.querySelectorAll("#reports-table-" + currentReportStatus + " tr");
  rows.forEach(row => {
    if (row.children.length < 3) return; // Skip empty row message

    const tType = row.dataset.targetType || "";
    const tId = row.dataset.targetId || "";
    const reporter = row.dataset.reporterId || "";
    const reason = row.dataset.reason || "";
    const details = row.dataset.details || "";

    let matchType = true;
    if (filterType !== "all") {
      if (filterType === "content") {
        matchType = (tType === "content" || tType === "post");
      } else {
        matchType = (tType === filterType);
      }
    }

    let matchSearch = true;
    if (searchText) {
      matchSearch = reason.includes(searchText) || details.includes(searchText) || tId.includes(searchText) || reporter.includes(searchText);
    }

    row.style.display = (matchType && matchSearch) ? "" : "none";
  });
}

// Direct link handler for targets
window.openReportTarget = async (targetType, targetId, btnElement) => {
  if (!targetType || !targetId) {
    showToast({ type: "warning", message: "معرف الهدف غير متوفر." });
    return;
  }

  const rawType = targetType.toLowerCase();

  if (rawType === "user") {
    window.open(`/author/${targetId}`, "_blank");
    return;
  }

  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }

  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    if (rawType === "content" || rawType === "post") {
      const pSnap = await getDoc(doc(db, "posts", targetId));
      if (pSnap.exists()) {
        const pData = pSnap.data();
        const pType = pData.type || "story";
        const pSlug = pData.slug || targetId;
        window.open(`/${pType}/${pSlug}`, "_blank");
      } else {
        showToast({ type: "error", message: "المحتوى غير موجود أو تم حذفه." });
      }
    } else if (rawType === "comment") {
      const cSnap = await getDoc(doc(db, "comments", targetId));
      if (cSnap.exists()) {
        const cData = cSnap.data();
        if (cData.contentId) {
          const pSnap = await getDoc(doc(db, "posts", cData.contentId));
          if (pSnap.exists()) {
            const pData = pSnap.data();
            const pType = pData.type || "story";
            const pSlug = pData.slug || cData.contentId;
            window.open(`/${pType}/${pSlug}#comments`, "_blank");
          } else {
            showToast({ type: "warning", message: "المقال المرتبط بالتعليق غير موجود." });
          }
        } else {
          showToast({ type: "error", message: "معرف المقال غير متوفر في التعليق." });
        }
      } else {
        showToast({ type: "error", message: "التعليق غير موجود أو تم حذفه." });
      }
    } else {
      showToast({ type: "info", message: `نوع الهدف: ${targetType}` });
    }
  } catch (err) {
    console.error("Error opening target:", err);
    showToast({ type: "error", message: "تعذر فتح الهدف." });
  } finally {
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = '<i class="fas fa-external-link-alt"></i> فتح';
    }
  }
};

window.updateReportStatus = async (reportId, newStatus, btnElement) => {
  if (btnElement && btnElement.disabled) return;
  if (!(await showConfirmModal({ title: "تغيير حالة الإبلاغ", message: `هل أنت متأكد من تغيير الحالة إلى ${newStatus}؟` }))) return;

  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  try {
    const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await updateDoc(doc(db, "reports", reportId), { status: newStatus, updatedAt: serverTimestamp() });

    const { logAdminAction } = await import("./admin-core.js");
    const actionLabel = newStatus === "reviewing" ? "بدأ بمراجعة البلاغ" : "رفض البلاغ كاذب";
    await logAdminAction(
      "update_report_status",
      "report",
      reportId,
      actionLabel,
      "بلاغ",
      { newStatus }
    );

    // Invalidate caches
    isReportTabLoaded["pending"] = false;
    isReportTabLoaded["reviewing"] = false;
    isReportTabLoaded["resolved"] = false;
    isReportTabLoaded["rejected"] = false;

    showToast({ type: "success", message: "تم تحديث حالة البلاغ بنجاح." });
    loadReports(false, true);
  } catch (e) {
    showToast({ type: "error", message: "حدث خطأ." });
    console.error(e);
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = btnElement.dataset.originalText;
    }
  }
};

window.resolveReport = async (reportId, targetType, targetId, btnElement) => {
  if (btnElement && btnElement.disabled) return;
  const action = await showPromptModal({
    title: "إجراءات الإدارة",
    message: `الرجاء اختيار الإجراء:
- للتعليق: اكتب "hide" أو "remove"
- للمحتوى: اكتب "suspend"
- للمستخدم: اكتب "review"`,
    placeholder: "اكتب الإجراء هنا..."
  });
  if (!action) return;

  if (btnElement) {
    btnElement.dataset.originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }

  try {
    const { doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    let reasonText = "";
    if (targetType === "comment") {
      if (action === "hide") {
        await updateDoc(doc(db, "comments", targetId), { status: "hidden" });
        reasonText = `Hidden due to report ${reportId}`;
      } else if (action === "remove") {
        await updateDoc(doc(db, "comments", targetId), { status: "deleted" });
        reasonText = `Removed due to report ${reportId}`;
      }
    } else if (targetType === "content") {
      if (action === "suspend") {
        await updateDoc(doc(db, "posts", targetId), { status: "suspended" });
        reasonText = `Suspended due to report ${reportId}`;
      }
    } else if (targetType === "user") {
      if (action === "review") {
        await updateDoc(doc(db, "users", targetId), { status: "under_review" });
        reasonText = `Under review due to report ${reportId}`;
      }
    }

    await updateDoc(doc(db, "reports", reportId), { status: "resolved", updatedAt: serverTimestamp() });

    const { logAdminAction } = await import("./admin-core.js");
    await logAdminAction(
      "resolve_report",
      targetType,
      targetId,
      "حل البلاغ باتخاذ إجراء (" + action + ")",
      targetType,
      { reportId, appliedAction: action }
    );

    // Invalidate caches
    isReportTabLoaded["pending"] = false;
    isReportTabLoaded["reviewing"] = false;
    isReportTabLoaded["resolved"] = false;
    isReportTabLoaded["rejected"] = false;

    showToast({ type: "success", message: "تم اتخاذ الإجراء وحل الإبلاغ." });
    loadReports(false, true);
  } catch (e) {
    showToast({ type: "error", message: "حدث خطأ في تنفيذ الإجراء." });
    console.error(e);
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = btnElement.dataset.originalText;
    }
  }
};

// Tab buttons event listeners
document.querySelectorAll(".report-tab-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".report-tab-btn").forEach(b => {
      b.classList.remove("active", "text-red-600", "border-b-2", "border-red-600");
      b.classList.add("text-gray-500", "hover:text-gray-800");
    });
    e.target.classList.remove("text-gray-500", "hover:text-gray-800");
    e.target.classList.add("active", "text-red-600", "border-b-2", "border-red-600");

    document.getElementById("reports-table-pending")?.classList.add("hidden");
    document.getElementById("reports-table-reviewing")?.classList.add("hidden");
    document.getElementById("reports-table-resolved")?.classList.add("hidden");
    document.getElementById("reports-table-rejected")?.classList.add("hidden");

    currentReportStatus = e.target.dataset.status;
    document.getElementById("reports-table-" + currentReportStatus)?.classList.remove("hidden");

    const searchInput = document.getElementById("search-reports");
    if (searchInput) searchInput.value = "";

    loadReports(false);
  });
});

document.getElementById("report-filter-target-type")?.addEventListener("change", applyReportClientFilters);
document.getElementById("search-reports")?.addEventListener("input", applyReportClientFilters);
document.getElementById("btn-refresh-reports")?.addEventListener("click", () => loadReports(false, true));
document.getElementById("btn-load-reports")?.addEventListener("click", () => loadReports(true, false));
