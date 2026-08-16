import { db, auth } from './firebase-init.js';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let editId = sessionStorage.getItem('editSubmissionId');

document.addEventListener('DOMContentLoaded', async () => {
  if (editId) {
    document.getElementById('btn-submit').textContent = 'جاري التحميل...';
    try {
      const docSnap = await getDoc(doc(db, 'user_submissions', editId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('author-name').value = data.authorName || '';
        document.getElementById('story-title').value = data.title || '';
        document.getElementById('story-content').value = data.content || '';
        
        const titleEl = document.querySelector('h1.text-4xl');
        if (titleEl) titleEl.textContent = 'تعديل مساهمتك';
        
        const subtitleEl = document.querySelector('p.text-gray-400');
        if (subtitleEl && data.rejectionReason) {
          subtitleEl.innerHTML = `يرجى إجراء التعديلات المطلوبة لإعادة التقييم.<br><span class="text-orange-400 font-bold">سبب التعديل المطلوب:</span> ${data.rejectionReason}`;
        } else if (subtitleEl) {
          subtitleEl.textContent = 'قم بتعديل قصتك ثم أعد إرسالها.';
        }
        
        document.getElementById('btn-submit').textContent = 'إعادة إرسال القصة للمراجعة';
      } else {
        sessionStorage.removeItem('editSubmissionId');
        editId = null;
      }
    } catch (e) {
      console.error(e);
      sessionStorage.removeItem('editSubmissionId');
      editId = null;
    }
    
    if(!editId) {
       document.getElementById('btn-submit').textContent = 'إرسال القصة للمراجعة';
    }
  }
});

document.getElementById('submit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const authorName = document.getElementById('author-name').value.trim();
  const storyTitle = document.getElementById('story-title').value.trim();
  const storyContent = document.getElementById('story-content').value.trim();
  
  const btn = document.getElementById('btn-submit');
  const msgEl = document.getElementById('status-msg');
  
  btn.disabled = true;
  btn.textContent = 'جاري الإرسال...';
  msgEl.classList.add('hidden');
  
  try {
    const user = auth.currentUser;
    
    if (editId) {
      await updateDoc(doc(db, 'user_submissions', editId), {
        authorName: authorName,
        title: storyTitle,
        content: storyContent,
        status: 'submitted', // change back to submitted for re-review
        updatedAt: serverTimestamp()
      });
      sessionStorage.removeItem('editSubmissionId');
      editId = null;
      document.getElementById('submit-form').reset();
      msgEl.textContent = 'تم تعديل قصتك وإعادة إرسالها للمراجعة بنجاح!';
      msgEl.className = 'mt-6 text-center font-bold text-lg text-green-500';
      
      setTimeout(() => {
        window.location.href = '/pages/profile.html';
      }, 2000);
    } else {
      await addDoc(collection(db, 'user_submissions'), {
        authorName: authorName,
        title: storyTitle,
        content: storyContent,
        uid: user ? user.uid : null,
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      document.getElementById('submit-form').reset();
      msgEl.textContent = 'تم إرسال قصتك بنجاح! سيتم مراجعتها قريباً من قبل الإدارة.';
      msgEl.className = 'mt-6 text-center font-bold text-lg text-green-500';
    }
  } catch (error) {
    console.error("Submission error:", error);
    msgEl.textContent = 'حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.';
    msgEl.className = 'mt-6 text-center font-bold text-lg text-red-500';
  } finally {
    btn.disabled = false;
    btn.textContent = 'إرسال القصة للمراجعة';
  }
});
