// js/article.js
import { db } from './firebase-init.js';
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const pathParts = window.location.pathname.split('/').filter(p => p);
  
  if (pathParts.length < 2) {
    showError("مسار غير صالح.");
    return;
  }

  const type = pathParts[0]; // e.g., 'story', 'news', 'video'
  const slug = decodeURIComponent(pathParts[1]);

  try {
    const q = query(
      collection(db, "posts"),
      where("type", "==", type),
      where("slug", "==", slug),
      where("status", "==", "published")
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      showError("عذراً، لم يتم العثور على المحتوى أو أنه غير متاح حالياً.");
      return;
    }

    // Assuming slug is unique per type
    const doc = querySnapshot.docs[0];
    const docData = { id: doc.id, ...doc.data() };
    renderContent(docData);
    
  } catch (error) {
    console.error("Error fetching content:", error);
    showError("حدث خطأ أثناء جلب البيانات.");
  }
});

function renderContent(data) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content-area').classList.remove('hidden');

  // Update Title
  document.title = `${data.title} - Nightmares`;
  document.getElementById('article-title').textContent = data.title;

  // Render Taxonomy (Category and Tags)
  const taxonomyContainer = document.getElementById('article-taxonomy');
  const categoryEl = document.getElementById('article-category');
  const tagsContainer = document.getElementById('article-tags');
  
  let hasTaxonomy = false;
  
  if (data.category) {
    categoryEl.textContent = getCategoryName(data.category);
    categoryEl.style.display = 'inline-block';
    hasTaxonomy = true;
  } else {
    categoryEl.style.display = 'none';
  }

  tagsContainer.innerHTML = '';
  if (Array.isArray(data.tags) && data.tags.length > 0) {
    data.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'bg-[#1b0d0d] text-gray-400 px-3 py-1 rounded-full text-xs font-semibold border border-red-900/30 hover:text-white hover:border-red-600 transition-colors cursor-pointer';
      tagEl.textContent = '#' + tag;
      tagsContainer.appendChild(tagEl);
    });
    hasTaxonomy = true;
  }

  if (hasTaxonomy) {
    taxonomyContainer.classList.remove('hidden');
  } else {
    taxonomyContainer.classList.add('hidden');
  }

  // Render Cover Image
  const coverImageContainer = document.getElementById('cover-image-container');
  const coverImageEl = document.getElementById('article-cover-image');
  
  if (data.coverImage) {
    coverImageEl.src = data.coverImage;
    coverImageEl.alt = data.title;
    coverImageContainer.style.display = 'block';
  } else {
    // Hide if there's no cover image to avoid broken images
    coverImageContainer.style.display = 'none';
  }

  // Render HTML Content (depending on type, but generally it's in data.data.contentHtml or similar)
  const articleBody = document.getElementById('article-body');
  
  // Process content HTML to add lazy loading for performance
  let rawHtml = data.data?.contentHtml || '';
  
  if (rawHtml) {
    // Basic regex replacement to add loading="lazy" to imgs and iframes if not already present
    rawHtml = rawHtml.replace(/<(img|iframe)(?![^>]*loading=)/gi, '<$1 loading="lazy" decoding="async"');
  }

  if (data.type === 'video' && data.data && data.data.embedCode) {
    let embed = data.data.embedCode.replace(/<iframe(?![^>]*loading=)/gi, '<iframe loading="lazy"');
    articleBody.innerHTML = `<div class="video-container">${embed}</div>`;
    if (rawHtml) {
      articleBody.innerHTML += rawHtml;
    }
  } else if (rawHtml) {
    articleBody.innerHTML = rawHtml;
  } else {
    articleBody.innerHTML = "<p>لا يوجد محتوى متاح.</p>";
  }

  // Setup sharing links
  const currentUrl = encodeURIComponent(window.location.href);
  document.getElementById('share-whatsapp').href = `https://wa.me/?text=${currentUrl}`;
  document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;

  // Show navbar after loading
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.classList.add('show');

  // Load related content
  loadRelatedContent(data);
}

async function loadRelatedContent(currentArticle) {
  const relatedSection = document.getElementById('related-content-section');
  const relatedGrid = document.getElementById('related-grid');
  if (!relatedSection || !relatedGrid) return;

  try {
    let qConstraints = [where("status", "==", "published")];
    
    // Prioritize by Category, fallback to Type
    if (currentArticle.category) {
      qConstraints.push(where("category", "==", currentArticle.category));
    } else {
      qConstraints.push(where("type", "==", currentArticle.type));
    }
    
    qConstraints.push(orderBy("createdAt", "desc"));
    qConstraints.push(limit(7)); // Fetch one extra in case the current article is included

    const qRef = query(collection(db, "posts"), ...qConstraints);
    const snapshot = await getDocs(qRef);
    
    let results = [];
    snapshot.forEach(doc => {
      if (doc.id !== currentArticle.id) {
        results.push({ id: doc.id, ...doc.data() });
      }
    });

    // If we didn't find enough items by category and there was a category, try filling up by type
    if (results.length < 3 && currentArticle.category) {
       const fallbackQRef = query(
         collection(db, "posts"),
         where("status", "==", "published"),
         where("type", "==", currentArticle.type),
         orderBy("createdAt", "desc"),
         limit(7)
       );
       const fallbackSnapshot = await getDocs(fallbackQRef);
       fallbackSnapshot.forEach(doc => {
         if (doc.id !== currentArticle.id && !results.find(r => r.id === doc.id)) {
           results.push({ id: doc.id, ...doc.data() });
         }
       });
    }

    results = results.slice(0, 6); // Max 6 items

    if (results.length === 0) {
      return; // Keep hidden
    }

    relatedGrid.innerHTML = '';
    results.forEach(post => {
      const link = `/${post.type}/${post.slug}`;
      const typeLabel = post.type === 'story' ? 'قصة' : post.type === 'video' ? 'فيديو' : 'خبر';
      const typeColor = post.type === 'story' ? 'bg-red-900' : post.type === 'video' ? 'bg-blue-900' : 'bg-green-900';
      
      const card = document.createElement('a');
      card.href = link;
      card.className = 'bg-black/60 border border-gray-800 rounded-lg overflow-hidden shadow-lg hover:border-red-600 hover:shadow-red-900/50 transition transform hover:-translate-y-1 block';
      card.innerHTML = `
        <div class="h-40 overflow-hidden relative">
          <img src="${post.coverImage || '/assets/images/icon-white.png'}" alt="${post.title}" class="w-full h-full object-cover" loading="lazy" decoding="async">
          <span class="absolute top-2 right-2 ${typeColor} text-white text-xs px-2 py-1 rounded shadow">${typeLabel}</span>
        </div>
        <div class="p-4">
          <h3 class="text-lg font-bold text-white mb-1 line-clamp-2">${post.title}</h3>
        </div>
      `;
      relatedGrid.appendChild(card);
    });

    relatedSection.classList.remove('hidden');
  } catch (error) {
    console.error("Error loading related content:", error);
  }
}

function showError(message) {
  const loadingEl = document.getElementById('loading');
  loadingEl.textContent = message;
  loadingEl.style.color = '#ff0000';
}

// Scroll Progress and Scroll-to-Top Logic
window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = (scrollTop / scrollHeight) * 100;
  
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) progressBar.style.width = progress + '%';

  const scrollToTopBtn = document.getElementById('scrollToTop');
  if (scrollToTopBtn) {
    if (scrollTop > 300) {
      scrollToTopBtn.classList.add('show');
      scrollToTopBtn.style.display = 'block';
    } else {
      scrollToTopBtn.classList.remove('show');
      scrollToTopBtn.style.display = 'none';
    }
  }
});

const scrollToTopBtn = document.getElementById('scrollToTop');
if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

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

