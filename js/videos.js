import { db } from './firebase-init.js';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UILoadingSkeleton, UIEmptyState, UIErrorState, generateStoryCard, generateNewsCard, generateVideoCard } from './ui-utils.js';

const form = document.getElementById('videos-filters');
const filterCategory = document.getElementById('filter-category');
const filterTag = document.getElementById('filter-tag');
const filterSort = document.getElementById('filter-sort');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const categoryChips = document.querySelectorAll('.category-chip');

const grid = document.getElementById('videos-grid');
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
  filterCategory.value = params.get('category') || '';
  filterTag.value = params.get('tag') || '';
  filterSort.value = params.get('sort') || 'desc';
  
  updateChipsUI();
  updateClearBtnVisibility();
}

// Update URL params
function updateUrlParams() {
  const url = new URL(window.location);
  if(filterCategory.value) url.searchParams.set('category', filterCategory.value); else url.searchParams.delete('category');
  if(filterTag.value.trim()) url.searchParams.set('tag', filterTag.value.trim()); else url.searchParams.delete('tag');
  if(filterSort.value && filterSort.value !== 'desc') url.searchParams.set('sort', filterSort.value); else url.searchParams.delete('sort');
  window.history.pushState({}, '', url);
  updateClearBtnVisibility();
}

function updateChipsUI() {
  categoryChips.forEach(chip => {
    if (chip.getAttribute('data-val') === filterCategory.value) {
      chip.classList.remove('border-gray-800/60', 'bg-[#0a0505]', 'text-gray-400');
      chip.classList.add('border-red-900', 'bg-red-900/20', 'text-white');
    } else {
      chip.classList.add('border-gray-800/60', 'bg-[#0a0505]', 'text-gray-400');
      chip.classList.remove('border-red-900', 'bg-red-900/20', 'text-white');
    }
  });
}

function updateClearBtnVisibility() {
  if (filterCategory.value || filterTag.value.trim() || filterSort.value !== 'desc') {
    clearFiltersBtn.classList.remove('hidden');
  } else {
    clearFiltersBtn.classList.add('hidden');
  }
}

async function loadData(isLoadMore = false) {
  if (isLoading || (isLoadMore && isEndOfData)) return;
  isLoading = true;

  if (!isLoadMore) {
    grid.innerHTML = UILoadingSkeleton(12);
    loadMoreContainer.classList.add('hidden');
    lastVisible = null;
    isEndOfData = false;
  } else {
    loadMoreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...';
    loadMoreBtn.disabled = true;
  }

  try {
    const qConstraints = [where("status", "==", "published"), where("type", "==", "video")];
    
    // Server-side filtering when possible
    const selectedCategory = filterCategory.value;
    const selectedTag = filterTag.value.trim();
    const sortValue = filterSort.value || 'desc';
    const sortField = sortValue === 'popular' ? 'views' : 'createdAt';
    const sortDirection = sortValue === 'popular' ? 'desc' : sortValue;
    
    if (selectedCategory) {
      qConstraints.push(where("category", "==", selectedCategory));
    }

    if (selectedTag) {
      qConstraints.push(where("tags", "array-contains", selectedTag));
    }

    qConstraints.push(orderBy(sortField, sortDirection));
    qConstraints.push(limit(PAGE_SIZE * 2)); // Fetch extra to account for potential scheduled posts

    if (isLoadMore && lastVisible) {
      qConstraints.push(startAfter(lastVisible));
    }

    const qRef = query(collection(db, "posts"), ...qConstraints);
    const snapshot = await getDocs(qRef);

    if (!isLoadMore) {
      grid.innerHTML = '';
    }

    if (snapshot.empty) {
      isEndOfData = true;
      if (!isLoadMore) {
        grid.innerHTML = UIEmptyState("لم نجد محتوى مطابقًا. جرّب إزالة بعض الفلاتر.", "fa-ghost");
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
          card.className = 'content-card-link';
          card.innerHTML = generateStoryCard(post, null, getCategoryName(post.category), null);
        } else if (post.type === 'video') {
          card.className = 'content-card-link';
          card.innerHTML = generateVideoCard(post, null, getCategoryName(post.category));
        } else {
          card.className = 'content-card-link';
          card.innerHTML = generateNewsCard(post, null, snippet, getCategoryName(post.category));
        }
        
        grid.appendChild(card);


      });
      
      if (snapshot.docs.length < PAGE_SIZE) {
        isEndOfData = true;
        loadMoreContainer.classList.add('hidden');
      } else {
        loadMoreContainer.classList.remove('hidden');
      }
    }

  } catch (error) {
    console.error("Explore fetch error:", error);
    if (!isLoadMore) {
      if (error.code === 'failed-precondition') {
        grid.innerHTML = UIErrorState("فهرس قاعدة البيانات غير مكتمل لتلك التركيبة من الفلاتر. حاول فلترة تصنيف واحد حتى يتم بناء الفهارس.", "retry-explore");
      } else {
        grid.innerHTML = UIErrorState("حدث خطأ في قراءة الأرشيف. قد تكون هناك مشكلة في الاتصال.", "retry-explore");
      }
      document.getElementById('retry-explore')?.addEventListener('click', () => loadData(false));
    }
  } finally {
    isLoading = false;
    if (isLoadMore) {
      loadMoreBtn.innerHTML = `
        <span class="relative z-10 flex items-center gap-2">
          تحميل المزيد <i class="fa-solid fa-chevron-down text-sm group-hover:translate-y-1 transition-transform"></i>
        </span>
        <div class="absolute inset-0 bg-red-900/20 -translate-x-[150%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out skew-x-12"></div>
      `;
      loadMoreBtn.disabled = false;
    }
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  updateUrlParams();
  loadData(false);
});

filterSort.addEventListener('change', () => {
  updateUrlParams();
  loadData(false);
});

categoryChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterCategory.value = chip.getAttribute('data-val');
    updateChipsUI();
    updateUrlParams();
    loadData(false);
  });
});

clearFiltersBtn.addEventListener('click', () => {
  filterCategory.value = '';
  filterTag.value = '';
  filterSort.value = 'desc';
  updateChipsUI();
  updateUrlParams();
  loadData(false);
});

window.addEventListener('popstate', () => {
  parseUrlParams();
  loadData(false);
});

loadMoreBtn.addEventListener('click', () => {
  loadData(true);
});

// Initial load
parseUrlParams();
loadData(false);
