import { db } from './firebase-init.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    await addDoc(collection(db, 'user_submissions'), {
      authorName: authorName,
      title: storyTitle,
      content: storyContent,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    document.getElementById('submit-form').reset();
    msgEl.textContent = 'تم إرسال قصتك بنجاح! سيتم مراجعتها قريباً من قبل الإدارة.';
    msgEl.className = 'mt-6 text-center font-bold text-lg text-green-500';
  } catch (error) {
    console.error("Submission error:", error);
    msgEl.textContent = 'حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.';
    msgEl.className = 'mt-6 text-center font-bold text-lg text-red-500';
  } finally {
    btn.disabled = false;
    btn.textContent = 'إرسال القصة للمراجعة';
  }
});
