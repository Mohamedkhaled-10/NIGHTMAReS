import { db } from './firebase-init.js';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UILoadingSkeleton, UIEmptyState, UIErrorState, generateStoryCard, generateNewsCard, generateVideoCard } from './ui-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-page-input');
  const searchForm = document.getElementById('search-page-form');
  const filterType = document.getElementById('filter-type');
  const filterCategory = document.getElementById('filter-category');
  const filterTag = document.getElementById('filter-tag');

  const resultsContainer = document.getElementById('results-container');
  const statsContainer = document.getElementById('search-stats');
  
  const loadMoreContainer = document.getElementById('load-more-container');
  const loadMoreBtn = document.getElementById('load-more-btn');

  let lastVisible = null;
  let isLoading = false;
  let isEndOfData = false;
  const BATCH_SIZE = 50; // Bound the Firestore reads

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

  // Parse URL parameters
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if(params.has('q')) searchInput.value = params.get('q');
    if(params.has('type')) filterType.value = params.get('type');
    if(params.has('category')) filterCategory.value = params.get('category');
    if(params.has('tag')) filterTag.value = params.get('tag');
  }

  // Update URL Params
  function updateUrlParams() {
    const url = new URL(window.location);
    if(searchInput.value.trim()) url.searchParams.set('q', searchInput.value.trim()); else url.searchParams.delete('q');
    if(filterType.value) url.searchParams.set('type', filterType.value); else url.searchParams.delete('type');
    if(filterCategory.value) url.searchParams.set('category', filterCategory.value); else url.searchParams.delete('category');
    if(filterTag.value.trim()) url.searchParams.set('tag', filterTag.value.trim()); else url.searchParams.delete('tag');
    window.history.pushState({}, '', url);
  }

  function highlightText(text, term) {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight-match">$1</span>');
  }

  async function performSearch(isLoadMore = false) {
    if (isLoading || (isLoadMore && isEndOfData)) return;
    isLoading = true;

    const searchQuery = searchInput.value.trim().toLowerCase();

    if (!isLoadMore) {
      resultsContainer.innerHTML = UILoadingSkeleton(12);
      statsContainer.classList.add('hidden');
      loadMoreContainer.classList.add('hidden');
      lastVisible = null;
      isEndOfData = false;
    } else {
      loadMoreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري المسح...';
      loadMoreBtn.disabled = true;
    }

    try {
      const qConstraints = [where("status", "==", "published")];
      
      const selectedType = filterType.value;
      const selectedCategory = filterCategory.value;
      const selectedTag = filterTag.value.trim();

      if (selectedType) qConstraints.push(where("type", "==", selectedType));
      if (selectedCategory) qConstraints.push(where("category", "==", selectedCategory));
      if (selectedTag) qConstraints.push(where("tags", "array-contains", selectedTag));

      qConstraints.push(orderBy("createdAt", "desc"));
      qConstraints.push(limit(BATCH_SIZE));

      if (isLoadMore && lastVisible) {
        qConstraints.push(startAfter(lastVisible));
      }

      const qRef = query(collection(db, "posts"), ...qConstraints);
      const snapshot = await getDocs(qRef);

      if (!isLoadMore) resultsContainer.innerHTML = '';

      if (snapshot.empty) {
        isEndOfData = true;
        if (!isLoadMore && resultsContainer.children.length === 0) {
          resultsContainer.innerHTML = UIEmptyState("لم يتم العثور على أي نتائج تطابق بحثك. جرب كلمات مختلفة.", "fa-search-minus");
        }
        loadMoreContainer.classList.add('hidden');
      } else {
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        
        let matchesFound = 0;

        snapshot.forEach(doc => {
          const post = doc.data();
          const titleRaw = post.title || '';
          const contentRaw = post.data?.contentHtml || '';
          
          let snippetText = '';
          if (contentRaw) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = contentRaw;
            snippetText = tempDiv.textContent || tempDiv.innerText || '';
          }

          let isPublished = true;
          if (post.publishAt) {
            const now = new Date();
            const pDate = post.publishAt.toDate ? post.publishAt.toDate() : new Date(post.publishAt);
            if (pDate > now) isPublished = false;
          }

          // Text Matching
          let isMatch = isPublished;
          if (isMatch && searchQuery) {
             const titleMatch = titleRaw.toLowerCase().includes(searchQuery);
             const contentMatch = snippetText.toLowerCase().includes(searchQuery);
             isMatch = titleMatch || contentMatch;
          }

          if (isMatch) {
            matchesFound++;
            
            const link = `/${post.type}/${post.slug}`;
            const typeLabel = post.type === 'story' ? 'قصة' : post.type === 'video' ? 'فيديو' : 'خبر';
            const typeColor = post.type === 'story' ? 'bg-red-900' : post.type === 'video' ? 'bg-blue-900' : 'bg-green-900';
            const categoryHtml = post.category ? `<span class="bg-red-900/40 text-red-300 text-xs px-2 py-1 rounded border border-red-900/50 mt-2 inline-block">${getCategoryName(post.category)}</span>` : '';

            // Highlighting
            let displayTitle = searchQuery ? highlightText(titleRaw, searchQuery) : titleRaw;
            
            // Find context for snippet if searched
            let displaySnippet = '';
            if (searchQuery && snippetText.toLowerCase().includes(searchQuery)) {
              const matchIdx = snippetText.toLowerCase().indexOf(searchQuery);
              const startIdx = Math.max(0, matchIdx - 40);
              const endIdx = Math.min(snippetText.length, matchIdx + searchQuery.length + 40);
              displaySnippet = (startIdx > 0 ? '...' : '') + snippetText.substring(startIdx, endIdx) + (endIdx < snippetText.length ? '...' : '');
              displaySnippet = highlightText(displaySnippet, searchQuery);
            } else {
              displaySnippet = snippetText.substring(0, 100) + '...';
            }

            
            const card = document.createElement('a');
            card.href = link;
            
            if (post.type === 'story') {
              card.className = 'content-card-link';
              card.innerHTML = generateStoryCard(post, displayTitle, getCategoryName(post.category), null);
            } else if (post.type === 'video') {
              card.className = 'content-card-link';
              card.innerHTML = generateVideoCard(post, displayTitle, getCategoryName(post.category));
            } else {
              card.className = 'content-card-link';
              card.innerHTML = generateNewsCard(post, displayTitle, displaySnippet, getCategoryName(post.category));
            }
            
            resultsContainer.appendChild(card);

          }
        });

        resultsContainer.classList.remove('hidden');
        
        if (snapshot.docs.length < BATCH_SIZE) {
          isEndOfData = true;
          loadMoreContainer.classList.add('hidden');
        } else {
          loadMoreContainer.classList.remove('hidden');
        }

        if (matchesFound === 0 && !isEndOfData && resultsContainer.children.length === 0) {
           resultsContainer.innerHTML = UIEmptyState("لم نجد نتائج في هذه الدفعة من المحتوى. جرب مسح الدفعة الأقدم.", "fa-search-minus");
        }
      }

    } catch (error) {
      console.error("Search error:", error);
      if (!isLoadMore) {
        if (error.code === 'failed-precondition') {
          resultsContainer.innerHTML = UIErrorState("فهرس قاعدة البيانات غير مكتمل لتلك التركيبة من الفلاتر. حاول استخدام فلتر واحد فقط.", "retry-search");
        } else {
          resultsContainer.innerHTML = UIErrorState("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.", "retry-search");
        }
        document.getElementById('retry-search')?.addEventListener('click', () => performSearch(false));
      }
    } finally {
      isLoading = false;
      if (isLoadMore) {
        loadMoreBtn.innerHTML = `
          <span class="relative z-10 flex items-center gap-2">
            البحث في الدفعة الأقدم <i class="fa-solid fa-clock-rotate-left text-sm group-hover:-rotate-90 transition-transform duration-500"></i>
          </span>
          <div class="absolute inset-0 bg-red-900/20 -translate-x-[150%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out skew-x-12"></div>
        `;
        loadMoreBtn.disabled = false;
      }
    }
  }

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    updateUrlParams();
    performSearch(false);
  });

  loadMoreBtn.addEventListener('click', () => {
    performSearch(true);
  });

  // Initial load
  parseUrlParams();
  if (searchInput.value || filterType.value || filterCategory.value || filterTag.value) {
    performSearch(false);
  } else {
    // Show stats container to tell user to enter something
    statsContainer.textContent = "أدخل كلمة للبحث أو اختر فلاتر...";
    statsContainer.classList.remove('hidden');
  }
});
