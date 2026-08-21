import { db } from '../../js/firebase-init.js';
import { collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.runRandomWeightBackfill = async function() {
  console.log("Starting randomWeight backfill...");
  try {
    const q = query(collection(db, 'posts'), where('type', '==', 'story'), where('status', '==', 'published'));
    const snap = await getDocs(q);
    let updatedCount = 0;
    
    for (const document of snap.docs) {
      if (document.data().randomWeight === undefined) {
        await updateDoc(doc(db, 'posts', document.id), {
          randomWeight: Math.random()
        });
        updatedCount++;
        console.log(`Updated story: ${document.id}`);
      }
    }
    console.log(`BACKFILL_RESULT: Successfully backfilled randomWeight for ${updatedCount} stories.`);
    alert(`تم بنجاح تحديث ${updatedCount} قصة بوزن عشوائي.`);
  } catch (error) {
    console.error("Backfill failed:", error);
    alert("حدث خطأ أثناء التحديث. راجع الـ Console.");
  }
};
