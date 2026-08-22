import { db } from './firebase-init.js';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, generateStoryCard, generateNewsCard, generateVideoCard } from "./ui-utils.js";

document.addEventListener('DOMContentLoaded', async () => {
  // Get author ID from the URL path (/author/:id)
  const pathParts = window.location.pathname.split('/');
  const authorId = pathParts[pathParts.length - 1] === 'author' || pathParts[pathParts.length - 1] === 'author.html' 
    ? new URLSearchParams(window.location.search).get('id') 
    : pathParts[pathParts.length - 1];

  if (!authorId || authorId === 'author.html' || authorId === 'author') {
    document.getElementById('author-name').textContent = 'الكاتب غير موجود';
    document.getElementById('author-posts-grid').innerHTML = '<div class="col-span-full text-center text-[var(--color-accent)] py-12">لم يتم العثور على الكاتب.</div>';
    return;
  }

  try {
    // 1. Fetch Author Profile (displayName, photoURL)
    // We only access public display info. Email and UID are strictly not exposed in UI.
    const userDocRef = doc(db, 'users', authorId);
    const userSnap = await getDoc(userDocRef);

    let authorName = 'مستخدم';
    let authorPhoto = '/assets/images/logo1.png';

    if (userSnap.exists()) {
      const userData = userSnap.data();
      authorName = userData.displayName || 'مستخدم';
      if (userData.photoURL) {
        authorPhoto = userData.photoURL;
      }
    } else {
      // If user doc doesn't exist, maybe it was deleted, but posts remain.
      authorName = 'كاتب مجهول';
    }

    document.getElementById('author-name').textContent = authorName;
    document.getElementById('author-avatar').src = authorPhoto;
    document.title = `${authorName} - NIGHTMAReS`;

    // 2. Fetch Author's Published Posts
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('authorUid', '==', authorId),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );

    const postsSnap = await getDocs(q);
    const postsGrid = document.getElementById('author-posts-grid');
    
    document.getElementById('author-posts-count').textContent = postsSnap.size;

    if (postsSnap.empty) {
      postsGrid.innerHTML = '<div class="col-span-full text-center text-[var(--color-text-meta)] py-12">لا توجد مقالات منشورة لهذا الكاتب بعد.</div>';
      return;
    }

    postsGrid.innerHTML = '';
    postsSnap.forEach(docSnap => {
      const post = docSnap.data();
      const postId = docSnap.id;
      const type = post.type || 'story'; // story, news, video
      const dateStr = post.createdAt ? post.createdAt.toDate().toLocaleDateString('ar-EG') : '';
      const coverImage = post.coverImage || '/assets/images/logo1.png';
      const defaultCategory = type === 'story' ? 'قصص' : (type === 'news' ? 'أخبار' : 'فيديو');

      const card = document.createElement('a');
      card.href = `/${type}/${postId}`;
      card.className = 'content-card-link';
      
      if (post.type === 'story') { card.innerHTML = generateStoryCard(post, null, post.category || 'قصة', null); } else if (post.type === 'video') { card.innerHTML = generateVideoCard(post, null, post.category || 'فيديو'); } else { card.innerHTML = generateNewsCard(post, null, null, post.category || 'خبر'); }
      postsGrid.appendChild(card);
    });

  } catch (error) {
    console.error("Error loading author data:", error);
    document.getElementById('author-posts-grid').innerHTML = '<div class="col-span-full text-center text-[var(--color-accent)] py-12">حدث خطأ أثناء تحميل بيانات الكاتب.</div>';
  }
});

// --- Report Author Logic ---
import { auth } from './firebase-init.js';
import { addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const btnReportAuthor = document.getElementById('btn-report-author');
  const btnCancelReport = document.getElementById('btn-cancel-report');
  const btnSubmitReport = document.getElementById('btn-submit-report');
  const reportModal = document.getElementById('report-modal');
  
  const pathParts = window.location.pathname.split('/');
  const authorId = pathParts[pathParts.length - 1];

  if (btnReportAuthor) {
    // Show report button after a short delay to ensure auth state is loaded
    setTimeout(() => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid !== authorId) {
        btnReportAuthor.classList.remove('hidden');
      }
    }, 1500);

    btnReportAuthor.addEventListener('click', () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast({ type: 'warning', message: 'يجب تسجيل الدخول للإبلاغ.' });
        window.location.href = '/login';
        return;
      }
      reportModal.classList.remove('hidden');
      document.getElementById('report-details').value = '';
      const msgEl = document.getElementById('report-msg');
      msgEl.classList.add('hidden');
      msgEl.textContent = '';
    });
  }

  if (btnCancelReport) {
    btnCancelReport.addEventListener('click', () => {
      reportModal.classList.add('hidden');
    });
  }

  if (btnSubmitReport) {
    btnSubmitReport.addEventListener('click', async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || !authorId) return;
      
      const reason = document.getElementById('report-reason').value;
      const details = document.getElementById('report-details').value.trim();
      const msgEl = document.getElementById('report-msg');
      
      btnSubmitReport.disabled = true;
      btnSubmitReport.textContent = 'جاري الإرسال...';
      
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('targetId', '==', authorId),
          where('reporterUid', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          msgEl.textContent = 'لقد قمت بالإبلاغ عن هذا الكاتب مسبقاً.';
          msgEl.className = 'text-sm mb-4 font-bold text-center text-yellow-500 block';
          setTimeout(() => {
            reportModal.classList.add('hidden');
          }, 2000);
          return;
        }
        
        await addDoc(reportsRef, {
          targetType: 'user',
          targetId: authorId,
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
          reportModal.classList.add('hidden');
        }, 2000);
        
      } catch (error) {
        console.error("Report error:", error);
        msgEl.textContent = 'حدث خطأ. يرجى المحاولة لاحقاً.';
        msgEl.className = 'text-sm mb-4 font-bold text-center text-[var(--color-accent)] block';
      } finally {
        btnSubmitReport.disabled = false;
        btnSubmitReport.textContent = 'إرسال الإبلاغ';
      }
    });
  }
});
