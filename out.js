import { db } from "../../js/firebase-init.js";
import { showToast, showConfirmModal, showPromptModal } from "../../js/ui-utils.js";
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc, getCountFromServer, startAfter, getAggregateFromServer, sum, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
const viewList = document.getElementById("view-list");
const viewEditor = document.getElementById("view-editor");
const tableBody = document.getElementById("posts-table-body");
const loadingIndicator = document.getElementById("loading-indicator");
const postForm = document.getElementById("post-form");
const fId = document.getElementById("post-id");
const fTitle = document.getElementById("post-title");
const fSlug = document.getElementById("post-slug");
const fType = document.getElementById("post-type");
const fStatus = document.getElementById("post-status");
const fCover = document.getElementById("post-cover");
const fCategory = document.getElementById("post-category");
const fTagsInput = document.getElementById("post-tags-input");
const tagsContainer = document.getElementById("tags-container");
const fContentHtml = document.getElementById("post-content-html");
const fEmbedCode = document.getElementById("post-embed-code");
const fReadTime = document.getElementById("post-read-time");
const fSeoDesc = document.getElementById("post-seo-desc");
const fPublishAt = document.getElementById("post-publish-at");
const fUpdatedAt = document.getElementById("post-updated-at");
const fFeatured = document.getElementById("post-featured");
const btnPreview = document.getElementById("btn-preview-post");
let currentTags = [];
fTagsInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const tag = fTagsInput.value.trim().replace(/^,+|,+$/g, "");
    if (tag && !currentTags.includes(tag)) {
      currentTags.push(tag);
      renderTags();
    }
    fTagsInput.value = "";
  }
});
function renderTags() {
  tagsContainer.innerHTML = "";
  currentTags.forEach((tag) => {
    const el = document.createElement("span");
    el.className = "bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm flex items-center gap-1";
    el.innerHTML = `
      ${tag}
      <button type="button" class="text-red-500 hover:text-red-700" onclick="removeTag('${tag}')">&times;</button>
    `;
    tagsContainer.appendChild(el);
  });
}
window.removeTag = function(tag) {
  currentTags = currentTags.filter((t) => t !== tag);
  renderTags();
};
fType.addEventListener("change", () => {
  const type = fType.value;
  if (type === "video") {
    document.getElementById("field-embed-code").classList.remove("hidden");
    document.getElementById("field-read-time").classList.add("hidden");
  } else if (type === "news") {
    document.getElementById("field-embed-code").classList.add("hidden");
    document.getElementById("field-read-time").classList.add("hidden");
  } else {
    document.getElementById("field-embed-code").classList.add("hidden");
    document.getElementById("field-read-time").classList.remove("hidden");
  }
});
let currentPostsLoadToken = 0;
let lastDoc_Posts = null;
async function loadPosts(isLoadMore = false) {
  const token = ++currentPostsLoadToken;
  if (!isLoadMore) {
    loadingIndicator.classList.remove("hidden");
    tableBody.innerHTML = "";
    lastDoc_Posts = null;
  }
  try {
    const { limit, startAfter: startAfter2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [orderBy("createdAt", "desc"), limit(50)];
    if (isLoadMore && lastDoc_Posts) {
      constraints.push(startAfter2(lastDoc_Posts));
    }
    const q = query(collection(db, "posts"), ...constraints);
    const querySnapshot = await getDocs(q);
    if (token !== currentPostsLoadToken) return;
    loadingIndicator.classList.add("hidden");
    if (querySnapshot.empty && !isLoadMore) {
      tableBody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-folder-open text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u062D\u062A\u0648\u0649 \u062D\u0627\u0644\u064A\u0627\u064B</p></div></td></tr>`;
      document.getElementById("btn-load-posts-container")?.classList.add("hidden");
      return;
    }
    const renderedIds = /* @__PURE__ */ new Set();
    querySnapshot.forEach((docSnap) => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      const data = docSnap.data();
      if (document.getElementById("posts-table-body").querySelector(`tr[data-id="${id}"]`)) return;
      const tr = document.createElement("tr");
      tr.className = "border-b hover:bg-gray-50";
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-gray-900">${data.title}</td>
        <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">${data.type}</span></td>
        <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${data.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}">${data.status === "published" ? "\u0645\u0646\u0634\u0648\u0631" : "\u0645\u0633\u0648\u062F\u0629"}</span></td>
        <td class="px-6 py-4 text-gray-500">${data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString("ar-EG") : "-"}</td>
        <td class="px-6 py-4 text-sm font-medium">
          <button class="text-indigo-600 hover:text-indigo-900 ml-3 btn-edit" data-id="${id}">\u062A\u0639\u062F\u064A\u0644</button>
          <button class="text-red-600 hover:text-red-900 btn-delete" data-id="${id}">\u062D\u0630\u0641</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    if (querySnapshot.docs.length > 0) {
      lastDoc_Posts = querySnapshot.docs[querySnapshot.docs.length - 1];
    }
    if (querySnapshot.docs.length === 50) {
      document.getElementById("btn-load-posts-container")?.classList.remove("hidden");
    } else {
      document.getElementById("btn-load-posts-container")?.classList.add("hidden");
    }
    document.querySelectorAll(".btn-edit").forEach((btn) => btn.addEventListener("click", (e) => editPost(e.target.dataset.id)));
    document.querySelectorAll(".btn-delete").forEach((btn) => btn.addEventListener("click", (e) => deletePost(e.target.dataset.id, e.target)));
  } catch (error) {
    if (token !== currentPostsLoadToken) return;
    console.error("Error loading posts:", error);
    loadingIndicator.innerHTML = '<span class="text-red-500 font-bold p-4 block">\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. (\u062A\u0623\u0643\u062F \u0623\u0646\u0643 \u0623\u062F\u0645\u0646).</span>';
  }
}
function showEditor(isNew = true) {
  viewList.classList.add("hidden");
  viewEditor.classList.remove("hidden");
  document.getElementById("editor-title").textContent = isNew ? "\u0625\u0636\u0627\u0641\u0629 \u0645\u062D\u062A\u0648\u0649" : "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u062D\u062A\u0648\u0649";
  if (isNew) {
    postForm.reset();
    fId.value = "";
    currentTags = [];
    fUpdatedAt.textContent = "-";
    renderTags();
    fType.dispatchEvent(new Event("change"));
  }
}
function hideEditor() {
  viewEditor.classList.add("hidden");
  viewList.classList.remove("hidden");
}
async function editPost(id) {
  showEditor(false);
  try {
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      fId.value = docSnap.id;
      fTitle.value = data.title || "";
      fSlug.value = data.slug || "";
      fType.value = data.type || "story";
      fStatus.value = data.status || "draft";
      fCover.value = data.coverImage || "";
      fCategory.value = data.category || "";
      currentTags = Array.isArray(data.tags) ? data.tags : [];
      renderTags();
      fSeoDesc.value = data.seoDescription || "";
      fFeatured.checked = !!data.isFeatured;
      if (data.publishAt) {
        const d = data.publishAt.toDate();
        const pad = (n) => n.toString().padStart(2, "0");
        fPublishAt.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else {
        fPublishAt.value = "";
      }
      if (data.updatedAt) {
        fUpdatedAt.textContent = new Date(data.updatedAt.toDate()).toLocaleString("ar-EG");
      } else if (data.createdAt) {
        fUpdatedAt.textContent = new Date(data.createdAt.toDate()).toLocaleString("ar-EG");
      } else {
        fUpdatedAt.textContent = "-";
      }
      btnPreview.classList.remove("hidden");
      btnPreview.onclick = () => {
        window.open(`/${data.type}/${data.slug}?preview=true`, "_blank");
      };
      if (data.data) {
        fContentHtml.value = data.data.contentHtml || "";
        fEmbedCode.value = data.data.embedCode || "";
        fReadTime.value = data.data.readTimeMinutes || "";
      }
      fType.dispatchEvent(new Event("change"));
    }
  } catch (e) {
    showToast({ type: "error", message: "\u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
    console.error(e);
  }
}
async function deletePost(id, btnElement) {
  if (btnElement && btnElement.disabled) return;
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  if (await showConfirmModal({ title: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0630\u0641", message: "\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062D\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0646\u0647\u0627\u0626\u064A\u0627\u064B\u061F" })) {
    try {
      await deleteDoc(doc(db, "posts", id));
      loadPosts();
    } catch (e) {
      showToast({ type: "error", message: "\u0641\u0634\u0644 \u0627\u0644\u062D\u0630\u0641. \u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u062D\u0633\u0627\u0628\u0643 \u064A\u0645\u062A\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629." });
      console.error(e);
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = "\u062D\u0630\u0641";
      }
    }
  } else {
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = "\u062D\u0630\u0641";
    }
  }
}
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = fId.value || "doc_" + Date.now();
  let normalizedSlug = fSlug.value.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  fSlug.value = normalizedSlug;
  if (!normalizedSlug) {
    showToast({ type: "error", message: "\u0627\u0644\u0631\u0627\u0628\u0637 (Slug) \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0641\u0627\u0631\u063A\u0627\u064B." });
    return;
  }
  const btnSave = document.getElementById("btn-save");
  btnSave.textContent = "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642...";
  btnSave.disabled = true;
  try {
    const { collection: collection2, getDocs: getDocs2, query: query2, where: where2, doc: doc2, setDoc: setDoc2, serverTimestamp: serverTimestamp2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const q = query2(collection2(db, "posts"), where2("slug", "==", normalizedSlug));
    const snap = await getDocs2(q);
    let isDuplicate = false;
    snap.forEach((docSnap) => {
      if (docSnap.id !== id) {
        isDuplicate = true;
      }
    });
    if (isDuplicate) {
      showToast({ type: "error", title: "\u062A\u0646\u0628\u064A\u0647", message: "\u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 (Slug) \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644 \u0641\u064A \u0645\u0642\u0627\u0644 \u0622\u062E\u0631. \u064A\u0631\u062C\u0649 \u062A\u0639\u062F\u064A\u0644\u0647 \u0644\u064A\u0643\u0648\u0646 \u0641\u0631\u064A\u062F\u0627\u064B." });
      btnSave.textContent = "\u062D\u0641\u0638 \u0627\u0644\u0645\u062D\u062A\u0648\u0649";
      btnSave.disabled = false;
      return;
    }
    btnSave.textContent = "\u062C\u0627\u0631\u064A \u0627\u0644\u062D\u0641\u0638...";
    const postData = {
      id,
      slug: normalizedSlug,
      type: fType.value,
      category: fCategory.value,
      tags: currentTags,
      status: fStatus.value,
      title: fTitle.value,
      coverImage: fCover.value,
      seoDescription: fSeoDesc.value,
      isFeatured: fFeatured.checked,
      updatedAt: serverTimestamp2(),
      data: {
        contentHtml: fContentHtml.value
      }
    };
    if (fPublishAt.value) {
      postData.publishAt = new Date(fPublishAt.value);
    } else {
      postData.publishAt = null;
    }
    if (!fId.value) {
      postData.createdAt = serverTimestamp2();
    }
    if (fType.value === "video") {
      postData.data.embedCode = fEmbedCode.value;
    } else if (fType.value === "story") {
      postData.data.readTimeMinutes = parseInt(fReadTime.value) || 0;
    }
    await setDoc2(doc2(db, "posts", id), postData, { merge: true });
    hideEditor();
    loadPosts();
    showToast({ type: "success", message: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0628\u0646\u062C\u0627\u062D" });
    btnSave.textContent = "\u062D\u0641\u0638 \u0627\u0644\u0645\u062D\u062A\u0648\u0649";
    btnSave.disabled = false;
  } catch (error) {
    showToast({ type: "error", title: "\u062E\u0637\u0623", message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0641\u0638. \u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u062D\u0633\u0627\u0628\u0643 \u064A\u0645\u062A\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629." });
    console.error(error);
    btnSave.textContent = "\u062D\u0641\u0638 \u0627\u0644\u0645\u062D\u062A\u0648\u0649";
    btnSave.disabled = false;
  }
});
document.getElementById("btn-load-ads")?.addEventListener("click", () => loadAds(true));
document.getElementById("btn-load-audit")?.addEventListener("click", () => loadAuditAdmin(true));
document.getElementById("btn-load-reports")?.addEventListener("click", () => loadReports(true));
document.getElementById("btn-load-comments")?.addEventListener("click", () => loadCommentsAdmin(true));
document.getElementById("btn-load-users")?.addEventListener("click", () => loadUsersAdmin(true));
document.getElementById("btn-load-submissions")?.addEventListener("click", () => loadSubmissions(true));
document.getElementById("btn-load-posts")?.addEventListener("click", () => loadPosts(true));
document.getElementById("btn-new-post").addEventListener("click", () => showEditor(true));
document.getElementById("btn-back").addEventListener("click", hideEditor);
document.getElementById("btn-cancel").addEventListener("click", hideEditor);
import { auth } from "../../js/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
onAuthStateChanged(auth, (user) => {
  if (user) {
    const menuOverview2 = document.getElementById("menu-overview");
    if (menuOverview2) {
      menuOverview2.click();
    } else {
      loadPosts();
    }
  }
});
const menuPosts = document.getElementById("menu-posts");
const menuSubmissions = document.getElementById("menu-submissions");
const viewSubmissions = document.getElementById("view-submissions");
const viewSubmissionReader = document.getElementById("view-submission-reader");
const submissionsTableBody = document.getElementById("submissions-table-body");
const loadingIndicatorSub = document.getElementById("loading-indicator-sub");
let currentSubmission = null;
if (menuSubmissions) {
  menuSubmissions.addEventListener("click", () => {
    menuPosts.classList.remove("bg-gray-800", "text-white");
    menuPosts.classList.add("text-gray-300");
    menuSubmissions?.classList.add("bg-gray-800", "text-white");
    menuSubmissions?.classList.remove("text-gray-300");
    viewList.classList.add("hidden");
    viewEditor.classList.add("hidden");
    viewSubmissionReader.classList.add("hidden");
    viewSubmissions.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0645\u0631\u0627\u062C\u0639\u0629 \u0642\u0635\u0635 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u064A\u0646";
    document.getElementById("btn-new-post").classList.add("hidden");
    loadSubmissions();
  });
}
menuPosts.addEventListener("click", () => {
  menuSubmissions?.classList.remove("bg-gray-800", "text-white");
  menuSubmissions?.classList.add("text-gray-300");
  menuPosts.classList.add("bg-gray-800", "text-white");
  menuPosts.classList.remove("text-gray-300");
  viewSubmissions.classList.add("hidden");
  viewSubmissionReader.classList.add("hidden");
  viewEditor.classList.add("hidden");
  viewList.classList.remove("hidden");
  document.querySelector("header h2").textContent = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u0649";
  document.getElementById("btn-new-post").classList.remove("hidden");
  loadPosts();
});
let currentSubLoadToken = 0;
let lastDoc_Submissions = null;
async function loadSubmissions(isLoadMore = false) {
  const token = ++currentSubLoadToken;
  if (!isLoadMore) {
    loadingIndicatorSub.classList.remove("hidden");
    submissionsTableBody.innerHTML = "";
    lastDoc_Submissions = null;
  }
  try {
    const { collection: collection2, getDocs: getDocs2, query: query2, where: where2, orderBy: orderBy2, limit, startAfter: startAfter2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [where2("status", "==", "submitted"), orderBy2("createdAt", "asc"), limit(50)];
    if (isLoadMore && lastDoc_Submissions) {
      constraints.push(startAfter2(lastDoc_Submissions));
    }
    const q = query2(collection2(db, "user_submissions"), ...constraints);
    const snap = await getDocs2(q);
    if (token !== currentSubLoadToken) return;
    loadingIndicatorSub.classList.add("hidden");
    if (snap.empty && !isLoadMore) {
      submissionsTableBody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-inbox text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0634\u0627\u0631\u0643\u0627\u062A \u062C\u062F\u064A\u062F\u0629 \u062A\u062D\u062A\u0627\u062C \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629</p></div></td></tr>`;
      document.getElementById("btn-load-submissions-container")?.classList.add("hidden");
      return;
    }
    const renderedIds = /* @__PURE__ */ new Set();
    snap.forEach((docSnap) => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      const data = docSnap.data();
      if (document.getElementById("submissions-table-body").querySelector(`tr[data-id="${id}"]`)) return;
      const tr = document.createElement("tr");
      tr.className = "border-b hover:bg-gray-50 cursor-pointer btn-read-sub";
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-gray-900">${data.authorName || "\u0645\u062C\u0647\u0648\u0644"}</td>
        <td class="px-6 py-4">${data.title}</td>
        <td class="px-6 py-4 text-gray-500">${data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString("ar-EG") : "-"}</td>
        <td class="px-6 py-4 text-sm font-medium text-blue-600">\u0642\u0631\u0627\u0621\u0629 \u0648\u0645\u0631\u0627\u062C\u0639\u0629</td>
      `;
      submissionsTableBody.appendChild(tr);
    });
    if (snap.docs.length > 0) {
      lastDoc_Submissions = snap.docs[snap.docs.length - 1];
    }
    if (snap.docs.length === 50) {
      document.getElementById("btn-load-submissions-container")?.classList.remove("hidden");
    } else {
      document.getElementById("btn-load-submissions-container")?.classList.add("hidden");
    }
    document.querySelectorAll(".btn-read-sub").forEach((tr) => {
      tr.addEventListener("click", () => readSubmission(tr.dataset.id));
    });
  } catch (error) {
    if (token !== currentSubLoadToken) return;
    console.error("Error loading submissions:", error);
    loadingIndicatorSub.innerHTML = '<span class="text-red-500 font-bold p-4 block">\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. (\u062A\u0623\u0643\u062F \u0623\u0646\u0643 \u0623\u062F\u0645\u0646).</span>';
  }
}
async function readSubmission(id) {
  viewSubmissions.classList.add("hidden");
  viewSubmissionReader.classList.remove("hidden");
  document.getElementById("reader-content").innerHTML = "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...";
  try {
    const { doc: doc2, getDoc: getDoc2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const docRef = doc2(db, "user_submissions", id);
    const docSnap = await getDoc2(docRef);
    if (docSnap.exists()) {
      currentSubmission = { id, ...docSnap.data() };
      document.getElementById("reader-title").textContent = currentSubmission.title;
      document.getElementById("reader-author").textContent = "\u0628\u0648\u0627\u0633\u0637\u0629: " + (currentSubmission.authorName || "\u0645\u062C\u0647\u0648\u0644");
      const content = currentSubmission.content.replace(/\n/g, "<br>");
      document.getElementById("reader-content").innerHTML = content;
    }
  } catch (e) {
    console.error(e);
    showToast({ type: "error", message: "\u062D\u062F\u062B \u062E\u0637\u0623" });
  }
}
document.getElementById("btn-reader-back")?.addEventListener("click", () => {
  viewSubmissionReader.classList.add("hidden");
  viewSubmissions.classList.remove("hidden");
});
document.getElementById("btn-sub-approve")?.addEventListener("click", async () => {
  if (!currentSubmission) return;
  const btn = document.getElementById("btn-sub-approve");
  if (btn.disabled) return;
  if (await showConfirmModal({ title: "\u0646\u0634\u0631 \u0627\u0644\u0642\u0635\u0629", message: "\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0642\u0635\u0629 \u0648\u0646\u0634\u0631\u0647\u0627 \u0644\u0644\u0639\u0627\u0645\u0629\u061F", confirmColor: "green" })) {
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> \u062C\u0627\u0631\u064A \u0627\u0644\u0646\u0634\u0631...';
    try {
      const { doc: doc2, collection: collection2, serverTimestamp: serverTimestamp2, runTransaction } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await runTransaction(db, async (transaction) => {
        const subRef = doc2(db, "user_submissions", currentSubmission.id);
        const subDoc = await transaction.get(subRef);
        if (!subDoc.exists()) {
          throw new Error("NOT_FOUND");
        }
        const subData = subDoc.data();
        if (subData.status === "approved" || subData.publishedPostId) {
          throw new Error("ALREADY_APPROVED");
        }
        const postId = "story_" + Date.now();
        const postRef = doc2(db, "posts", postId);
        let slug = currentSubmission.title.trim().replace(/\s+/g, "-");
        slug += "-" + Math.floor(Math.random() * 1e3);
        const postData = {
          id: postId,
          slug,
          type: "story",
          status: "published",
          title: currentSubmission.title,
          coverImage: "",
          authorUid: currentSubmission.uid || null,
          createdAt: serverTimestamp2(),
          updatedAt: serverTimestamp2(),
          sourceSubmissionId: currentSubmission.id,
          data: {
            contentHtml: `<p><strong>\u0642\u0635\u0629 \u0645\u0631\u0633\u0644\u0629 \u0645\u0646: ${currentSubmission.authorName}</strong></p><p>${currentSubmission.content.replace(/\n/g, "</p><p>")}</p>`,
            readTimeMinutes: Math.ceil(currentSubmission.content.length / 1e3)
          }
        };
        transaction.set(postRef, postData);
        if (currentSubmission.uid) {
          const notifRef = doc2(collection2(db, "notifications"));
          transaction.set(notifRef, {
            userId: currentSubmission.uid,
            type: "story_approved",
            title: "\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0642\u0635\u062A\u0643",
            message: `\u062A\u0645 \u0646\u0634\u0631 \u0642\u0635\u062A\u0643 "${currentSubmission.title}".`,
            link: `/story/${postId}`,
            read: false,
            createdAt: serverTimestamp2()
          });
        }
        transaction.update(subRef, {
          status: "approved",
          publishedPostId: postId,
          updatedAt: serverTimestamp2()
        });
        const auditRef = doc2(collection2(db, "audit_logs"));
        transaction.set(auditRef, {
          adminUid: auth.currentUser.uid,
          action: "APPROVE_SUBMISSION",
          targetUid: currentSubmission.id,
          targetType: "user_submission",
          timestamp: serverTimestamp2(),
          metadata: { postId, title: currentSubmission.title }
        });
      });
      showToast({ type: "success", message: "\u062A\u0645 \u0627\u0644\u0646\u0634\u0631 \u0628\u0646\u062C\u0627\u062D!" });
      viewSubmissionReader.classList.add("hidden");
      viewSubmissions.classList.remove("hidden");
      loadSubmissions();
    } catch (e) {
      console.error(e);
      if (e.message === "ALREADY_APPROVED") {
        showToast({ type: "warning", message: "\u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u064A\u0647\u0627 \u0645\u0633\u0628\u0642\u0627\u064B." });
        viewSubmissionReader.classList.add("hidden");
        viewSubmissions.classList.remove("hidden");
        loadSubmissions();
      } else {
        showToast({ type: "error", message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0646\u0634\u0631." });
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
});
let pendingAction = null;
document.getElementById("btn-sub-needs-edit")?.addEventListener("click", () => {
  if (!currentSubmission) return;
  pendingAction = "edit";
  document.getElementById("action-reason-container").classList.remove("hidden");
  document.getElementById("reader-action-buttons").classList.add("hidden");
});
document.getElementById("btn-sub-reject")?.addEventListener("click", () => {
  if (!currentSubmission) return;
  pendingAction = "reject";
  document.getElementById("action-reason-container").classList.remove("hidden");
  document.getElementById("reader-action-buttons").classList.add("hidden");
});
document.getElementById("btn-cancel-action")?.addEventListener("click", () => {
  pendingAction = null;
  document.getElementById("action-reason-text").value = "";
  document.getElementById("action-reason-container").classList.add("hidden");
  document.getElementById("reader-action-buttons").classList.remove("hidden");
});
document.getElementById("btn-confirm-action")?.addEventListener("click", async () => {
  if (!currentSubmission || !pendingAction) return;
  const btn = document.getElementById("btn-confirm-action");
  if (btn.disabled) return;
  const reason = document.getElementById("action-reason-text").value.trim();
  if (!reason) {
    showToast({ type: "warning", message: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0633\u0628\u0628." });
    return;
  }
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> \u062C\u0627\u0631\u064A \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629...';
  try {
    const { doc: doc2, collection: collection2, serverTimestamp: serverTimestamp2, runTransaction } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let status, notifType, notifTitle, notifMsg;
    if (pendingAction === "edit") {
      status = "needs_edit";
      notifType = "story_rejected";
      notifTitle = "\u0642\u0635\u062A\u0643 \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u062A\u0639\u062F\u064A\u0644";
      notifMsg = `\u064A\u0631\u062C\u0649 \u0625\u062C\u0631\u0627\u0621 \u0628\u0639\u0636 \u0627\u0644\u062A\u0639\u062F\u064A\u0644\u0627\u062A \u0639\u0644\u0649 \u0642\u0635\u062A\u0643 "${currentSubmission.title}". \u0627\u0644\u0633\u0628\u0628: ${reason}`;
    } else {
      status = "rejected";
      notifType = "story_rejected";
      notifTitle = "\u062A\u0645 \u0631\u0641\u0636 \u0642\u0635\u062A\u0643";
      notifMsg = `\u0646\u0623\u0633\u0641\u060C \u0644\u0645 \u0646\u062A\u0645\u0643\u0646 \u0645\u0646 \u0642\u0628\u0648\u0644 \u0642\u0635\u062A\u0643 "${currentSubmission.title}". \u0627\u0644\u0633\u0628\u0628: ${reason}`;
    }
    await runTransaction(db, async (transaction) => {
      const subRef = doc2(db, "user_submissions", currentSubmission.id);
      const subDoc = await transaction.get(subRef);
      if (!subDoc.exists()) {
        throw new Error("NOT_FOUND");
      }
      const subData = subDoc.data();
      if (subData.status === status) {
        throw new Error("ALREADY_PROCESSED");
      }
      transaction.update(subRef, {
        status,
        rejectionReason: reason,
        updatedAt: serverTimestamp2()
      });
      if (currentSubmission.uid) {
        const notifRef = doc2(collection2(db, "notifications"));
        transaction.set(notifRef, {
          userId: currentSubmission.uid,
          type: notifType,
          title: notifTitle,
          message: notifMsg,
          read: false,
          createdAt: serverTimestamp2()
        });
      }
      const auditRef = doc2(collection2(db, "audit_logs"));
      transaction.set(auditRef, {
        adminUid: auth.currentUser.uid,
        action: pendingAction === "edit" ? "REQUEST_EDIT_SUBMISSION" : "REJECT_SUBMISSION",
        targetUid: currentSubmission.id,
        targetType: "user_submission",
        timestamp: serverTimestamp2(),
        metadata: { reason, title: currentSubmission.title }
      });
    });
    showToast({ type: "success", message: "\u062A\u0645 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0628\u0646\u062C\u0627\u062D." });
    pendingAction = null;
    document.getElementById("action-reason-text").value = "";
    document.getElementById("action-reason-container").classList.add("hidden");
    document.getElementById("reader-action-buttons").classList.remove("hidden");
    viewSubmissionReader.classList.add("hidden");
    viewSubmissions.classList.remove("hidden");
    loadSubmissions();
  } catch (e) {
    console.error(e);
    if (e.message === "ALREADY_PROCESSED") {
      showToast({ type: "warning", message: "\u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u0629 \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u0628\u0627\u0644\u0641\u0639\u0644." });
      viewSubmissionReader.classList.add("hidden");
      viewSubmissions.classList.remove("hidden");
      loadSubmissions();
    } else {
      showToast({ type: "error", message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0625\u062C\u0631\u0627\u0621." });
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});
const menuAds = document.getElementById("menu-ads");
const menuNotifications = document.getElementById("menu-notifications");
const viewAds = document.getElementById("view-ads");
const viewNotifications = document.getElementById("view-notifications");
function hideAllViews() {
  viewList.classList.add("hidden");
  viewEditor.classList.add("hidden");
  viewSubmissionReader.classList.add("hidden");
  viewSubmissions.classList.add("hidden");
  if (viewAds) viewAds.classList.add("hidden");
  if (viewNotifications) viewNotifications.classList.add("hidden");
  [menuPosts, menuSubmissions, menuAds, menuNotifications].forEach((m) => {
    if (m) {
      m.classList.remove("bg-gray-800", "text-white");
      m.classList.add("text-gray-300");
    }
  });
  document.getElementById("btn-new-post").classList.add("hidden");
}
if (menuAds) {
  menuAds.addEventListener("click", () => {
    hideAllViews();
    menuAds.classList.add("bg-gray-800", "text-white");
    menuAds.classList.remove("text-gray-300");
    viewAds.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A";
    loadAds();
  });
}
if (menuNotifications) {
  menuNotifications.addEventListener("click", () => {
    hideAllViews();
    menuNotifications.classList.add("bg-gray-800", "text-white");
    menuNotifications.classList.remove("text-gray-300");
    viewNotifications.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A";
  });
}
if (menuPosts) {
  menuPosts.addEventListener("click", () => {
    hideAllViews();
    menuPosts.classList.add("bg-gray-800", "text-white");
    menuPosts.classList.remove("text-gray-300");
    viewList.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u0649";
    document.getElementById("btn-new-post").classList.remove("hidden");
    loadPosts();
  });
}
if (menuSubmissions) {
  menuSubmissions.addEventListener("click", () => {
    hideAllViews();
    menuSubmissions?.classList.add("bg-gray-800", "text-white");
    menuSubmissions?.classList.remove("text-gray-300");
    viewSubmissions.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0645\u0631\u0627\u062C\u0639\u0629 \u0642\u0635\u0635 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u064A\u0646";
    loadSubmissions();
  });
}
const menuOverview = document.getElementById("menu-overview");
const menuUsers = document.getElementById("menu-users");
const menuComments = document.getElementById("menu-comments");
const menuAudit = document.getElementById("menu-audit");
const viewOverview = document.getElementById("view-overview");
const viewUsers = document.getElementById("view-users");
const viewComments = document.getElementById("view-comments");
const viewAudit = document.getElementById("view-audit");
const viewReports = document.getElementById("view-reports");
const menuReports = document.getElementById("menu-reports");
function overrideHideAllViews() {
  hideAllViews();
  if (viewOverview) viewOverview.classList.add("hidden");
  if (viewUsers) viewUsers.classList.add("hidden");
  if (viewComments) viewComments.classList.add("hidden");
  if (viewAudit) viewAudit.classList.add("hidden");
  if (viewReports) viewReports.classList.add("hidden");
  [menuOverview, menuUsers, menuComments, menuAudit, menuReports].forEach((m) => {
    if (m) {
      m.classList.remove("bg-gray-800", "text-white");
      m.classList.add("text-gray-300");
    }
  });
}
if (menuOverview) {
  menuOverview.addEventListener("click", () => {
    overrideHideAllViews();
    menuOverview.classList.add("bg-gray-800", "text-white");
    menuOverview.classList.remove("text-gray-300");
    viewOverview.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 (Overview)";
    loadOverviewData();
  });
}
if (menuUsers) {
  menuUsers.addEventListener("click", () => {
    overrideHideAllViews();
    menuUsers.classList.add("bg-gray-800", "text-white");
    menuUsers.classList.remove("text-gray-300");
    viewUsers.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 (Users)";
    loadUsersAdmin();
  });
}
if (menuComments) {
  menuComments.addEventListener("click", () => {
    overrideHideAllViews();
    menuComments.classList.add("bg-gray-800", "text-white");
    menuComments.classList.remove("text-gray-300");
    viewComments.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A (Comments)";
    loadCommentsAdmin();
  });
}
if (menuAudit) {
  menuAudit.addEventListener("click", () => {
    overrideHideAllViews();
    menuAudit.classList.add("bg-gray-800", "text-white");
    menuAudit.classList.remove("text-gray-300");
    viewAudit.classList.remove("hidden");
    document.querySelector("header h2").textContent = "\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 (Audit Logs)";
    loadAuditAdmin();
  });
}
let lastDoc_Users = null;
async function loadUsersAdmin(isLoadMore = false) {
  const tbody = document.getElementById("users-table-body");
  if (!isLoadMore) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...</td></tr>';
    lastDoc_Users = null;
  } else {
    document.getElementById("btn-load-users").textContent = "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...";
    document.getElementById("btn-load-users").disabled = true;
  }
  try {
    const { collection: collection2, getDocs: getDocs2, query: query2, orderBy: orderBy2, limit, startAfter: startAfter2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    let constraints = [orderBy2("createdAt", "desc"), limit(50)];
    if (isLoadMore && lastDoc_Users) {
      constraints.push(startAfter2(lastDoc_Users));
    }
    const snapshot = await getDocs2(query2(collection2(db, "users"), ...constraints));
    if (!isLoadMore) {
      tbody.innerHTML = "";
    }
    if (snapshot.empty && !isLoadMore) {
      tbody.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-users text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646</p></div></td></tr>`;
      document.getElementById("btn-load-users-container")?.classList.add("hidden");
      return;
    }
    const renderedIds = /* @__PURE__ */ new Set();
    snapshot.forEach((docSnap) => {
      const id = docSnap.id;
      if (renderedIds.has(id)) return;
      renderedIds.add(id);
      const data = docSnap.data();
      if (document.getElementById("users-table-body").querySelector(`tr[data-id="${id}"]`)) return;
      const tr = document.createElement("tr");
      tr.className = "border-b hover:bg-gray-50";
      tr.dataset.id = id;
      tr.innerHTML = `
        <td class="px-6 py-4">${data.displayName || "\u0628\u062F\u0648\u0646 \u0627\u0633\u0645"}</td>
        <td class="px-6 py-4" dir="ltr" style="text-align: right;">${data.email}</td>
        <td class="px-6 py-4">${data.role === "admin" ? '<span class="text-red-600 font-bold">Admin</span>' : "User"}</td>
        <td class="px-6 py-4">${data.status === "banned" ? '<span class="text-red-600">\u0645\u062D\u0638\u0648\u0631</span>' : '<span class="text-green-600">\u0646\u0634\u0637</span>'}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">
          ${data.status !== "banned" ? `<button class="text-red-600 hover:underline text-sm" onclick="banUser('${docSnap.id}')">\u062D\u0638\u0631</button>` : `<button class="text-green-600 hover:underline text-sm" onclick="unbanUser('${docSnap.id}')">\u0641\u0643 \u0627\u0644\u062D\u0638\u0631</button>`}
        </td>
      `;
      tbody.appendChild(tr);
    });
    if (snapshot.docs.length > 0) {
      lastDoc_Users = snapshot.docs[snapshot.docs.length - 1];
    }
    if (snapshot.docs.length === 50) {
      document.getElementById("btn-load-users-container")?.classList.remove("hidden");
    } else {
      document.getElementById("btn-load-users-container")?.classList.add("hidden");
    }
  } catch (e) {
    console.error("Error loading users:", e);
    if (!isLoadMore) tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">\u062D\u062F\u062B \u062E\u0637\u0623</td></tr>';
  } finally {
    if (isLoadMore) {
      document.getElementById("btn-load-users").textContent = "\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0632\u064A\u062F";
      document.getElementById("btn-load-users").disabled = false;
    }
  }
  window.changeUserStatus = async (uid, newStatus, btnElement) => {
    if (btnElement && btnElement.disabled) return;
    if (!await showConfirmModal({ title: "\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645", message: `\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0625\u0644\u0649 ${newStatus}\u061F` })) return;
    if (btnElement) {
      btnElement.dataset.originalText = btnElement.textContent;
      btnElement.disabled = true;
      btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    try {
      const { doc: doc2, updateDoc, addDoc, collection: collection2, serverTimestamp: serverTimestamp2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc2(db, "users", uid), { status: newStatus });
      await addDoc(collection2(db, "audit_logs"), {
        action: newStatus === "banned" ? "ban_user" : "unban_user",
        targetType: "user",
        targetId: uid,
        adminUid: auth.currentUser?.uid || "unknown",
        timestamp: serverTimestamp2()
      });
      loadUsersAdmin();
    } catch (e) {
      showToast({ type: "error", message: "\u062D\u062F\u062B \u062E\u0637\u0623." });
      console.error(e);
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = btnElement.dataset.originalText;
      }
    }
  };
  window.changeUserRole = async (uid, newRole, btnElement) => {
    if (btnElement && btnElement.disabled) return;
    if (!await showConfirmModal({ title: "\u062A\u063A\u064A\u064A\u0631 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645", message: `\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062A\u063A\u064A\u064A\u0631 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0625\u0644\u0649 ${newRole}\u061F` })) return;
    if (btnElement) {
      btnElement.dataset.originalText = btnElement.textContent;
      btnElement.disabled = true;
      btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    try {
      const { doc: doc2, updateDoc, addDoc, collection: collection2, serverTimestamp: serverTimestamp2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc2(db, "users", uid), { role: newRole });
      await addDoc(collection2(db, "audit_logs"), {
        action: "change_role",
        targetType: "user",
        targetId: uid,
        metadata: { newRole },
        adminUid: auth.currentUser?.uid || "unknown",
        timestamp: serverTimestamp2()
      });
      loadUsersAdmin();
    } catch (e) {
      showToast({ type: "error", message: "\u062D\u062F\u062B \u062E\u0637\u0623." });
      console.error(e);
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = btnElement.dataset.originalText;
      }
    }
  };
  let lastDoc_Comments = null;
  async function loadCommentsAdmin2(isLoadMore2 = false) {
    const tbody2 = document.getElementById("comments-table-body");
    if (!isLoadMore2) {
      tbody2.innerHTML = '<tr><td colspan="5" class="text-center p-4">\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...</td></tr>';
      lastDoc_Comments = null;
    } else {
      document.getElementById("btn-load-comments").textContent = "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...";
      document.getElementById("btn-load-comments").disabled = true;
    }
    try {
      const { collection: collection2, getDocs: getDocs2, query: query2, orderBy: orderBy2, limit, startAfter: startAfter2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      let constraints = [orderBy2("createdAt", "desc"), limit(50)];
      if (isLoadMore2 && lastDoc_Comments) {
        constraints.push(startAfter2(lastDoc_Comments));
      }
      const snapshot = await getDocs2(query2(collection2(db, "comments"), ...constraints));
      if (!isLoadMore2) {
        tbody2.innerHTML = "";
      }
      if (snapshot.empty && !isLoadMore2) {
        tbody2.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-comments text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0639\u0644\u064A\u0642\u0627\u062A</p></div></td></tr>`;
        document.getElementById("btn-load-comments-container")?.classList.add("hidden");
        return;
      }
      const renderedIds = /* @__PURE__ */ new Set();
      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        if (renderedIds.has(id)) return;
        renderedIds.add(id);
        const data = docSnap.data();
        if (document.getElementById("comments-table-body").querySelector(`tr[data-id="${id}"]`)) return;
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-gray-50";
        tr.dataset.id = id;
        tr.innerHTML = `
        <td class="px-6 py-4">${data.authorName}</td>
        <td class="px-6 py-4">${data.contentId}</td>
        <td class="px-6 py-4 truncate max-w-xs" title="${data.text}">${data.text}</td>
        <td class="px-6 py-4">${data.status === "visible" ? '<span class="text-green-600">\u0645\u0631\u0626\u064A</span>' : '<span class="text-red-600">\u0645\u062E\u0641\u064A/\u0645\u062D\u0630\u0648\u0641</span>'}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">
          <button class="text-red-600 hover:underline text-sm" onclick="moderateComment('${docSnap.id}', 'deleted', this)">\u062D\u0630\u0641</button>
          <button class="text-green-600 hover:underline text-sm" onclick="moderateComment('${docSnap.id}', 'visible', this)">\u0625\u0638\u0647\u0627\u0631</button>
        </td>
      `;
        tbody2.appendChild(tr);
      });
      if (snapshot.docs.length > 0) {
        lastDoc_Comments = snapshot.docs[snapshot.docs.length - 1];
      }
      if (snapshot.docs.length === 50) {
        document.getElementById("btn-load-comments-container")?.classList.remove("hidden");
      } else {
        document.getElementById("btn-load-comments-container")?.classList.add("hidden");
      }
    } catch (e) {
      console.error("Error loading comments:", e);
      if (!isLoadMore2) tbody2.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">\u062D\u062F\u062B \u062E\u0637\u0623</td></tr>';
    } finally {
      if (isLoadMore2) {
        document.getElementById("btn-load-comments").textContent = "\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0632\u064A\u062F";
        document.getElementById("btn-load-comments").disabled = false;
      }
    }
    window.moderateComment = async (commentId, newStatus, btnElement) => {
      if (btnElement && btnElement.disabled) return;
      if (!await showConfirmModal({ title: "\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0642", message: "\u062A\u0623\u0643\u064A\u062F \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u061F" })) return;
      if (btnElement) {
        btnElement.dataset.originalText = btnElement.textContent;
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      }
      try {
        const { doc: doc2, updateDoc, addDoc, collection: collection2, serverTimestamp: serverTimestamp2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await updateDoc(doc2(db, "comments", commentId), { status: newStatus });
        await addDoc(collection2(db, "audit_logs"), {
          action: newStatus === "deleted" ? "delete_comment" : "approve_comment",
          targetType: "comment",
          targetId: commentId,
          adminUid: auth.currentUser?.uid || "unknown",
          timestamp: serverTimestamp2()
        });
        loadCommentsAdmin2();
      } catch (e) {
        showToast({ type: "error", message: "\u062D\u062F\u062B \u062E\u0637\u0623." });
        console.error(e);
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.textContent = btnElement.dataset.originalText;
        }
      }
    };
    let lastDoc_Audit = null;
    async function loadAuditAdmin2(isLoadMore3 = false) {
      const tbody3 = document.getElementById("audit-table-body");
      if (!isLoadMore3) {
        tbody3.innerHTML = '<tr><td colspan="5" class="text-center p-4">\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...</td></tr>';
        lastDoc_Audit = null;
      } else {
        document.getElementById("btn-load-audit").textContent = "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...";
        document.getElementById("btn-load-audit").disabled = true;
      }
      try {
        const { collection: collection2, getDocs: getDocs2, query: query2, orderBy: orderBy2, limit, startAfter: startAfter2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        let constraints = [orderBy2("timestamp", "desc"), limit(50)];
        if (isLoadMore3 && lastDoc_Audit) {
          constraints.push(startAfter2(lastDoc_Audit));
        }
        const snapshot = await getDocs2(query2(collection2(db, "audit_logs"), ...constraints));
        if (!isLoadMore3) {
          tbody3.innerHTML = "";
        }
        if (snapshot.empty && !isLoadMore3) {
          tbody3.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-clipboard-list text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">\u0644\u0627 \u062A\u0648\u062C\u062F \u0633\u062C\u0644\u0627\u062A \u0646\u0634\u0627\u0637</p></div></td></tr>`;
          document.getElementById("btn-load-audit-container")?.classList.add("hidden");
          return;
        }
        const renderedIds = /* @__PURE__ */ new Set();
        snapshot.forEach((docSnap) => {
          const id = docSnap.id;
          if (renderedIds.has(id)) return;
          renderedIds.add(id);
          const data = docSnap.data();
          if (document.getElementById("audit-table-body").querySelector(`tr[data-id="${id}"]`)) return;
          const tr = document.createElement("tr");
          tr.className = "border-b hover:bg-gray-50 text-sm";
          tr.dataset.id = id;
          tr.innerHTML = `
        <td class="px-6 py-4">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString("ar-EG") : "-"}</td>
        <td class="px-6 py-4" dir="ltr" style="text-align: right; font-size: 0.75rem;">${data.adminUid}</td>
        <td class="px-6 py-4 font-bold text-gray-700">${data.action}</td>
        <td class="px-6 py-4">${data.targetType}: <span dir="ltr" class="text-xs text-gray-500">${data.targetUid || data.targetId || "-"}</span></td>
        <td class="px-6 py-4 text-gray-500">${data.metadata ? JSON.stringify(data.metadata) : "-"}</td>
      `;
          tbody3.appendChild(tr);
        });
        if (snapshot.docs.length > 0) {
          lastDoc_Audit = snapshot.docs[snapshot.docs.length - 1];
        }
        if (snapshot.docs.length === 50) {
          document.getElementById("btn-load-audit-container")?.classList.remove("hidden");
        } else {
          document.getElementById("btn-load-audit-container")?.classList.add("hidden");
        }
      } catch (e) {
        console.error("Error loading audit:", e);
        if (!isLoadMore3) tbody3.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">\u062D\u062F\u062B \u062E\u0637\u0623</td></tr>';
      } finally {
        if (isLoadMore3) {
          document.getElementById("btn-load-audit").textContent = "\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0632\u064A\u062F";
          document.getElementById("btn-load-audit").disabled = false;
        }
      }
      async function loadAds2() {
        const tbody4 = document.getElementById("ads-table-body");
        tbody4.innerHTML = '<tr><td colspan="4" class="text-center p-4">\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...</td></tr>';
        try {
          const { collection: collection2, getDocs: getDocs2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
          const querySnapshot = await getDocs2(collection2(db, "ads_templates"));
          tbody4.innerHTML = "";
          if (querySnapshot.empty) {
            tbody4.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-bullhorn text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0639\u0644\u0627\u0646\u0627\u062A</p></div></td></tr>`;
            return;
          }
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (document.getElementById("ads-table-body").querySelector(`tr[data-id="${id}"]`)) return;
            const id = docSnap.id;
            const tr = document.createElement("tr");
            tr.className = "border-b hover:bg-gray-50";
            tr.dataset.id = id;
            tr.innerHTML = `
        <td class="p-3"><img src="${data.image}" class="h-12 w-20 object-cover rounded"></td>
        <td class="p-3">${data.text || "-"}</td>
        <td class="p-3">
          <span class="px-2 py-1 rounded text-xs text-white ${data.isActive ? "bg-green-600" : "bg-red-600"}">
            ${data.isActive ? "\u0645\u0641\u0639\u0644" : "\u0645\u0639\u0637\u0644"}
          </span>
        </td>
        <td class="p-3">
          <button class="text-indigo-600 hover:text-indigo-900 ml-3 btn-edit-ad" data-id="${id}">\u062A\u0639\u062F\u064A\u0644</button>
          <button class="text-red-600 hover:text-red-900 btn-delete-ad" data-id="${id}">\u062D\u0630\u0641</button>
        </td>
      `;
            tbody4.appendChild(tr);
          });
          document.querySelectorAll(".btn-edit-ad").forEach((btn) => btn.addEventListener("click", async (e) => {
            const id = e.target.dataset.id;
            const { doc: doc2, getDoc: getDoc2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const docSnap = await getDoc2(doc2(db, "ads_templates", id));
            if (docSnap.exists()) {
              const d = docSnap.data();
              document.getElementById("ad-id").value = id;
              document.getElementById("ad-image").value = d.image;
              document.getElementById("ad-link").value = d.link;
              document.getElementById("ad-text").value = d.text || "";
              document.getElementById("ad-active").checked = d.isActive;
            }
          }));
          document.querySelectorAll(".btn-delete-ad").forEach((btn) => btn.addEventListener("click", async (e) => {
            if (await showConfirmModal({ title: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0630\u0641", message: "\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u062D\u0630\u0641\u061F" })) {
              const { doc: doc2, deleteDoc: deleteDoc2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
              await deleteDoc2(doc2(db, "ads_templates", e.target.dataset.id));
              loadAds2();
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
          isActive: document.getElementById("ad-active").checked
        };
        try {
          const { doc: doc2, setDoc: setDoc2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
          await setDoc2(doc2(db, "ads_templates", id), data);
          document.getElementById("ad-form").reset();
          document.getElementById("ad-id").value = "";
          loadAds2();
        } catch (err) {
          showToast({ type: "error", message: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062D\u0641\u0638" });
        }
      });
      document.getElementById("notif-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = document.getElementById("notif-text").value;
        const link = document.getElementById("notif-link").value;
        const image = document.getElementById("notif-image").value;
        const btn = document.getElementById("btn-send-notif");
        btn.disabled = true;
        btn.textContent = "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u0631\u0633\u0627\u0644...";
        try {
          const { collection: collection2, addDoc, serverTimestamp: serverTimestamp2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
          await addDoc(collection2(db, "notifications"), {
            userId: "all",
            type: "admin_announcement",
            title: "\u0625\u0639\u0644\u0627\u0646 \u0625\u062F\u0627\u0631\u064A \u062C\u062F\u064A\u062F",
            message: text,
            link,
            image,
            readBy: [],
            createdAt: serverTimestamp2()
          });
          document.getElementById("notif-form").reset();
          const st = document.getElementById("notif-status");
          st.textContent = "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646!";
          st.classList.remove("hidden");
          setTimeout(() => st.classList.add("hidden"), 5e3);
        } catch (err) {
          showToast({ type: "error", message: "\u062E\u0637\u0623 \u0641\u064A \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631" });
        } finally {
          btn.disabled = false;
          btn.textContent = "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631 \u0627\u0644\u0622\u0646";
        }
      });
      if (menuReports) {
        menuReports.addEventListener("click", () => {
          overrideHideAllViews();
          menuReports.classList.add("bg-gray-800", "text-white");
          menuReports.classList.remove("text-gray-300");
          if (viewReports) viewReports.classList.remove("hidden");
          document.querySelector("header h2").textContent = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0628\u0644\u064A\u063A\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629";
          loadReports2();
        });
      }
      document.getElementById("btn-load-reports").addEventListener("click", loadReports2);
      let lastDoc_Reports = null;
      async function loadReports2(isLoadMore4 = false) {
        const tbody4 = document.getElementById("reports-table-body");
        const loading = document.getElementById("loading-indicator-reports");
        const statusFilter = document.getElementById("report-filter-status").value;
        if (!isLoadMore4) {
          tbody4.innerHTML = "";
          loading.classList.remove("hidden");
          lastDoc_Reports = null;
        } else {
          document.getElementById("btn-load-reports").textContent = "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...";
          document.getElementById("btn-load-reports").disabled = true;
        }
        try {
          const { collection: collection2, getDocs: getDocs2, query: query2, where: where2, orderBy: orderBy2, limit, startAfter: startAfter2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
          let constraints = [where2("status", "==", statusFilter), orderBy2("createdAt", "desc"), limit(50)];
          if (isLoadMore4 && lastDoc_Reports) {
            constraints.push(startAfter2(lastDoc_Reports));
          }
          const q = query2(collection2(db, "reports"), ...constraints);
          const snap = await getDocs2(q);
          if (!isLoadMore4) {
            loading.classList.add("hidden");
          }
          if (snap.empty && !isLoadMore4) {
            tbody4.innerHTML = `<tr><td colspan="100%" class="px-6 py-12 text-center"><div class="flex flex-col items-center justify-center text-gray-500"><i class="fa-solid fa-flag text-4xl mb-3 text-gray-300"></i><p class="text-lg font-medium text-gray-600">\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0628\u0644\u0627\u063A\u0627\u062A \u0628\u0647\u0630\u0647 \u0627\u0644\u062D\u0627\u0644\u0629</p></div></td></tr>`;
            document.getElementById("btn-load-reports-container")?.classList.add("hidden");
            return;
          }
          const renderedIds = /* @__PURE__ */ new Set();
          snap.forEach((docSnap) => {
            const id = docSnap.id;
            if (renderedIds.has(id)) return;
            renderedIds.add(id);
            const data = docSnap.data();
            if (document.getElementById("reports-table-body").querySelector(`tr[data-id="${id}"]`)) return;
            let actionHtml = "";
            if (data.status === "pending") {
              actionHtml = `
          <button class="text-blue-600 hover:underline text-sm" onclick="updateReportStatus('${id}', 'reviewing', this)">\u0628\u062F\u0621 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629</button>
          <button class="text-red-600 hover:underline text-sm" onclick="updateReportStatus('${id}', 'rejected', this)">\u0631\u0641\u0636 \u0643\u0627\u0630\u0628</button>
        `;
            } else if (data.status === "reviewing") {
              actionHtml = `
          <button class="text-green-600 hover:underline text-sm font-bold" onclick="resolveReport('${id}', '${data.targetType}', '${data.targetId}', this)">\u0627\u062A\u062E\u0627\u0630 \u0625\u062C\u0631\u0627\u0621 (\u062D\u0630\u0641)</button>
          <button class="text-red-600 hover:underline text-sm" onclick="updateReportStatus('${id}', 'rejected', this)">\u0631\u0641\u0636 \u0643\u0627\u0630\u0628</button>
        `;
            } else {
              actionHtml = '<span class="text-gray-400 text-sm">\u062A\u0645\u062A \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629</span>';
            }
            const tr = document.createElement("tr");
            tr.className = "border-b hover:bg-gray-50";
            tr.dataset.id = id;
            tr.innerHTML = `
        <td class="px-6 py-4 text-sm">${data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleString("ar-EG") : "-"}</td>
        <td class="px-6 py-4">${data.targetType}</td>
        <td class="px-6 py-4" dir="ltr" style="text-align: right; font-size: 0.8rem;">${data.reporterId}</td>
        <td class="px-6 py-4">${data.reason}</td>
        <td class="px-6 py-4">${data.status}</td>
        <td class="px-6 py-4 space-x-2 space-x-reverse">${actionHtml}</td>
      `;
            tbody4.appendChild(tr);
          });
          if (snap.docs.length > 0) {
            lastDoc_Reports = snap.docs[snap.docs.length - 1];
          }
          if (snap.docs.length === 50) {
            document.getElementById("btn-load-reports-container")?.classList.remove("hidden");
          } else {
            document.getElementById("btn-load-reports-container")?.classList.add("hidden");
          }
        } catch (e) {
          console.error("Error loading reports", e);
          if (!isLoadMore4) loading.innerHTML = '<span class="text-red-500">\u062D\u062F\u062B \u062E\u0637\u0623</span>';
        } finally {
          if (isLoadMore4) {
            document.getElementById("btn-load-reports").textContent = "\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0632\u064A\u062F";
            document.getElementById("btn-load-reports").disabled = false;
          }
        }
        window.updateReportStatus = async (reportId, newStatus, btnElement) => {
          if (btnElement && btnElement.disabled) return;
          if (!await showConfirmModal({ title: "\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u0625\u0628\u0644\u0627\u063A", message: `\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629 \u0625\u0644\u0649 ${newStatus}\u061F` })) return;
          if (btnElement) {
            btnElement.dataset.originalText = btnElement.textContent;
            btnElement.disabled = true;
            btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          }
          try {
            const { doc: doc2, updateDoc, addDoc, collection: collection2, serverTimestamp: serverTimestamp2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await updateDoc(doc2(db, "reports", reportId), { status: newStatus, updatedAt: serverTimestamp2() });
            await addDoc(collection2(db, "audit_logs"), {
              action: "update_report_status",
              targetType: "report",
              targetId: reportId,
              metadata: { newStatus },
              adminUid: "admin_ui",
              timestamp: serverTimestamp2()
            });
            loadReports2();
          } catch (e) {
            showToast({ type: "error", message: "\u062D\u062F\u062B \u062E\u0637\u0623." });
            console.error(e);
            if (btnElement) {
              btnElement.disabled = false;
              btnElement.textContent = btnElement.dataset.originalText;
            }
          }
        };
        window.resolveReport = async (reportId, targetType, targetId, btnElement) => {
          if (btnElement && btnElement.disabled) return;
          const action = await showPromptModal({ title: "\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629", message: '\u0627\u0644\u0631\u062C\u0627\u0621 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0625\u062C\u0631\u0627\u0621:\n- \u0644\u0644\u062A\u0639\u0644\u064A\u0642: \u0627\u0643\u062A\u0628 "hide" \u0623\u0648 "remove"\n- \u0644\u0644\u0645\u062D\u062A\u0648\u0649: \u0627\u0643\u062A\u0628 "suspend"\n- \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645: \u0627\u0643\u062A\u0628 "review"', placeholder: "\u0627\u0643\u062A\u0628 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0647\u0646\u0627..." });
          if (!action) return;
          if (btnElement) {
            btnElement.dataset.originalText = btnElement.textContent;
            btnElement.disabled = true;
            btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          }
          try {
            const { doc: doc2, updateDoc, addDoc, collection: collection2, serverTimestamp: serverTimestamp2 } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const { auth: auth2 } = await import("../../js/firebase-init.js");
            let reasonText = "";
            if (targetType === "comment") {
              if (action === "hide") {
                await updateDoc(doc2(db, "comments", targetId), { status: "hidden" });
                reasonText = `Hidden due to report ${reportId}`;
              } else if (action === "remove") {
                await updateDoc(doc2(db, "comments", targetId), { status: "deleted" });
                reasonText = `Removed due to report ${reportId}`;
              }
            } else if (targetType === "content") {
              if (action === "suspend") {
                await updateDoc(doc2(db, "posts", targetId), { status: "suspended" });
                reasonText = `Suspended due to report ${reportId}`;
              }
            } else if (targetType === "user") {
              if (action === "review") {
                await updateDoc(doc2(db, "users", targetId), { status: "under_review" });
                reasonText = `Under review due to report ${reportId}`;
              }
            }
            await updateDoc(doc2(db, "reports", reportId), { status: "resolved", updatedAt: serverTimestamp2() });
            await addDoc(collection2(db, "audit_logs"), {
              action: "resolve_report",
              targetType,
              targetId,
              metadata: { reportId, appliedAction: action },
              adminUid: auth2.currentUser?.uid || "unknown",
              timestamp: serverTimestamp2()
            });
            showToast({ type: "success", message: "\u062A\u0645 \u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0648\u062D\u0644 \u0627\u0644\u0625\u0628\u0644\u0627\u063A." });
            loadReports2();
          } catch (e) {
            showToast({ type: "error", message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0625\u062C\u0631\u0627\u0621." });
            console.error(e);
            if (btnElement) {
              btnElement.disabled = false;
              btnElement.textContent = btnElement.dataset.originalText;
            }
          }
        };
        const periodSelect = document.getElementById("overview-period");
        if (periodSelect) {
          periodSelect.addEventListener("change", loadOverviewData2);
        }
        async function loadOverviewData2() {
          const period = document.getElementById("overview-period").value;
          let startDate = null;
          if (period !== "all") {
            startDate = /* @__PURE__ */ new Date();
            if (period === "today") {
              startDate.setHours(0, 0, 0, 0);
            } else if (period === "7days") {
              startDate.setDate(startDate.getDate() - 7);
            } else if (period === "30days") {
              startDate.setDate(startDate.getDate() - 30);
            }
          }
          const getQ = (colName, statusField, statusVal) => {
            let constraints = [];
            if (statusField && statusVal) {
              constraints.push(where(statusField, "==", statusVal));
            }
            if (startDate) {
              constraints.push(where("createdAt", ">=", startDate));
              let dir = "desc";
              if (colName === "user_submissions") {
                dir = "asc";
              }
              constraints.push(orderBy("createdAt", dir));
            }
            return query(collection(db, colName), ...constraints);
          };
          try {
            const uiMetrics = ["users", "posts", "submissions", "comments", "reports", "views", "likes"];
            uiMetrics.forEach((m) => document.getElementById("stat-" + m).innerHTML = '<i class="fas fa-spinner fa-spin text-sm text-gray-400"></i>');
            document.getElementById("chart-types-loading").classList.remove("hidden");
            document.getElementById("chart-types-container").classList.add("hidden");
            try {
              const usersSnap = await getCountFromServer(getQ("users"));
              document.getElementById("stat-users").textContent = usersSnap.data().count;
            } catch (e) {
              document.getElementById("stat-users").textContent = "-";
              console.log("Users count error:", e.message);
            }
            try {
              const subSnap = await getCountFromServer(getQ("user_submissions", "status", "submitted"));
              document.getElementById("stat-submissions").textContent = subSnap.data().count;
            } catch (e) {
              document.getElementById("stat-submissions").textContent = "-";
              console.log("Submissions count error:", e.message);
            }
            try {
              const commSnap = await getCountFromServer(getQ("comments"));
              document.getElementById("stat-comments").textContent = commSnap.data().count;
            } catch (e) {
              document.getElementById("stat-comments").textContent = "-";
              console.log("Comments count error:", e.message);
            }
            try {
              const repSnap = await getCountFromServer(getQ("reports"));
              document.getElementById("stat-reports").textContent = repSnap.data().count;
            } catch (e) {
              document.getElementById("stat-reports").textContent = "-";
              console.log("Reports count error:", e.message);
            }
            try {
              const qPosts = getQ("posts", "status", "published");
              const [aggSnap, totalPostsSnap] = await Promise.all([
                getAggregateFromServer(qPosts, {
                  views: sum("views"),
                  likes: sum("likesCount")
                }),
                getCountFromServer(qPosts)
              ]);
              let totalPosts = totalPostsSnap.data().count;
              let totalViews = aggSnap.data().views || 0;
              let totalLikes = aggSnap.data().likes || 0;
              let typeCounts = { story: 0, news: 0, video: 0 };
              const getQType = (typeVal) => {
                let constraints = [where("status", "==", "published"), where("type", "==", typeVal)];
                if (startDate) {
                  constraints.push(where("createdAt", ">=", startDate));
                  constraints.push(orderBy("createdAt", "desc"));
                }
                return query(collection(db, "posts"), ...constraints);
              };
              const [storySnap, newsSnap, videoSnap] = await Promise.all([
                getCountFromServer(getQType("story")),
                getCountFromServer(getQType("news")),
                getCountFromServer(getQType("video"))
              ]);
              typeCounts.story = storySnap.data().count;
              typeCounts.news = newsSnap.data().count;
              typeCounts.video = videoSnap.data().count;
              document.getElementById("stat-posts").textContent = totalPosts;
              document.getElementById("stat-views").textContent = totalViews;
              document.getElementById("stat-likes").textContent = totalLikes;
              document.getElementById("count-story").textContent = typeCounts.story;
              document.getElementById("count-news").textContent = typeCounts.news;
              document.getElementById("count-video").textContent = typeCounts.video;
              let pStory = totalPosts === 0 ? 0 : typeCounts.story / totalPosts * 100;
              let pNews = totalPosts === 0 ? 0 : typeCounts.news / totalPosts * 100;
              let pVideo = totalPosts === 0 ? 0 : typeCounts.video / totalPosts * 100;
              document.getElementById("bar-story").style.width = pStory + "%";
              document.getElementById("bar-news").style.width = pNews + "%";
              document.getElementById("bar-video").style.width = pVideo + "%";
              document.getElementById("chart-types-loading").classList.add("hidden");
              document.getElementById("chart-types-container").classList.remove("hidden");
            } catch (e) {
              document.getElementById("stat-posts").textContent = "-";
              document.getElementById("stat-views").textContent = "-";
              document.getElementById("stat-likes").textContent = "-";
              console.log("Posts fetch error:", e.message);
            }
          } catch (error) {
            console.error("Overview error", error);
          }
        }
      }
    }
  }
}
