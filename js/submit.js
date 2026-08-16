import { db, auth } from './firebase-init.js';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UIErrorState, UISuccessState } from './ui-utils.js';

let editId = sessionStorage.getItem('editSubmissionId');

document.addEventListener('DOMContentLoaded', async () => {
  const contentInput = document.getElementById('story-content');
  const charCount = document.getElementById('char-count');
  
  if (contentInput && charCount) {
    contentInput.addEventListener('input', () => {
      charCount.textContent = `${contentInput.value.length} حرف`;
    });
  }

  if (editId) {
    document.getElementById('btn-text').textContent = 'جاري التحميل...';
    try {
      const docSnap = await getDoc(doc(db, 'user_submissions', editId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('author-name').value = data.authorName || '';
        document.getElementById('story-title').value = data.title || '';
        document.getElementById('story-content').value = data.content || '';
        
        if (contentInput && charCount) {
          charCount.textContent = `${contentInput.value.length} حرف`;
        }
        
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.innerHTML = 'تعديل <span class="text-red-600">المساهمة</span>';
        
        const subtitleEl = document.getElementById('page-subtitle');
        if (subtitleEl && data.rejectionReason) {
          subtitleEl.innerHTML = `يرجى إجراء التعديلات المطلوبة لإعادة التقييم.<br><span class="text-orange-400 font-bold">سبب التعديل المطلوب:</span> ${data.rejectionReason}`;
        } else if (subtitleEl) {
          subtitleEl.textContent = 'قم بتعديل قصتك ثم أعد إرسالها.';
        }
        
        document.getElementById('btn-text').textContent = 'إعادة إرسال القصة للمراجعة';
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
       document.getElementById('btn-text').textContent = 'إرسال القصة للمراجعة';
    }
  }
});

document.getElementById('submit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const authorName = document.getElementById('author-name').value.trim();
  const storyTitle = document.getElementById('story-title').value.trim();
  const storyContentText = document.getElementById('story-content').value.trim();
  const category = document.getElementById('story-category') ? document.getElementById('story-category').value : '';
  const tags = document.getElementById('story-tags') ? document.getElementById('story-tags').value.trim() : '';
  
  let finalContent = storyContentText;
  
  if (category || tags) {
    finalContent += `\n\n--- \n`;
    if (category) finalContent += `**التصنيف:** ${category}\n`;
    if (tags) finalContent += `**الوسوم:** ${tags}\n`;
  }
  
  const btn = document.getElementById('btn-submit');
  const btnText = document.getElementById('btn-text');
  const btnIcon = document.getElementById('btn-icon');
  const btnSpinner = document.getElementById('btn-spinner');
  const msgEl = document.getElementById('status-msg');
  
  btn.disabled = true;
  btnText.textContent = 'جاري الإرسال...';
  if(btnIcon) btnIcon.classList.add('hidden');
  if(btnSpinner) btnSpinner.classList.remove('hidden');
  
  msgEl.classList.add('hidden');
  msgEl.className = 'hidden mt-8 p-4 rounded-lg text-center font-bold text-sm border flex items-center justify-center gap-2';
  
  try {
    const user = auth.currentUser;
    
    if (editId) {
      await updateDoc(doc(db, 'user_submissions', editId), {
        authorName: authorName,
        title: storyTitle,
        content: finalContent,
        status: 'submitted', // change back to submitted for re-review
        updatedAt: serverTimestamp()
      });
      sessionStorage.removeItem('editSubmissionId');
      editId = null;
      document.getElementById('submit-form').reset();
      document.getElementById('char-count').textContent = '0 حرف';
      
      msgEl.innerHTML = UISuccessState('تم تعديل قصتك وإعادة إرسالها للمراجعة بنجاح!');
      msgEl.classList.remove('hidden');
      msgEl.className = 'mt-8';
      
      setTimeout(() => {
        window.location.href = '/pages/profile.html';
      }, 2000);
    } else {
      await addDoc(collection(db, 'user_submissions'), {
        authorName: authorName,
        title: storyTitle,
        content: finalContent,
        uid: user ? user.uid : null,
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      document.getElementById('submit-form').reset();
      document.getElementById('char-count').textContent = '0 حرف';
      
      msgEl.innerHTML = UISuccessState('تم إرسال قصتك بنجاح! سيتم مراجعتها قريباً من قبل الإدارة.');
      msgEl.classList.remove('hidden');
      msgEl.className = 'mt-8';
    }
  } catch (error) {
    console.error("Submission error:", error);
    msgEl.innerHTML = UIErrorState('حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.', 'retry-submit');
    msgEl.classList.remove('hidden');
    msgEl.className = 'mt-8';
    document.getElementById('retry-submit')?.addEventListener('click', () => btn.click());
  } finally {
    btn.disabled = false;
    btnText.textContent = 'إرسال القصة للمراجعة';
    if(btnIcon) btnIcon.classList.remove('hidden');
    if(btnSpinner) btnSpinner.classList.add('hidden');
  }
});
