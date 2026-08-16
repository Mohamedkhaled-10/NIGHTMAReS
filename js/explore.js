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
    qConstraints.push(limit(PAGE_SIZE));

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
      
      snapshot.forEach(doc => {
        const post = doc.data();
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
        card.className = 'bg-black/60 border border-gray-800 rounded-lg overflow-hidden shadow-lg hover:border-red-600 hover:shadow-red-900/50 transition transform hover:-translate-y-1 flex flex-col h-full';
        card.innerHTML = `
          <div class="h-48 overflow-hidden relative shrink-0">
            <img src="${post.coverImage || '/assets/images/icon-white.png'}" alt="${post.title}" class="w-full h-full object-cover" loading="lazy" decoding="async">
            <span class="absolute top-2 right-2 ${typeColor} text-white text-xs px-2 py-1 rounded shadow">${typeLabel}</span>
          </div>
          <div class="p-5 flex-1 flex flex-col">
            <h3 class="text-xl font-bold text-white mb-2 line-clamp-2">${post.title}</h3>
            <div>${categoryHtml}</div>
            <p class="text-gray-400 text-sm leading-relaxed mt-3 line-clamp-3">${snippet}</p>
          </div>
        `;
        
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
       errorState.innerHTML = `<p class="text-red-500 font-bold text-xl mb-2">فهرس قاعدة البيانات غير مكتمل لتلك التركيبة من الفلاتر.</p><p class="text-gray-400 text-sm">حاول فلترة تصنيف واحد (النوع أو التصنيف أو التاج) حتى يتم بناء الفهارس.</p>`;
    } else {
       errorState.innerHTML = `<p class="text-red-500 font-bold text-xl mb-2">حدث خطأ أثناء جلب المحتوى.</p><button id="retry-btn" class="text-gray-400 hover:text-white underline">حاول مرة أخرى</button>`;
       document.getElementById('retry-btn').addEventListener('click', () => { loadData(false); });
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
