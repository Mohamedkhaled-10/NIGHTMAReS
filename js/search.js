import { db } from './firebase-init.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('search-page-input');
  const searchForm = document.getElementById('search-page-form');
  const loading = document.getElementById('loading');
  const resultsContainer = document.getElementById('results-container');
  const statsContainer = document.getElementById('search-stats');

  // Get Query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q') || '';
  
  if (q) {
    searchInput.value = q;
    await performSearch(q.toLowerCase().trim());
  } else {
    loading.classList.add('hidden');
    statsContainer.textContent = "أدخل كلمة للبحث...";
    statsContainer.classList.remove('hidden');
  }

  // Handle new searches on the page
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newQuery = searchInput.value.trim();
    if (newQuery) {
      window.history.pushState({}, '', `?q=${encodeURIComponent(newQuery)}`);
      performSearch(newQuery.toLowerCase());
    }
  });

  async function performSearch(searchQuery) {
    loading.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    statsContainer.classList.add('hidden');
    resultsContainer.innerHTML = '';

    try {
      // Fetch all published posts (Client-side filtering for small/medium DBs is optimal here)
      const qRef = query(collection(db, "posts"), where("status", "==", "published"));
      const snapshot = await getDocs(qRef);
      
      let results = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        const content = (data.data?.contentHtml || '').toLowerCase();
        
        // Simple text matching
        if (title.includes(searchQuery) || content.includes(searchQuery)) {
          results.push(data);
        }
      });

      loading.classList.add('hidden');
      statsContainer.textContent = `تم العثور على ${results.length} نتيجة لـ "${searchQuery}"`;
      statsContainer.classList.remove('hidden');
      resultsContainer.classList.remove('hidden');

      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="col-span-full text-center text-xl text-gray-400 py-10">لم يتم العثور على أية نتائج مطابقة.</div>';
        return;
      }

      results.forEach(post => {
        const link = `/${post.type}/${post.slug}`;
        const typeLabel = post.type === 'story' ? 'قصة' : post.type === 'video' ? 'فيديو' : 'خبر';
        const typeColor = post.type === 'story' ? 'bg-red-900' : post.type === 'video' ? 'bg-blue-900' : 'bg-green-900';
        
        // Create snippet from HTML content
        let snippet = '';
        if (post.data?.contentHtml) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = post.data.contentHtml;
          snippet = tempDiv.textContent || tempDiv.innerText || '';
          snippet = snippet.substring(0, 100) + '...';
        }

        const card = document.createElement('a');
        card.href = link;
        card.className = 'bg-black/60 border border-gray-800 rounded-lg overflow-hidden shadow-lg hover:border-red-600 hover:shadow-red-900/50 transition transform hover:-translate-y-1 block';
        
        card.innerHTML = `
          <div class="h-48 overflow-hidden relative">
            <img src="${post.coverImage || '/images/default-cover.jpg'}" alt="${post.title}" class="w-full h-full object-cover">
            <span class="absolute top-2 right-2 ${typeColor} text-white text-xs px-2 py-1 rounded shadow">${typeLabel}</span>
          </div>
          <div class="p-5">
            <h3 class="text-xl font-bold text-white mb-2 truncate">${post.title}</h3>
            <p class="text-gray-400 text-sm leading-relaxed">${snippet}</p>
          </div>
        `;
        
        resultsContainer.appendChild(card);
      });

    } catch (error) {
      console.error("Search error:", error);
      loading.classList.add('hidden');
      statsContainer.textContent = "حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.";
      statsContainer.classList.remove('hidden');
    }
  }
});
