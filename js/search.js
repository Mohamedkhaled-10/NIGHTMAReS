import { db } from './firebase-init.js';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-page-input');
  const searchForm = document.getElementById('search-page-form');
  const filterType = document.getElementById('filter-type');
  const filterCategory = document.getElementById('filter-category');
  const filterTag = document.getElementById('filter-tag');

  const loading = document.getElementById('loading');
  const resultsContainer = document.getElementById('results-container');
  const statsContainer = document.getElementById('search-stats');
  const emptyState = document.getElementById('empty-state');
  
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
      resultsContainer.innerHTML = '';
      resultsContainer.classList.add('hidden');
      emptyState.classList.add('hidden');
      statsContainer.classList.add('hidden');
      loadMoreContainer.classList.add('hidden');
      loading.classList.remove('hidden');
      lastVisible = null;
      isEndOfData = false;
    } else {
      loadMoreBtn.textContent = 'جاري المسح...';
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

      if (!isLoadMore) loading.classList.add('hidden');

      if (snapshot.empty) {
        isEndOfData = true;
        if (!isLoadMore && resultsContainer.children.length === 0) {
          emptyState.classList.remove('hidden');
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
            card.className = 'bg-black/60 border border-gray-800 rounded-lg overflow-hidden shadow-lg hover:border-red-600 hover:shadow-red-900/50 transition transform hover:-translate-y-1 flex flex-col h-full';
            card.innerHTML = `
              <div class="h-48 overflow-hidden relative shrink-0">
                <img src="${post.coverImage || '/assets/images/icon-white.png'}" alt="${post.title}" class="w-full h-full object-cover" loading="lazy" decoding="async">
                <span class="absolute top-2 right-2 ${typeColor} text-white text-xs px-2 py-1 rounded shadow">${typeLabel}</span>
              </div>
              <div class="p-5 flex-1 flex flex-col">
                <h3 class="text-xl font-bold text-white mb-2 line-clamp-2">${displayTitle}</h3>
                <div>${categoryHtml}</div>
                <p class="text-gray-400 text-sm leading-relaxed mt-3">${displaySnippet}</p>
              </div>
            `;
            
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

        // If no matches found in this batch, inform user but keep load more active
        if (matchesFound === 0 && !isEndOfData && resultsContainer.children.length === 0) {
           statsContainer.innerHTML = `لم نجد نتائج في هذه الدفعة من المحتوى. <button onclick="document.getElementById('load-more-btn').click()" class="text-red-500 underline hover:text-red-400">ابحث في الدفعة الأقدم</button>`;
           statsContainer.classList.remove('hidden');
        } else if (resultsContainer.children.length > 0) {
           statsContainer.classList.add('hidden'); // Hide if we have some results
        }
      }

    } catch (error) {
      console.error("Search error:", error);
      if (error.code === 'failed-precondition') {
        statsContainer.innerHTML = `<span class="text-red-500">فهرس قاعدة البيانات غير مكتمل لتلك التركيبة من الفلاتر. حاول استخدام فلتر واحد فقط حتى يتم بناء الفهارس.</span>`;
      } else {
        statsContainer.textContent = "حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.";
      }
      statsContainer.classList.remove('hidden');
      if (!isLoadMore) loading.classList.add('hidden');
    } finally {
      isLoading = false;
      if (isLoadMore) {
        loadMoreBtn.textContent = 'مسح الدفعة الأقدم';
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
