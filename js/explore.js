import { db } from './firebase-init.js';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const form = document.getElementById('explore-filters');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const filterTag = document.getElementById('filter-tag');

const grid = document.getElementById('explore-grid');
const loading = document.getElementById('explore-loading');
const errorState = document.getElementById('explore-error');
const emptyState = document.getElementById('explore-empty');
const loadMoreBtn = document.getElementById('load-more-btn');
const loadMoreContainer = document.getElementById('load-more-container');

let lastVisible = null;
let isLoading = false;
let isEndOfData = false;
const PAGE_SIZE = 12;

function getCategoryName(id) {
  const categories = {
    'horror': 'رعب (Horror)',
    'mystery': 'غموض (Mystery)',
    'true_crime': 'جرائم حقيقية (True Crime)',
    'paranormal': 'ما وراء الطبيعة (Paranormal)',
    'legends': 'أساطير (Legends)',
    'movies': 'أفلام (Movies)',
    'games': 'ألعاب (Games)'
  };
  return categories[id] || id;
}

// Read URL params
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if(params.has('type')) filterType.value = params.get('type');
  if(params.has('category')) filterCategory.value = params.get('category');
  if(params.has('tag')) filterTag.value = params.get('tag');
}

// Update URL params
function updateUrlParams() {
  const url = new URL(window.location);
  if(filterType.value) url.searchParams.set('type', filterType.value); else url.searchParams.delete('type');
  if(filterCategory.value) url.searchParams.set('category', filterCategory.value); else url.searchParams.delete('category');
  if(filterTag.value.trim()) url.searchParams.set('tag', filterTag.value.trim()); else url.searchParams.delete('tag');
  window.history.pushState({}, '', url);
}

async function loadData(isLoadMore = false) {
  if (isLoading || (isLoadMore && isEndOfData)) return;
  isLoading = true;

  if (!isLoadMore) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    loadMoreContainer.classList.add('hidden');
    loading.classList.remove('hidden');
    lastVisible = null;
    isEndOfData = false;
  } else {
    loadMoreBtn.textContent = 'جاري التحميل...';
    loadMoreBtn.disabled = true;
  }

  try {
    const qConstraints = [where("status", "==", "published")];
    
    // Server-side filtering when possible
    const selectedType = filterType.value;
    const selectedCategory = filterCategory.value;
    const selectedTag = filterTag.value.trim();

    if (selectedType) {
      qConstraints.push(where("type", "==", selectedType));
    }
    
    if (selectedCategory) {
      qConstraints.push(where("category", "==", selectedCategory));
    }

    if (selectedTag) {
      qConstraints.push(where("tags", "array-contains", selectedTag));
    }

    qConstraints.push(orderBy("createdAt", "desc"));
    qConstraints.push(limit(PAGE_SIZE * 2)); // Fetch extra to account for potential scheduled posts

    if (isLoadMore && lastVisible) {
      qConstraints.push(startAfter(lastVisible));
    }

    const qRef = query(collection(db, "posts"), ...qConstraints);
    const snapshot = await getDocs(qRef);

    if (!isLoadMore) {
      loading.classList.add('hidden');
    }

    if (snapshot.empty) {
      isEndOfData = true;
      if (!isLoadMore) {
        emptyState.classList.remove('hidden');
      } else {
        loadMoreContainer.classList.add('hidden');
      }
    } else {
      lastVisible = snapshot.docs[snapshot.docs.length - 1];
      
      const now = new Date();
      let displayedCount = 0;

      snapshot.forEach(doc => {
        const post = doc.data();
        
        let isPublished = true;
        if (post.publishAt) {
          const pDate = post.publishAt.toDate ? post.publishAt.toDate() : new Date(post.publishAt);
          if (pDate > now) isPublished = false;
        }
        
        if (!isPublished || displayedCount >= PAGE_SIZE) return;
        displayedCount++;

        const link = `/${post.type}/${post.slug}`;
        const typeLabel = post.type === 'story' ? 'قصة' : post.type === 'video' ? 'فيديو' : 'خبر';
        const typeColor = post.type === 'story' ? 'bg-red-900' : post.type === 'video' ? 'bg-blue-900' : 'bg-green-900';
        
        let snippet = '';
        if (post.data?.contentHtml) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = post.data.contentHtml;
          snippet = tempDiv.textContent || tempDiv.innerText || '';
          snippet = snippet.substring(0, 100) + '...';
        }

        const categoryHtml = post.category ? `<span class="bg-red-900/40 text-red-300 text-xs px-2 py-1 rounded border border-red-900/50 mt-2 inline-block">${getCategoryName(post.category)}</span>` : '';

        
        
        const card = document.createElement('a');
        card.href = link;
        
        if (post.type === 'story') {
          card.className = 'card block';
          card.innerHTML = `
            <div class="card-inner">
              <img src="${post.coverImage || '/assets/images/icon-white.png'}" alt="${post.title}" loading="lazy" decoding="async">
              <div class="overlay"></div>
              <div class="card-content">
                <span class="text-xs font-bold px-2 py-1 bg-red-900/50 text-red-200 border border-red-900/50 rounded mb-2 w-fit">${getCategoryName(post.category)}</span>
                <h3>${post.title}</h3>
                <span class="fake-btn">اقرأ القصة <i class="fa-solid fa-arrow-left text-xs"></i></span>
              </div>
            </div>
          `;
        } else if (post.type === 'video') {
          card.className = 'video-card h-full';
          card.innerHTML = `
            <div class="thumbnail-wrapper">
              <img src="${post.coverImage || '/assets/images/icon-white.png'}" alt="${post.title}" loading="lazy" decoding="async">
            </div>
            <div class="video-content flex-1 flex flex-col h-full bg-[#0a0505]">
              <span class="text-[10px] font-bold px-2 py-1 bg-gray-800 text-gray-300 rounded mb-2 w-fit border border-gray-700">${getCategoryName(post.category)}</span>
              <h3 class="line-clamp-2">${post.title}</h3>
            </div>
          `;
        } else {
          card.className = 'news-card h-full flex flex-col';
          card.innerHTML = `
            <div class="relative shrink-0 h-[320px]">
              <img src="${post.coverImage || '/assets/images/icon-white.png'}" alt="${post.title}" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover">
              <span class="absolute top-3 right-3 bg-red-900/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md z-10">${getCategoryName(post.category)}</span>
            </div>
            <div class="news-content flex-1 flex flex-col p-4 bg-[#0a0505]">
              <h3 class="line-clamp-2">${post.title}</h3>
              <p class="news-text line-clamp-3 mb-4">${snippet}</p>
              <span class="read-more-btn mt-auto self-start">اقرأ المزيد</span>
            </div>
          `;
        }
        
        grid.appendChild(card);


      });

      grid.classList.remove('hidden');
      
      if (snapshot.docs.length < PAGE_SIZE) {
        isEndOfData = true;
        loadMoreContainer.classList.add('hidden');
      } else {
        loadMoreContainer.classList.remove('hidden');
      }
    }

  } catch (error) {
    console.error("Explore fetch error:", error);
    if (error.code === 'failed-precondition') {
       const msgEl = document.getElementById('error-message-text');
       if (msgEl) msgEl.innerText = 'فهرس قاعدة البيانات غير مكتمل لتلك التركيبة من الفلاتر. حاول فلترة تصنيف واحد (النوع أو التصنيف أو التاج) حتى يتم بناء الفهارس.';
       else errorState.innerHTML = '<p class="text-red-500 font-bold text-xl mb-2">فهرس قاعدة البيانات غير مكتمل لتلك التركيبة من الفلاتر.</p><p class="text-gray-400 text-sm">حاول فلترة تصنيف واحد (النوع أو التصنيف أو التاج) حتى يتم بناء الفهارس.</p>';
    } else {
       const msgEl = document.getElementById('error-message-text');
       if (msgEl) {
           msgEl.innerText = 'حدث خطأ أثناء جلب المحتوى.';
           const retryBtn = document.getElementById('retry-btn');
           if (retryBtn) {
               // Remove old listeners by cloning
               const newBtn = retryBtn.cloneNode(true);
               retryBtn.parentNode.replaceChild(newBtn, retryBtn);
               newBtn.addEventListener('click', () => { loadData(false); });
           }
       } else {
           errorState.innerHTML = '<p class="text-red-500 font-bold text-xl mb-2">حدث خطأ أثناء جلب المحتوى.</p><button id="retry-btn" class="text-gray-400 hover:text-white underline">حاول مرة أخرى</button>';
           document.getElementById('retry-btn').addEventListener('click', () => { loadData(false); });
       }
    }
    if (!isLoadMore) {
      loading.classList.add('hidden');
      errorState.classList.remove('hidden');
    }
  } finally {
    isLoading = false;
    if (isLoadMore) {
      loadMoreBtn.textContent = 'تحميل المزيد';
      loadMoreBtn.disabled = false;
    }
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  updateUrlParams();
  loadData(false);
});

loadMoreBtn.addEventListener('click', () => {
  loadData(true);
});

// Initial load
parseUrlParams();
loadData(false);
