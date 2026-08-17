import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, doc, getDoc, setDoc, deleteDoc, updateDoc,
  query, where, orderBy, getDocs, addDoc, serverTimestamp, runTransaction, limit, startAfter, increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Extract slug and type for current page
const urlParts = window.location.pathname.split('/').filter(p => p);
const contentType = urlParts.length > 1 ? urlParts[0] : 'home';
const contentId = urlParts.length > 1 ? urlParts[urlParts.length - 1].replace('.html', '') : 'home'; // slug

const btnLike = document.getElementById('btn-like');
const likeIcon = document.getElementById('like-icon');
const likesCountEl = document.getElementById('likes-count');
const viewsCountEl = document.getElementById('views-count');
const commentsCountEl = document.getElementById('comments-count');

const btnSavePost = document.getElementById('btn-save-post');
const saveIcon = document.getElementById('save-icon');

const commentFormContainer = document.getElementById('comment-form-container');
const loginPrompt = document.getElementById('login-prompt');
const commentForm = document.getElementById('comment-form');
const commentsList = document.getElementById('comments-list');

let currentUser = null;
let currentUserProfile = null;
let hasLiked = false;
let hasSaved = false;
let lastCommentDoc = null;
const COMMENTS_LIMIT = 10;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        currentUserProfile = docSnap.data();
        if (currentUserProfile.accountStatus === 'banned' || currentUserProfile.accountStatus === 'deleted') {
          currentUser = null;
        } else {
          currentUser = user;
        }
      }
    } catch (e) {
      console.warn("Could not fetch user profile:", e);
      currentUser = user;
    }
  } else {
    currentUser = null;
  }
  
  if (currentUser) {
    if(commentFormContainer) commentFormContainer.classList.remove('hidden');
    if(loginPrompt) loginPrompt.classList.add('hidden');
    checkLikeStatus();
    checkSaveStatus();
    recordHistorySafe();
  } else {
    if(commentFormContainer) commentFormContainer.classList.add('hidden');
    if(loginPrompt) loginPrompt.classList.remove('hidden');
  }
  
  loadStats();
  loadComments();
  recordViewSafe();
});

async function checkLikeStatus() {
  if (!currentUser || contentId === 'home') return;
  const likeRef = doc(db, 'content_likes', `${contentId}_${currentUser.uid}`);
  try {
    const snap = await getDoc(likeRef);
    hasLiked = snap.exists();
  } catch (e) {
    console.warn("Could not fetch like status:", e);
    hasLiked = false;
  }
  updateLikeUI();
}

function updateLikeUI() {
  if(!likeIcon) return;
  if (hasLiked) {
    likeIcon.style.color = '#e50914';
  } else {
    likeIcon.style.color = '#aaa';
  }
}

async function checkSaveStatus() {
  if (!currentUser || contentId === 'home' || !btnSavePost) return;
  try {
    const q = query(
      collection(db, 'user_bookmarks'), 
      where('userId', '==', currentUser.uid), 
      where('contentId', '==', contentId)
    );
    const snap = await getDocs(q);
    hasSaved = !snap.empty;
  } catch (e) {
    // Silently handle permission errors if rules are not updated yet
    hasSaved = false;
  }
  updateSaveUI();
}

function updateSaveUI() {
  if(!saveIcon) return;
  if (hasSaved) {
    saveIcon.classList.remove('far');
    saveIcon.classList.add('fas');
    saveIcon.style.color = '#3b82f6'; // blue-500
  } else {
    saveIcon.classList.remove('fas');
    saveIcon.classList.add('far');
    saveIcon.style.color = '#aaa';
  }
}

async function recordHistorySafe() {
  if (!currentUser || contentId === 'home') return;
  
  // Throttle history updates to once per session per article to avoid spamming
  const historyKey = `history_${contentId}`;
  if (!sessionStorage.getItem(historyKey)) {
    sessionStorage.setItem(historyKey, 'true');
    try {
      const title = document.title.split(' - ')[0] || 'مقال';
      const coverImg = document.getElementById('article-cover-image');
      const image = coverImg ? coverImg.src : '';
      const historyRef = doc(db, 'user_history', `${currentUser.uid}_${contentId}`);
      await setDoc(historyRef, {
        userId: currentUser.uid,
        contentId: contentId,
        contentType: contentType,
        title: title,
        image: image,
        viewedAt: serverTimestamp()
      }, { merge: true });
    } catch(e) {
      console.error("History tracking failed", e);
    }
  }
}

async function loadStats() {
  if (contentId === 'home') return;
  const statsRef = doc(db, 'content_stats', contentId);
  try {
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      const data = snap.data();
      if(likesCountEl) likesCountEl.textContent = data.likesCount || 0;
      if(viewsCountEl) viewsCountEl.textContent = data.views || 0;
      if(commentsCountEl) commentsCountEl.textContent = data.commentsCount || 0;
    } else {
      if(likesCountEl) likesCountEl.textContent = 0;
      if(viewsCountEl) viewsCountEl.textContent = 0;
      if(commentsCountEl) commentsCountEl.textContent = 0;
    }
  } catch (e) {
    console.warn("Could not fetch stats:", e);
    if(likesCountEl) likesCountEl.textContent = 0;
    if(viewsCountEl) viewsCountEl.textContent = 0;
    if(commentsCountEl) commentsCountEl.textContent = 0;
  }
}

async function recordViewSafe() {
  if (contentId === 'home') return;
  
  const viewKey = `viewed_${contentId}`;
  if (!sessionStorage.getItem(viewKey)) {
    sessionStorage.setItem(viewKey, 'true');
    try {
      const statsRef = doc(db, 'content_stats', contentId);
      await setDoc(statsRef, { views: increment(1) }, { merge: true });
      
      try {
        const postRef = doc(db, 'posts', contentId);
        await updateDoc(postRef, { views: increment(1) });
      } catch(e) {}
      
    } catch (error) {
      console.error("View count update failed", error);
    }
  }
}

if(btnSavePost) {
  btnSavePost.addEventListener('click', async () => {
    if (!currentUser) {
      alert('يجب تسجيل الدخول لحفظ المحتوى.');
      window.location.href = '/login';
      return;
    }
    const saveRef = doc(db, 'user_bookmarks', `${currentUser.uid}_${contentId}`);
    
    // Optimistic UI
    hasSaved = !hasSaved;
    updateSaveUI();
    
    try {
      if (hasSaved) {
        const title = document.title.split(' - ')[0] || 'مقال';
        const coverImg = document.getElementById('article-cover-image');
        const image = coverImg ? coverImg.src : '';
        await setDoc(saveRef, {
          userId: currentUser.uid,
          contentId: contentId,
          contentType: contentType,
          title: title,
          image: image,
          createdAt: serverTimestamp()
        });
      } else {
        await deleteDoc(saveRef);
      }
    } catch (error) {
      console.error('Save transaction failed:', error);
      hasSaved = !hasSaved;
      updateSaveUI();
      alert('حدث خطأ أثناء حفظ المقال.');
    }
  });
}

if(btnLike) {
  btnLike.addEventListener('click', async () => {
    if (!currentUser) {
      alert('يجب تسجيل الدخول للإعجاب بالمحتوى.');
      window.location.href = '/login';
      return;
    }
    
    const likeRef = doc(db, 'content_likes', `${contentId}_${currentUser.uid}`);
    const statsRef = doc(db, 'content_stats', contentId);
    const postRef = doc(db, 'posts', contentId);
    
    hasLiked = !hasLiked;
    updateLikeUI();
    
    let currentCount = parseInt(likesCountEl.textContent, 10) || 0;
    likesCountEl.textContent = hasLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    try {
      await runTransaction(db, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        const likeDoc = await transaction.get(likeRef);
        
        let newCount = 0;
        if (statsDoc.exists()) {
          newCount = statsDoc.data().likesCount || 0;
        }
        
        if (hasLiked && !likeDoc.exists()) {
          transaction.set(likeRef, { contentId, userUid: currentUser.uid, createdAt: serverTimestamp() });
          transaction.set(statsRef, { likesCount: newCount + 1 }, { merge: true });
        } else if (!hasLiked && likeDoc.exists()) {
          transaction.delete(likeRef);
          transaction.set(statsRef, { likesCount: Math.max(0, newCount - 1) }, { merge: true });
        }
      });
      
      try {
        if (hasLiked) {
          await updateDoc(postRef, { likesCount: increment(1) });
        } else {
          await updateDoc(postRef, { likesCount: increment(-1) });
        }
      } catch(e){}

    } catch (error) {
      console.error('Like transaction failed:', error);
      hasLiked = !hasLiked;
      updateLikeUI();
      likesCountEl.textContent = currentCount;
    }
  });
}

if(commentForm) {
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const textInput = document.getElementById('comment-text');
    const text = textInput.value.trim();
    if (!text) return;
    
    const btn = commentForm.querySelector('button');
    btn.disabled = true;
    
    try {
      await addDoc(collection(db, 'comments'), {
        contentId,
        authorUid: currentUser.uid,
        authorName: currentUserProfile.displayName || 'مستخدم',
        authorPhoto: currentUserProfile.photoURL || 'https://ui-avatars.com/api/?name=User&background=random',
        text,
        status: 'visible',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const statsRef = doc(db, 'content_stats', contentId);
      await setDoc(statsRef, { commentsCount: increment(1) }, { merge: true });
      
      try {
        await updateDoc(doc(db, 'posts', contentId), { commentsCount: increment(1) });
        
        // Notify the author if it's not the same user
        const postSnap = await getDoc(doc(db, 'posts', contentId));
        if (postSnap.exists()) {
          const postData = postSnap.data();
          if (postData.authorUid && postData.authorUid !== currentUser.uid) {
            await addDoc(collection(db, 'notifications'), {
              userId: postData.authorUid,
              type: 'comment_reply',
              title: 'تعليق جديد على قصتك',
              message: `قام ${currentUserProfile.displayName || 'مستخدم'} بالتعليق على قصتك "${postData.title || ''}".`,
              link: `/${postData.type}/${contentId}#comments`,
              read: false,
              createdAt: serverTimestamp()
            });
          }
        }
      } catch(e){}
      
      textInput.value = '';
      loadComments();
      
      if (commentsCountEl) {
        commentsCountEl.textContent = (parseInt(commentsCountEl.textContent, 10) || 0) + 1;
      }

    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة التعليق.');
    } finally {
      btn.disabled = false;
    }
  });
}

async function loadComments(loadMore = false) {
  if (contentId === 'home') return;
  
  if (!loadMore) {
    lastCommentDoc = null;
    if(commentsList) commentsList.innerHTML = '<div style="text-align: center; color: #888;">جاري تحميل التعليقات...</div>';
  }
  let q = query(
    collection(db, 'comments'),
    where('contentId', '==', contentId),
    where('status', '==', 'visible'),
    orderBy('createdAt', 'desc'),
    limit(COMMENTS_LIMIT)
  );
  if (loadMore && lastCommentDoc) {
    q = query(
      collection(db, 'comments'),
      where('contentId', '==', contentId),
      where('status', '==', 'visible'),
      orderBy('createdAt', 'desc'),
      startAfter(lastCommentDoc),
      limit(COMMENTS_LIMIT)
    );
  }
  
  try {
    const snapshot = await getDocs(q);
    
    const oldBtn = document.getElementById('btn-load-more-comments');
    if (oldBtn) oldBtn.remove();
    
    if (snapshot.empty && !loadMore) {
      if(commentsList) commentsList.innerHTML = '<div style="text-align: center; color: #888;">لا توجد تعليقات بعد. كن أول من يعلق!</div>';
      return;
    }
    
    if (!snapshot.empty) {
      lastCommentDoc = snapshot.docs[snapshot.docs.length - 1];
    }
    
    if (!loadMore && commentsList) commentsList.innerHTML = '';
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ar-EG') : '';
      
      const el = document.createElement('div');
      el.className = 'flex gap-5 bg-[#110808]/80 p-6 rounded-2xl border border-red-900/30 shadow-md';
      
      const delBtn = (currentUser && currentUser.uid === data.authorUid)
          ? `<button onclick="deleteComment('${docSnap.id}')" class="text-red-600 hover:text-red-400 text-sm font-bold transition-colors flex items-center gap-1.5"><i class="fas fa-trash"></i> حذف</button>`
          : `<button onclick="openReportModal('comment', '${docSnap.id}')" class="text-gray-500 hover:text-red-500 text-sm font-bold transition-colors flex items-center gap-1.5"><i class="fas fa-flag"></i> إبلاغ</button>`;
          
      el.innerHTML = `
        <a href="/author/${data.authorUid}" class="block w-12 h-12 shrink-0">
          <img src="${data.authorPhoto}" class="w-full h-full rounded-full border border-red-900/30 object-cover shadow-sm" onerror="this.src='https://ui-avatars.com/api/?name=User'" loading="lazy" decoding="async">
        </a>
        <div class="flex-1">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
            <a href="/author/${data.authorUid}" class="text-lg font-bold text-gray-200 hover:text-red-500 transition-colors">
              ${data.authorName}
            </a>
            <div class="flex gap-4 items-center">
              <span class="text-gray-500 text-sm font-medium">${dateStr}</span>
              ${delBtn}
            </div>
          </div>
          <p class="text-gray-300 m-0 leading-relaxed text-lg whitespace-pre-wrap">${data.text}</p>
        </div>
      `;
      
      if(commentsList) commentsList.appendChild(el);
    });
    if (snapshot.docs.length === COMMENTS_LIMIT) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'btn-load-more-comments';
      loadMoreBtn.textContent = 'تحميل المزيد';
      loadMoreBtn.className = 'w-full py-4 mt-4 bg-gray-900/50 hover:bg-gray-800 text-white font-bold rounded-xl border border-gray-700/50 transition-colors text-lg shadow-sm';
      loadMoreBtn.onclick = () => loadComments(true);
      if(commentsList) commentsList.appendChild(loadMoreBtn);
    }
  } catch (error) {
    console.error("Error loading comments:", error);
    if (!loadMore && commentsList) {
      commentsList.innerHTML = '<div style="text-align: center; color: #888;">تعذر تحميل التعليقات في الوقت الحالي.</div>';
    }
  }
}

window.deleteComment = async (commentId) => {
  if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
  try {
    await updateDoc(doc(db, 'comments', commentId), { status: 'deleted' });
    
    const statsRef = doc(db, 'content_stats', contentId);
    await setDoc(statsRef, { commentsCount: increment(-1) }, { merge: true });
    
    try {
      await updateDoc(doc(db, 'posts', contentId), { commentsCount: increment(-1) });
    } catch(e){}

    if (commentsCountEl) {
      commentsCountEl.textContent = Math.max(0, (parseInt(commentsCountEl.textContent, 10) || 0) - 1);
    }

    loadComments();
  } catch (error) {
    console.error(error);
    alert('حدث خطأ أثناء الحذف.');
  }
};

// --- Report Logic ---
let currentReportTargetType = null;
let currentReportTargetId = null;

window.openReportModal = (type, targetId) => {
  if (!currentUser) {
    alert('يجب تسجيل الدخول للإبلاغ.');
    window.location.href = '/login';
    return;
  }
  currentReportTargetType = type;
  currentReportTargetId = targetId;
  const modal = document.getElementById('report-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('report-details').value = '';
    const msgEl = document.getElementById('report-msg');
    msgEl.classList.add('hidden');
    msgEl.textContent = '';
  }
};

const btnReportPost = document.getElementById('btn-report-post');
if (btnReportPost) {
  btnReportPost.addEventListener('click', () => {
    openReportModal('content', contentId);
  });
}

const btnCancelReport = document.getElementById('btn-cancel-report');
if (btnCancelReport) {
  btnCancelReport.addEventListener('click', () => {
    document.getElementById('report-modal').classList.add('hidden');
  });
}

const btnSubmitReport = document.getElementById('btn-submit-report');
if (btnSubmitReport) {
  btnSubmitReport.addEventListener('click', async () => {
    if (!currentUser || !currentReportTargetType || !currentReportTargetId) return;
    
    const reason = document.getElementById('report-reason').value;
    const details = document.getElementById('report-details').value.trim();
    const msgEl = document.getElementById('report-msg');
    
    btnSubmitReport.disabled = true;
    btnSubmitReport.textContent = 'جاري الإرسال...';
    
    try {
      // Check for existing report from this user to prevent spam
      const reportsRef = collection(db, 'reports');
      const q = query(
        reportsRef,
        where('targetId', '==', currentReportTargetId),
        where('reporterUid', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        msgEl.textContent = 'لقد قمت بالإبلاغ عن هذا المحتوى مسبقاً.';
        msgEl.className = 'text-sm mb-4 font-bold text-center text-yellow-500 block';
        setTimeout(() => {
          document.getElementById('report-modal').classList.add('hidden');
        }, 2000);
        return;
      }
      
      // Submit new report
      await addDoc(reportsRef, {
        targetType: currentReportTargetType,
        targetId: currentReportTargetId,
        reporterUid: currentUser.uid,
        reason: reason,
        details: details,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      msgEl.textContent = 'تم إرسال الإبلاغ بنجاح. شكراً لك.';
      msgEl.className = 'text-sm mb-4 font-bold text-center text-green-500 block';
      
      setTimeout(() => {
        document.getElementById('report-modal').classList.add('hidden');
      }, 2000);
      
    } catch (error) {
      console.error("Report error:", error);
      msgEl.textContent = 'حدث خطأ. يرجى المحاولة لاحقاً.';
      msgEl.className = 'text-sm mb-4 font-bold text-center text-red-500 block';
    } finally {
      btnSubmitReport.disabled = false;
      btnSubmitReport.textContent = 'إرسال الإبلاغ';
    }
  });
}
