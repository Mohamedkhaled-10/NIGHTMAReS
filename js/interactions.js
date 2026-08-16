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
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    if (docSnap.exists()) {
      currentUserProfile = docSnap.data();
      if (currentUserProfile.accountStatus === 'banned' || currentUserProfile.accountStatus === 'deleted') {
        currentUser = null;
      } else {
        currentUser = user;
      }
    }
  } else {
    currentUser = null;
  }
  
  if (currentUser) {
    if(commentFormContainer) commentFormContainer.style.display = 'block';
    if(loginPrompt) loginPrompt.style.display = 'none';
    checkLikeStatus();
    checkSaveStatus();
    recordHistorySafe();
  } else {
    if(commentFormContainer) commentFormContainer.style.display = 'none';
    if(loginPrompt) loginPrompt.style.display = 'block';
  }
  
  loadStats();
  loadComments();
  recordViewSafe();
});

async function checkLikeStatus() {
  if (!currentUser || contentId === 'home') return;
  const likeRef = doc(db, 'content_likes', `${contentId}_${currentUser.uid}`);
  const snap = await getDoc(likeRef);
  hasLiked = snap.exists();
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
  const saveRef = doc(db, 'user_bookmarks', `${currentUser.uid}_${contentId}`);
  const snap = await getDoc(saveRef);
  hasSaved = snap.exists();
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
      const historyRef = doc(db, 'user_history', `${currentUser.uid}_${contentId}`);
      await setDoc(historyRef, {
        userId: currentUser.uid,
        postId: contentId, // slug
        postType: contentType,
        postTitle: title,
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
        await setDoc(saveRef, {
          userId: currentUser.uid,
          postId: contentId,
          postType: contentType,
          postTitle: title,
          savedAt: serverTimestamp()
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
    if(commentsList) commentsList.innerHTML = '';
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
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ar-EG') : '';
      
      const el = document.createElement('div');
      el.style.cssText = 'display: flex; gap: 15px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid #333;';
      
      const delBtn = (currentUser && currentUser.uid === data.authorUid) 
         ? `<button onclick="deleteComment('${docSnap.id}')" style="background:none; border:none; color:#e50914; cursor:pointer; font-size: 0.9em;"><i class="fas fa-trash"></i> حذف</button>` 
         : '';
        
      el.innerHTML = `
        <img src="${data.authorPhoto}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=User'" loading="lazy" decoding="async">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <strong style="color: #fff;">${data.authorName}</strong>
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="color: #777; font-size: 0.8em;">${dateStr}</span>
              ${delBtn}
            </div>
          </div>
          <p style="color: #ddd; margin: 0; line-height: 1.5; white-space: pre-wrap;">${data.text}</p>
        </div>
      `;
      
      if(commentsList) commentsList.appendChild(el);
    });
    if (snapshot.docs.length === COMMENTS_LIMIT) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'btn-load-more-comments';
      loadMoreBtn.textContent = 'تحميل المزيد';
      loadMoreBtn.style.cssText = 'background: rgba(255,255,255,0.1); color: #fff; border: 1px solid #555; padding: 10px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px; transition: background 0.3s;';
      loadMoreBtn.onmouseover = () => loadMoreBtn.style.background = 'rgba(255,255,255,0.2)';
      loadMoreBtn.onmouseout = () => loadMoreBtn.style.background = 'rgba(255,255,255,0.1)';
      loadMoreBtn.onclick = () => loadComments(true);
      if(commentsList) commentsList.appendChild(loadMoreBtn);
    }
  } catch (error) {
    console.error(error);
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
