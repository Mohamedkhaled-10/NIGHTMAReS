import { db, auth } from './firebase-init.js';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UIErrorState, UISuccessState } from './ui-utils.js';

let editId = sessionStorage.getItem('editSubmissionId');

let selectedHorrorType = null;
let estimatedReadingTime = 1;
const DRAFT_KEY = 'nightmares_story_draft';

function saveDraft() {
  if (editId) return; // Do not save drafts while in edit mode
  
  const titleInput = document.getElementById('story-title');
  const contentInput = document.getElementById('story-content');
  const suggestedContentWarningInput = document.getElementById('suggestedContentWarning');
  const suggestedContentWarningNoteInput = document.getElementById('suggestedContentWarningNote');
  const authorNameInput = document.getElementById('author-name');
  
  const draft = {
    title: titleInput ? titleInput.value : '',
    content: contentInput ? contentInput.value : '',
    authorName: authorNameInput ? authorNameInput.value : '',
    suggestedHorrorType: selectedHorrorType,
    suggestedContentWarning: suggestedContentWarningInput ? suggestedContentWarningInput.checked : false,
    suggestedContentWarningNote: suggestedContentWarningNoteInput ? suggestedContentWarningNoteInput.value : ''
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function loadDraft() {
  if (editId) return;
  const draftJson = localStorage.getItem(DRAFT_KEY);
  if (draftJson) {
    try {
      const draft = JSON.parse(draftJson);
      if (draft.title && document.getElementById('story-title')) {
        document.getElementById('story-title').value = draft.title;
      }
      if (draft.authorName && document.getElementById('author-name')) {
        document.getElementById('author-name').value = draft.authorName;
      }
      
      if (draft.suggestedHorrorType) {
        const btn = document.querySelector(`.horror-type-btn[data-type="${draft.suggestedHorrorType}"]`);
        if (btn) btn.click();
      }
      
      const contentWarningInput = document.getElementById('suggestedContentWarning');
      const contentWarningNoteContainer = document.getElementById('content-warning-note-container');
      const contentWarningNoteInput = document.getElementById('suggestedContentWarningNote');
      
      if (draft.suggestedContentWarning && contentWarningInput) {
        contentWarningInput.checked = true;
        if(contentWarningNoteContainer) contentWarningNoteContainer.classList.remove('hidden');
        if (draft.suggestedContentWarningNote && contentWarningNoteInput) {
          contentWarningNoteInput.value = draft.suggestedContentWarningNote;
        }
      }
      
      if (draft.content && document.getElementById('story-content')) {
        const contentInput = document.getElementById('story-content');
        contentInput.value = draft.content;
        contentInput.dispatchEvent(new Event('input')); // to trigger counters
      }
    } catch (e) {
      console.error("Error loading draft", e);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const contentInput = document.getElementById('story-content');
  const charCount = document.getElementById('char-count');
  const readingTimeDisplay = document.getElementById('reading-time');
  const titleInput = document.getElementById('story-title');
  const authorNameInput = document.getElementById('author-name');
  
  // New UI Elements
  const horrorTypeBtns = document.querySelectorAll('.horror-type-btn');
  const suggestedContentWarningInput = document.getElementById('suggestedContentWarning');
  const contentWarningNoteContainer = document.getElementById('content-warning-note-container');
  const suggestedContentWarningNoteInput = document.getElementById('suggestedContentWarningNote');
  
  // Set up listeners for drafts
  if(titleInput) titleInput.addEventListener('input', saveDraft);
  if(authorNameInput) authorNameInput.addEventListener('input', saveDraft);
  if(suggestedContentWarningNoteInput) suggestedContentWarningNoteInput.addEventListener('input', saveDraft);
  
  if (suggestedContentWarningInput) {
    suggestedContentWarningInput.addEventListener('change', (e) => {
      if (e.target.checked) {
        if(contentWarningNoteContainer) contentWarningNoteContainer.classList.remove('hidden');
      } else {
        if(contentWarningNoteContainer) contentWarningNoteContainer.classList.add('hidden');
        if(suggestedContentWarningNoteInput) suggestedContentWarningNoteInput.value = '';
      }
      saveDraft();
    });
  }
  
  horrorTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      horrorTypeBtns.forEach(b => {
        b.classList.remove('border-[var(--color-accent)]', 'bg-accent-30');
        b.classList.add('border-accent-30', 'bg-[var(--color-bg-surface)]');
      });
      btn.classList.remove('border-accent-30', 'bg-[var(--color-bg-surface)]');
      btn.classList.add('border-[var(--color-accent)]', 'bg-accent-30');
      selectedHorrorType = btn.dataset.type;
      
      // Update hidden input for required validation if needed
      const hiddenInput = document.getElementById('suggestedHorrorType');
      if(hiddenInput) hiddenInput.value = selectedHorrorType;
      
      saveDraft();
    });
  });
  
  if (contentInput && charCount) {
    contentInput.addEventListener('input', () => {
      const length = contentInput.value.length;
      charCount.textContent = `${length} حرف`;
      
      // Calculate Reading Time
      const wordCount = contentInput.value.trim().split(/\s+/).filter(word => word.length > 0).length;
      estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 180));
      if(readingTimeDisplay) {
        readingTimeDisplay.textContent = `مدة القراءة: ${estimatedReadingTime} دقيقة`;
      }
      
      saveDraft();
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
        
        // Populate new fields if they exist from a previous revision
        if (data.suggestedHorrorType) {
          const btn = document.querySelector(`.horror-type-btn[data-type="${data.suggestedHorrorType}"]`);
          if (btn) btn.click();
        }
        if (data.suggestedContentWarning) {
          const warningInput = document.getElementById('suggestedContentWarning');
          if (warningInput) {
            warningInput.checked = true;
            document.getElementById('content-warning-note-container').classList.remove('hidden');
            if (data.suggestedContentWarningNote) {
              document.getElementById('suggestedContentWarningNote').value = data.suggestedContentWarningNote;
            }
          }
        }
        
        if (contentInput && charCount) {
          contentInput.dispatchEvent(new Event('input'));
        }
        
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.innerHTML = 'تعديل <span class="text-[var(--color-accent)]">المساهمة</span>';
        
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
       // Load draft only if not editing
       setTimeout(() => loadDraft(), 100);
    }
  } else {
    // If no edit ID, load draft immediately
    setTimeout(() => loadDraft(), 100);
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
  
  if (!selectedHorrorType) {
    const msgEl = document.getElementById('status-msg');
    msgEl.innerHTML = UIErrorState('يرجى اختيار نوع الرعب للقصة قبل الإرسال.');
    msgEl.classList.remove('hidden');
    msgEl.className = 'mt-8 p-4 rounded-lg text-center font-bold text-sm border flex items-center justify-center gap-2';
    return;
  }
  
  const suggestedContentWarningInput = document.getElementById('suggestedContentWarning');
  const suggestedContentWarningNoteInput = document.getElementById('suggestedContentWarningNote');
  const isWarningChecked = suggestedContentWarningInput ? suggestedContentWarningInput.checked : false;
  const warningNote = isWarningChecked && suggestedContentWarningNoteInput ? suggestedContentWarningNoteInput.value.trim() : null;
  
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
        suggestedHorrorType: selectedHorrorType,
        suggestedContentWarning: isWarningChecked,
        suggestedContentWarningNote: warningNote,
        estimatedReadingTime: estimatedReadingTime,
        updatedAt: serverTimestamp()
      });
      sessionStorage.removeItem('editSubmissionId');
      editId = null;
      document.getElementById('submit-form').reset();
      document.getElementById('char-count').textContent = '0 حرف';
      const readingTimeDisplay = document.getElementById('reading-time');
      if (readingTimeDisplay) readingTimeDisplay.textContent = 'مدة القراءة: 1 دقيقة';
      localStorage.removeItem(DRAFT_KEY);
      
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
        suggestedHorrorType: selectedHorrorType,
        suggestedContentWarning: isWarningChecked,
        suggestedContentWarningNote: warningNote,
        estimatedReadingTime: estimatedReadingTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      document.getElementById('submit-form').reset();
      document.getElementById('char-count').textContent = '0 حرف';
      const readingTimeDisplay = document.getElementById('reading-time');
      if (readingTimeDisplay) readingTimeDisplay.textContent = 'مدة القراءة: 1 دقيقة';
      localStorage.removeItem(DRAFT_KEY);
      
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
