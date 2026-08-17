// js/article.js
import { db, auth } from './firebase-init.js';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { UISpinner, UIErrorState } from './ui-utils.js';

const initArticle = async () => {
  const loadingEl = document.getElementById('loading');
  loadingEl.innerHTML = UISpinner("جاري تحميل المحتوى...");

  const pathParts = window.location.pathname.split('/').filter(p => p);
  
  if (pathParts.length < 2) {
    showError("مسار غير صالح.");
    return;
  }

  const type = pathParts[0]; // e.g., 'story', 'news', 'video'
  const slug = decodeURIComponent(pathParts[1]);
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true';

  const fetchPost = async () => {
    try {
      let q;
      if (isPreview) {
        q = query(
          collection(db, "posts"),
          where("type", "==", type),
          where("slug", "==", slug)
        );
      } else {
        q = query(
          collection(db, "posts"),
          where("type", "==", type),
          where("slug", "==", slug),
          where("status", "==", "published")
        );
      }

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        showError("عذراً، لم يتم العثور على المحتوى أو أنه غير متاح حالياً.");
        return;
      }

      // Assuming slug is unique per type
      const docSnap = querySnapshot.docs[0];
      const docData = { id: docSnap.id, ...docSnap.data() };
      
      // Handle Scheduled Posts
      if (!isPreview && docData.publishAt) {
        const publishDate = docData.publishAt.toDate ? docData.publishAt.toDate() : new Date(docData.publishAt);
        if (publishDate > new Date()) {
          showError("عذراً، هذا المحتوى غير متاح حالياً (مجدول للنشر لاحقاً).");
          return;
        }
      }
      
      if (isPreview && docData.status !== 'published') {
        // Add a preview banner
        const banner = document.createElement('div');
        banner.className = 'bg-orange-500 text-white text-center py-2 font-bold';
        banner.textContent = 'وضع المعاينة: هذا المحتوى غير منشور (مسودة).';
        document.body.prepend(banner);
      }
      
      renderContent(docData);
      
    } catch (error) {
      console.error("Error fetching content:", error);
      showError("حدث خطأ أثناء جلب البيانات أو ليس لديك صلاحية لمعاينتها.");
    }
  };

  if (isPreview) {
    // Wait for auth to settle
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      fetchPost();
    });
  } else {
    fetchPost();
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initArticle);
} else {
  initArticle();
}

async function renderContent(data) {
  document.getElementById('loading').classList.add('hidden');
  const contentArea = document.getElementById('content-area');
  contentArea.classList.remove('hidden');
  contentArea.classList.add('flex');

  // Update Title and SEO
  document.title = `${data.title} - Nightmares`;
  document.getElementById('article-title').textContent = data.title;
  
  // Update Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = data.seoDescription || data.title;

  // Open Graph / Twitter Card
  const currentUrl = window.location.href.split('?')[0]; // clean url without preview param
  
  const setMeta = (name, content, isProperty = false) => {
    if (!content) return;
    let meta = document.querySelector(`meta[${isProperty ? 'property' : 'name'}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      if (isProperty) meta.setAttribute('property', name);
      else meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  setMeta('og:title', data.title, true);
  setMeta('og:description', data.seoDescription || data.title, true);
  setMeta('og:image', data.coverImage || (window.location.origin + '/assets/images/icon-white.png'), true);
  setMeta('og:url', currentUrl, true);
  setMeta('og:type', 'article', true);
  
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', data.title);
  setMeta('twitter:description', data.seoDescription || data.title);
  setMeta('twitter:image', data.coverImage || (window.location.origin + '/assets/images/icon-white.png'));

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = currentUrl;

  // Structured Data (JSON-LD Schema)
  let schemaScript = document.querySelector('#schema-article');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'schema-article';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }
  
  const schemaObj = {
    "@context": "https://schema.org",
    "@type": data.type === 'video' ? "VideoObject" : "Article",
    "headline": data.title,
    "description": data.seoDescription || data.title,
    "image": data.coverImage ? [data.coverImage] : [],
    "datePublished": data.publishAt ? new Date(data.publishAt.seconds * 1000).toISOString() : (data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString()),
    "dateModified": data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toISOString() : undefined,
    "author": {
      "@type": "Person",
      "name": "Nightmares" // will update after fetching author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Nightmares",
      "logo": {
        "@type": "ImageObject",
        "url": window.location.origin + "/assets/images/icon-white.png"
      }
    }
  };
  
  if (data.type === 'video') {
    schemaObj.name = data.title;
    schemaObj.uploadDate = schemaObj.datePublished;
  }
  
  schemaScript.textContent = JSON.stringify(schemaObj);

  // Resolve Author Non-Blocking
  if (data.authorUid) {
    getDoc(doc(db, 'users', data.authorUid)).then(authorDoc => {
      if (authorDoc.exists()) {
        const authorData = authorDoc.data();
        document.getElementById('article-author-name').textContent = authorData.displayName || 'مستخدم';
        if (authorData.photoURL) {
          document.getElementById('article-author-avatar').src = authorData.photoURL;
        }
        document.getElementById('article-author-link').href = `/author/${data.authorUid}`;
        document.getElementById('article-author').classList.remove('hidden');
        
        // Update schema non-blocking too if needed
      }
    }).catch(e => console.error("Error fetching author details:", e));
  }

  // Set Date and Read Time
  const dateText = document.getElementById('article-date-text');
  const readTimeText = document.getElementById('article-read-time-text');
  
  if (dateText) {
    const publishDate = data.publishAt ? (data.publishAt.toDate ? data.publishAt.toDate() : new Date(data.publishAt)) : 
                        (data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date());
    dateText.textContent = publishDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (readTimeText) {
    let readMins = 0;
    if (data.data?.readTimeMinutes) {
      readMins = data.data.readTimeMinutes;
    } else if (data.data?.contentHtml) {
      // rough estimation: 200 words per minute
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.data.contentHtml;
      const text = tempDiv.textContent || tempDiv.innerText || '';
      const wordCount = text.split(/\s+/).length;
      readMins = Math.ceil(wordCount / 200);
    }
    
    if (readMins > 0) {
      readTimeText.textContent = `${readMins} دقيقة قراءة`;
    } else {
      readTimeText.parentElement.style.display = 'none';
      if(readTimeText.parentElement.previousElementSibling) {
        readTimeText.parentElement.previousElementSibling.style.display = 'none'; // hide the divider
      }
    }
  }

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
  const noCoverGradient = document.getElementById('no-cover-gradient');
  
  if (data.coverImage) {
    if (coverImageEl) {
      coverImageEl.src = data.coverImage;
      coverImageEl.alt = data.title || 'Cover';
    }
    if (coverImageContainer) coverImageContainer.classList.remove('hidden');
    if (noCoverGradient) noCoverGradient.classList.add('hidden');
  } else {
    // Hide if there's no cover image to avoid broken images
    if (coverImageContainer) coverImageContainer.classList.add('hidden');
    if (noCoverGradient) noCoverGradient.classList.remove('hidden');
  }

  // Render HTML Content (depending on type, but generally it's in data.data.contentHtml or similar)
  const articleBody = document.getElementById('article-body');
  
  function decodeHTML(html) {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
  
  // Process content HTML
  let rawHtml = data.data?.contentHtml || data.contentHtml || data.content || data.data?.content || '';
  
  if (rawHtml) {
    // If it's escaped HTML, decode it
    if (rawHtml.includes('&lt;')) {
      rawHtml = decodeHTML(rawHtml);
    } else if (!rawHtml.includes('<p>') && !rawHtml.includes('<br>')) {
      // If it's pure plain text, wrap in paragraphs
      rawHtml = '<p>' + rawHtml.replace(/\n\s*\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
    }
    // Basic regex replacement to add loading="lazy" to imgs and iframes if not already present
    rawHtml = rawHtml.replace(/<(img|iframe)(?![^>]*loading=)/gi, '<$1 loading="lazy" decoding="async"');
  }

  let embedCode = data.data?.embedCode || data.embedCode || '';

  if (data.type === 'video' && embedCode) {
    if (embedCode.includes('&lt;')) {
      embedCode = decodeHTML(embedCode);
    }
    let embed = embedCode.replace(/<iframe(?![^>]*loading=)/gi, '<iframe loading="lazy"');
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
  const shareUrl = encodeURIComponent(window.location.href);
  document.getElementById('share-whatsapp').href = `https://wa.me/?text=${shareUrl}`;
  document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;

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
    qConstraints.push(limit(15)); // Fetch more to allow client-side filtering of scheduled posts

    const qRef = query(collection(db, "posts"), ...qConstraints);
    const snapshot = await getDocs(qRef);
    
    let results = [];
    const now = new Date();
    snapshot.forEach(doc => {
      const data = doc.data();
      let isPublished = true;
      if (data.publishAt) {
        const pDate = data.publishAt.toDate ? data.publishAt.toDate() : new Date(data.publishAt);
        if (pDate > now) isPublished = false;
      }
      if (doc.id !== currentArticle.id && isPublished) {
        results.push({ id: doc.id, ...data });
      }
    });

    // If we didn't find enough items by category and there was a category, try filling up by type
    if (results.length < 3 && currentArticle.category) {
       const fallbackQRef = query(
         collection(db, "posts"),
         where("status", "==", "published"),
         where("type", "==", currentArticle.type),
         orderBy("createdAt", "desc"),
         limit(15)
       );
       const fallbackSnapshot = await getDocs(fallbackQRef);
       fallbackSnapshot.forEach(doc => {
         const data = doc.data();
         let isPublished = true;
         if (data.publishAt) {
           const pDate = data.publishAt.toDate ? data.publishAt.toDate() : new Date(data.publishAt);
           if (pDate > now) isPublished = false;
         }
         if (doc.id !== currentArticle.id && isPublished && !results.find(r => r.id === doc.id)) {
           results.push({ id: doc.id, ...data });
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
      card.className = 'flex gap-4 group bg-[#110808]/50 hover:bg-[#1b0d0d] border border-gray-800/50 hover:border-red-900/50 p-2 rounded-xl transition-all';
      card.innerHTML = `
        <div class="w-32 aspect-video shrink-0 rounded-lg overflow-hidden relative">
          <img src="${post.coverImage || '/assets/images/icon-white.png'}" alt="${post.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async">
          <span class="absolute bottom-1 right-1 ${typeColor} text-white text-[9px] px-1.5 py-0.5 rounded">${typeLabel}</span>
        </div>
        <div class="flex-1 py-1 pr-1">
          <h3 class="text-sm font-bold text-gray-200 group-hover:text-red-400 transition-colors line-clamp-2 mb-1">${post.title}</h3>
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
  loadingEl.innerHTML = UIErrorState(message, "retry-article");
  document.getElementById('retry-article')?.addEventListener('click', () => {
    loadingEl.innerHTML = UISpinner("جاري تحميل المحتوى...");
    initArticle();
  });
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
      scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
    } else {
      scrollToTopBtn.classList.remove('show');
      scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none');
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

