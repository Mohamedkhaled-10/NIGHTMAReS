import { db } from '../../js/firebase-init.js';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  addDoc, 
  serverTimestamp, 
  where, 
  runTransaction, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const menuSeries = document.getElementById('menu-series');
const viewSeries = document.getElementById('view-series');
const headerTitle = document.getElementById('header-title');

const seriesGrid = document.getElementById('series-grid');
const btnCreateSeries = document.getElementById('btn-create-series');
const createSeriesModal = document.getElementById('create-series-modal');
const btnCloseCreateSeries = document.getElementById('btn-close-create-series');
const btnCancelCreateSeries = document.getElementById('btn-cancel-create-series');
const createSeriesForm = document.getElementById('create-series-form');

const seriesDetailsModal = document.getElementById('series-details-modal');
const btnCloseSeriesModal = document.getElementById('btn-close-series-modal');
const seriesModalTitle = document.getElementById('series-modal-title');
const seriesModalDesc = document.getElementById('series-modal-desc');
const seriesPartsList = document.getElementById('series-parts-list');
const btnAddStoryToSeries = document.getElementById('btn-add-story-to-series');

const addStoryModal = document.getElementById('add-story-modal');
const btnCloseAddStory = document.getElementById('btn-close-add-story');
const searchStoryForSeries = document.getElementById('search-story-for-series');
const availableStoriesList = document.getElementById('available-stories-list');

let currentActiveSeriesId = null;
let allPublishedStories = []; // Cache for adding stories

// Navigation Hook
if (menuSeries) {
  menuSeries.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#main-container > div').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('aside nav a').forEach(el => {
      el.classList.remove('bg-gray-800', 'text-white');
      el.classList.add('text-gray-300');
    });
    
    viewSeries.classList.remove('hidden');
    menuSeries.classList.add('bg-gray-800', 'text-white');
    menuSeries.classList.remove('text-gray-300');
    headerTitle.textContent = 'إدارة السلاسل (Series)';
    loadSeries();
  });
}

// Modals toggling
btnCreateSeries?.addEventListener('click', () => createSeriesModal.classList.remove('hidden'));
btnCloseCreateSeries?.addEventListener('click', () => createSeriesModal.classList.add('hidden'));
btnCancelCreateSeries?.addEventListener('click', () => createSeriesModal.classList.add('hidden'));

btnCloseSeriesModal?.addEventListener('click', () => {
  seriesDetailsModal.classList.add('hidden');
  currentActiveSeriesId = null;
});

btnCloseAddStory?.addEventListener('click', () => addStoryModal.classList.add('hidden'));
btnAddStoryToSeries?.addEventListener('click', () => {
  addStoryModal.classList.remove('hidden');
  loadAvailableStories();
});

// Search filter for stories
searchStoryForSeries?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const items = availableStoriesList.querySelectorAll('.story-item-card');
  items.forEach(item => {
    const title = item.dataset.title.toLowerCase();
    item.style.display = title.includes(term) ? 'flex' : 'none';
  });
});

// Load Series
async function loadSeries() {
  seriesGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">جاري التحميل...</div>';
  try {
    const q = query(collection(db, "series"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      seriesGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">لا توجد سلاسل حالياً.</div>';
      return;
    }
    
    seriesGrid.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col';
      card.innerHTML = `
        <div class="flex items-start gap-4 mb-3">
          ${data.coverImageUrl ? `<img src="${data.coverImageUrl}" class="w-16 h-16 rounded object-cover">` : `<div class="w-16 h-16 rounded bg-gray-200 flex items-center justify-center text-gray-400"><i class="fas fa-layer-group text-2xl"></i></div>`}
          <div class="flex-1">
            <h4 class="font-bold text-gray-800 text-lg line-clamp-1">${data.title}</h4>
            <p class="text-xs text-gray-500 mt-1">${data.storyCount || 0} أجزاء</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">${data.description || 'لا يوجد وصف'}</p>
        <button class="w-full bg-gray-200 text-gray-700 py-2 rounded font-semibold hover:bg-gray-300 transition text-sm">إدارة السلسلة</button>
      `;
      card.addEventListener('click', () => openSeriesDetails(doc.id, data));
      seriesGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading series:", error);
    seriesGrid.innerHTML = '<div class="col-span-full text-center text-red-500 py-8">حدث خطأ أثناء التحميل.</div>';
  }
}

// Create Series
createSeriesForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = createSeriesForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'جاري الإنشاء...';
  
  try {
    const title = document.getElementById('new-series-title').value;
    const desc = document.getElementById('new-series-desc').value;
    const image = document.getElementById('new-series-image').value;
    
    await addDoc(collection(db, "series"), {
      title: title,
      description: desc || null,
      coverImageUrl: image || null,
      storyCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    createSeriesForm.reset();
    createSeriesModal.classList.add('hidden');
    loadSeries();
  } catch (error) {
    console.error("Error creating series:", error);
    alert('حدث خطأ أثناء إنشاء السلسلة');
  } finally {
    btn.disabled = false;
    btn.textContent = 'إنشاء السلسلة';
  }
});

// Open Series Details
async function openSeriesDetails(seriesId, seriesData) {
  currentActiveSeriesId = seriesId;
  seriesModalTitle.textContent = seriesData.title;
  seriesModalDesc.textContent = seriesData.description || 'لا يوجد وصف';
  seriesDetailsModal.classList.remove('hidden');
  
  await loadSeriesParts();
}

async function loadSeriesParts() {
  seriesPartsList.innerHTML = '<div class="text-center text-gray-500 py-4">جاري تحميل الأجزاء...</div>';
  try {
    const q = query(collection(db, "posts"), where("seriesId", "==", currentActiveSeriesId), orderBy("partNumber", "asc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      seriesPartsList.innerHTML = '<div class="text-center text-gray-500 py-8 bg-white rounded border">لا توجد أجزاء في هذه السلسلة بعد.</div>';
      return;
    }
    
    seriesPartsList.innerHTML = '';
    snapshot.forEach(docSnap => {
      const post = docSnap.data();
      const div = document.createElement('div');
      div.className = 'bg-white p-4 rounded border flex justify-between items-center gap-4';
      div.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="bg-red-100 text-red-800 w-10 h-10 flex items-center justify-center rounded font-bold text-lg shrink-0">${post.partNumber}</div>
          <div>
            <h5 class="font-bold text-gray-800 line-clamp-1">${post.title}</h5>
            <div class="text-xs text-gray-500 mt-1">المعرف: <span class="font-mono text-gray-400">${docSnap.id}</span></div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-change-part px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition" data-id="${docSnap.id}" data-current-part="${post.partNumber}">تغيير الترتيب</button>
          <button class="btn-remove-part px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 transition" data-id="${docSnap.id}">إزالة</button>
        </div>
      `;
      seriesPartsList.appendChild(div);
    });
    
    // Add event listeners for buttons
    seriesPartsList.querySelectorAll('.btn-remove-part').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;
        if(confirm('هل أنت متأكد من إزالة هذه القصة من السلسلة؟ لن يتم حذف القصة نفسها.')) {
          await removeFromSeries(postId);
        }
      });
    });
    
    seriesPartsList.querySelectorAll('.btn-change-part').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;
        const currentPart = e.target.dataset.currentPart;
        const newPartStr = prompt('أدخل رقم الجزء الجديد:', currentPart);
        if(newPartStr !== null) {
          const newPart = parseInt(newPartStr, 10);
          if(!isNaN(newPart) && newPart > 0 && newPart != currentPart) {
             await changePartNumber(postId, newPart);
          } else if(isNaN(newPart) || newPart <= 0) {
             alert('رقم غير صالح.');
          }
        }
      });
    });
    
  } catch (error) {
    console.error("Error loading parts:", error);
    seriesPartsList.innerHTML = '<div class="text-center text-red-500 py-4">حدث خطأ أثناء تحميل الأجزاء.</div>';
  }
}

async function loadAvailableStories() {
  availableStoriesList.innerHTML = '<div class="text-center text-gray-500 py-4">جاري جلب القصص المنشورة...</div>';
  searchStoryForSeries.value = '';
  try {
    const q = query(collection(db, "posts"), where("type", "==", "story"), where("status", "==", "published"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    if(snapshot.empty) {
      availableStoriesList.innerHTML = '<div class="text-center text-gray-500 py-4">لا توجد قصص منشورة متاحة.</div>';
      return;
    }
    
    availableStoriesList.innerHTML = '';
    snapshot.forEach(docSnap => {
      const post = docSnap.data();
      const div = document.createElement('div');
      div.className = 'story-item-card flex justify-between items-center p-3 border rounded hover:bg-gray-50 transition';
      div.dataset.title = post.title;
      
      let badge = '';
      if(post.seriesId) {
        if(post.seriesId === currentActiveSeriesId) {
           badge = '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold">مضافة حالياً</span>';
        } else {
           badge = '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-bold" title="تنتمي لسلسلة أخرى">مرتبطة مسبقاً</span>';
        }
      }
      
      div.innerHTML = `
        <div class="flex-1 mr-4 overflow-hidden">
          <div class="font-semibold text-gray-800 line-clamp-1">${post.title}</div>
          <div class="text-xs text-gray-500 mt-1">${docSnap.id} ${badge}</div>
        </div>
        <button class="btn-add-this shrink-0 px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition" data-id="${docSnap.id}" data-series="${post.seriesId || ''}" ${post.seriesId === currentActiveSeriesId ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>
          إضافة
        </button>
      `;
      availableStoriesList.appendChild(div);
    });
    
    availableStoriesList.querySelectorAll('.btn-add-this').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const btnEl = e.target;
        if(btnEl.disabled) return;
        
        const postId = btnEl.dataset.id;
        const oldSeriesId = btnEl.dataset.series;
        
        if (oldSeriesId && oldSeriesId !== currentActiveSeriesId) {
          if(!confirm('تحذير: هذه القصة مرتبطة بسلسلة أخرى بالفعل! هل تريد نقلها لهذه السلسلة؟ سيتم إنقاص العداد من السلسلة القديمة.')) {
            return;
          }
        }
        
        btnEl.disabled = true;
        btnEl.textContent = 'جاري...';
        await addToSeries(postId, oldSeriesId);
        btnEl.textContent = 'تم الإضافة';
        btnEl.classList.replace('bg-blue-600', 'bg-green-600');
        
        // Refresh details modal in background
        loadSeriesParts();
        loadSeries(); // refresh main list to update count
      });
    });
    
  } catch (error) {
    console.error(error);
    availableStoriesList.innerHTML = '<div class="text-center text-red-500 py-4">حدث خطأ.</div>';
  }
}

// Transaction: Add to Series
async function addToSeries(postId, oldSeriesId) {
  try {
    // Determine the next part number
    const q = query(collection(db, "posts"), where("seriesId", "==", currentActiveSeriesId), orderBy("partNumber", "desc"));
    const snap = await getDocs(q);
    let nextPart = 1;
    if (!snap.empty) {
       nextPart = snap.docs[0].data().partNumber + 1;
    }
    
    await runTransaction(db, async (transaction) => {
      // 1. Refs
      const seriesRef = doc(db, "series", currentActiveSeriesId);
      const postRef = doc(db, "posts", postId);
      let oldSeriesRef = null;
      
      // 2. Reads
      const seriesDoc = await transaction.get(seriesRef);
      if(!seriesDoc.exists()) throw "Series does not exist!";
      
      const postDoc = await transaction.get(postRef);
      if(!postDoc.exists()) throw "Post does not exist!";
      
      let oldSeriesDoc = null;
      if (oldSeriesId && oldSeriesId !== currentActiveSeriesId) {
        oldSeriesRef = doc(db, "series", oldSeriesId);
        oldSeriesDoc = await transaction.get(oldSeriesRef);
      }
      
      // 3. Writes
      let newCount = (seriesDoc.data().storyCount || 0) + 1;
      transaction.update(seriesRef, { storyCount: newCount });
      
      if (oldSeriesDoc && oldSeriesDoc.exists()) {
         let oldCount = Math.max(0, (oldSeriesDoc.data().storyCount || 0) - 1);
         transaction.update(oldSeriesRef, { storyCount: oldCount });
      }
      
      transaction.update(postRef, {
        seriesId: currentActiveSeriesId,
        partNumber: nextPart
      });
    });
  } catch(e) {
      console.error(e);
      alert('حدث خطأ أثناء الإضافة للسلسلة');
  }
}

async function removeFromSeries(postId) {
  try {
    await runTransaction(db, async (transaction) => {
      const seriesRef = doc(db, "series", currentActiveSeriesId);
      const postRef = doc(db, "posts", postId);
      
      const seriesDoc = await transaction.get(seriesRef);
      const postDoc = await transaction.get(postRef);
      
      if(seriesDoc.exists()) {
         let newCount = Math.max(0, (seriesDoc.data().storyCount || 0) - 1);
         transaction.update(seriesRef, { storyCount: newCount });
      }
      
      if(postDoc.exists()) {
         transaction.update(postRef, {
           seriesId: null,
           partNumber: null
         });
      }
    });
    
    loadSeriesParts();
    loadSeries(); // update count in main grid
  } catch(e) {
     console.error(e);
     alert('حدث خطأ أثناء الإزالة');
  }
}

async function changePartNumber(postId, newPart) {
  try {
    // Basic update, doesn't necessarily need a transaction for just partNumber unless handling swap.
    // For now, just update. If duplicate, UI might show two of same number, but it's manageable.
    // The requirement says "رفض أي تكرار لنفس الرقم داخل نفس السلسلة".
    
    // Check if new part number exists
    const q = query(collection(db, "posts"), where("seriesId", "==", currentActiveSeriesId), where("partNumber", "==", newPart));
    const snap = await getDocs(q);
    if (!snap.empty) {
      alert('هذا الرقم موجود بالفعل في هذه السلسلة. يرجى اختيار رقم آخر أو تغيير رقم القصة الأخرى أولاً.');
      return;
    }
    
    await runTransaction(db, async (transaction) => {
      const postRef = doc(db, "posts", postId);
      transaction.update(postRef, { partNumber: newPart });
    });
    
    loadSeriesParts();
  } catch(e) {
    console.error(e);
    alert('حدث خطأ أثناء تغيير الترتيب');
  }
}

