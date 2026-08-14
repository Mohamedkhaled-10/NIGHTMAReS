import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, doc, getDoc, setDoc, deleteDoc, updateDoc,
  query, where, orderBy, getDocs, addDoc, serverTimestamp, runTransaction, limit, startAfter
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Extract slug/ID for current page
const urlParts = window.location.pathname.split('/');
const contentId = urlParts[urlParts.length - 1].replace('.html', '') || 'home';

const btnLike = document.getElementById('btn-like');
const likeIcon = document.getElementById('like-icon');
const likesCountEl = document.getElementById('likes-count');
const commentFormContainer = document.getElementById('comment-form-container');
const loginPrompt = document.getElementById('login-prompt');
const commentForm = document.getElementById('comment-form');
const commentsList = document.getElementById('comments-list');

let currentUser = null;
let currentUserProfile = null;
let hasLiked = false;
let lastCommentDoc = null; // For pagination
const COMMENTS_LIMIT = 10;


onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Check if user is active
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
    commentFormContainer.style.display = 'block';
    loginPrompt.style.display = 'none';
    checkLikeStatus();
  } else {
    commentFormContainer.style.display = 'none';
    loginPrompt.style.display = 'block';
  }
  
  loadLikesCount();
  loadComments();
});

async function checkLikeStatus() {
  if (!currentUser) return;
  const likeRef = doc(db, 'content_likes', \`\${contentId}_\${currentUser.uid}\`);
  const snap = await getDoc(likeRef);
  hasLiked = snap.exists();
  updateLikeUI();
}

function updateLikeUI() {
  if (hasLiked) {
    likeIcon.style.color = '#e50914';
  } else {
    likeIcon.style.color = '#aaa';
  }
}

async function loadLikesCount() {
  const statsRef = doc(db, 'content_stats', contentId);
  const snap = await getDoc(statsRef);
  if (snap.exists()) {
    likesCountEl.textContent = snap.data().likesCount || 0;
  } else {
    likesCountEl.textContent = 0;
  }
}

btnLike.addEventListener('click', async () => {
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }
  
  const likeRef = doc(db, 'content_likes', \`\${contentId}_\${currentUser.uid}\`);
  const statsRef = doc(db, 'content_stats', contentId);
  
  // Optimistic UI
  hasLiked = !hasLiked;
  updateLikeUI();
  let currentCount = parseInt(likesCountEl.textContent, 10);
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
  } catch (error) {
    console.error('Like transaction failed:', error);
    // Revert UI on failure
    hasLiked = !hasLiked;
    updateLikeUI();
    likesCountEl.textContent = currentCount;
  }
});

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
    
    textInput.value = '';
    loadComments();
  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء إضافة التعليق.');
  } finally {
    btn.disabled = false;
  }
});

async function loadComments(loadMore = false) {
  if (!loadMore) {
    lastCommentDoc = null;
    commentsList.innerHTML = '';
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
    
    // Remove previous "Load More" button if it exists
    const oldBtn = document.getElementById('btn-load-more-comments');
    if (oldBtn) oldBtn.remove();
    
    if (snapshot.empty && !loadMore) {
      commentsList.innerHTML = '<div style="text-align: center; color: #888;">لا توجد تعليقات بعد. كن أول من يعلق!</div>';
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
      
      // Delete button for author
      const delBtn = (currentUser && currentUser.uid === data.authorUid) 
        ? \`<button onclick="deleteComment('\${docSnap.id}')" style="background:none; border:none; color:#e50914; cursor:pointer; font-size: 0.9em;"><i class="fas fa-trash"></i> حذف</button>\` 
        : '';
        
      el.innerHTML = \`
        <img src="\${data.authorPhoto}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=User'" loading="lazy" decoding="async">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <strong style="color: #fff;">\${data.authorName}</strong>
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="color: #777; font-size: 0.8em;">\${dateStr}</span>
              \${delBtn}
            </div>
          </div>
          <p style="color: #ddd; margin: 0; line-height: 1.5; white-space: pre-wrap;">\${data.text}</p>
        </div>
      \`;
      
      commentsList.appendChild(el);
    });

    if (snapshot.docs.length === COMMENTS_LIMIT) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'btn-load-more-comments';
      loadMoreBtn.textContent = 'تحميل المزيد';
      loadMoreBtn.style.cssText = 'background: rgba(255,255,255,0.1); color: #fff; border: 1px solid #555; padding: 10px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px; transition: background 0.3s;';
      loadMoreBtn.onmouseover = () => loadMoreBtn.style.background = 'rgba(255,255,255,0.2)';
      loadMoreBtn.onmouseout = () => loadMoreBtn.style.background = 'rgba(255,255,255,0.1)';
      loadMoreBtn.onclick = () => loadComments(true);
      commentsList.appendChild(loadMoreBtn);
    }
  } catch (error) {
    console.error(error);
    if(error.message.includes("indexes")) {
       console.warn("Index is building. Show temporary warning.");
    }
    if (!loadMore) {
      commentsList.innerHTML = '<div style="text-align: center; color: #e50914;">تعذر تحميل التعليقات. (قد يتم بناء الفهرس، يرجى المحاولة لاحقاً)</div>';
    }
  }
}

window.deleteComment = async (commentId) => {
  if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
  try {
    await updateDoc(doc(db, 'comments', commentId), { status: 'deleted' });
    loadComments();
  } catch (error) {
    console.error(error);
    alert('حدث خطأ أثناء الحذف.');
  }
};
