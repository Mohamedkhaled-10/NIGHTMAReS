import { db } from './firebase-init.js';
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const btnRandomStory = document.getElementById('btn-random-story');
  if (!btnRandomStory) return;

  btnRandomStory.addEventListener('click', async () => {
    // Show loading state
    const originalContent = btnRandomStory.innerHTML;
    btnRandomStory.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري البحث...';
    btnRandomStory.disabled = true;
    
    try {
      const randomValue = Math.random();
      const postsRef = collection(db, 'posts');
      
      // First attempt: where randomWeight >= randomValue
      let q = query(
        postsRef,
        where('type', '==', 'story'),
        where('status', '==', 'published'),
        where('randomWeight', '>=', randomValue),
        orderBy('randomWeight'),
        limit(1)
      );
      
      let snap = await getDocs(q);
      
      // Fallback: where randomWeight <= randomValue
      if (snap.empty) {
        q = query(
          postsRef,
          where('type', '==', 'story'),
          where('status', '==', 'published'),
          where('randomWeight', '<=', randomValue),
          orderBy('randomWeight', 'desc'),
          limit(1)
        );
        snap = await getDocs(q);
      }
      
      if (!snap.empty) {
        const doc = snap.docs[0];
        const slug = doc.data().slug || doc.id;
        window.location.href = `/story/${slug}`;
      } else {
        alert('لا توجد قصص متاحة حالياً.');
        btnRandomStory.innerHTML = originalContent;
        btnRandomStory.disabled = false;
      }
    } catch (error) {
      console.error("Error fetching random story:", error);
      alert('حدث خطأ أثناء جلب القصة العشوائية.');
      btnRandomStory.innerHTML = originalContent;
      btnRandomStory.disabled = false;
    }
  });
});
