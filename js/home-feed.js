import { db } from './firebase-init.js';
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UILoadingSkeleton, UISpinner, UIEmptyState, UIErrorState, generateStoryCard, generateNewsCard, generateVideoCard } from './ui-utils.js';

const initHomeFeed = async () => {
  await loadHomeContent();
  
  // Defer analytics loading to free up network for main content and stop tab spinner
  if (document.readyState === 'complete') {
    loadAnalyticsContent();
  } else {
    window.addEventListener('load', () => {
      // Small timeout to ensure critical rendering path finishes
      setTimeout(loadAnalyticsContent, 500);
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeFeed);
} else {
  initHomeFeed();
}

async function loadHomeContent() {
  const storiesGrid = document.getElementById('stories-grid');
  const newsGrid = document.getElementById('news-grid');
  const videoGrid = document.getElementById('video-grid');
  
  const now = new Date();
  
  // Independent async fetches so one doesn't block the other
  const fetchStories = async () => {
    if(storiesGrid) storiesGrid.innerHTML = UILoadingSkeleton(3);
    try {
      const snap = await getDocs(query(collection(db, "posts"), where("status", "==", "published"), where("type", "==", "story"), orderBy("createdAt", "desc"), limit(3)));
      const items = snap.docs.map(d => d.data()).filter(d => !d.publishAt || (d.publishAt.toDate ? d.publishAt.toDate() : new Date(d.publishAt)) <= now);
      renderStories(items, storiesGrid);
    } catch(e) {
      if(storiesGrid) {
        storiesGrid.innerHTML = UIErrorState("لم نتمكن من استحضار القصص. تحقق من اتصالك.", "retry-stories");
        document.getElementById('retry-stories')?.addEventListener('click', fetchStories);
      }
    }
  };

  const fetchNews = async () => {
    if(newsGrid) newsGrid.innerHTML = UILoadingSkeleton(3);
    try {
      const snap = await getDocs(query(collection(db, "posts"), where("status", "==", "published"), where("type", "==", "news"), orderBy("createdAt", "desc"), limit(3)));
      const items = snap.docs.map(d => d.data()).filter(d => !d.publishAt || (d.publishAt.toDate ? d.publishAt.toDate() : new Date(d.publishAt)) <= now);
      renderNews(items, newsGrid);
    } catch(e) {
      if(newsGrid) {
        newsGrid.innerHTML = UIErrorState("لم نتمكن من استحضار الأخبار. تحقق من اتصالك.", "retry-news");
        document.getElementById('retry-news')?.addEventListener('click', fetchNews);
      }
    }
  };

  const fetchVideos = async () => {
    if(videoGrid) videoGrid.innerHTML = UILoadingSkeleton(3);
    try {
      const snap = await getDocs(query(collection(db, "posts"), where("status", "==", "published"), where("type", "==", "video"), orderBy("createdAt", "desc"), limit(3)));
      const items = snap.docs.map(d => d.data()).filter(d => !d.publishAt || (d.publishAt.toDate ? d.publishAt.toDate() : new Date(d.publishAt)) <= now);
      renderVideos(items, videoGrid);
    } catch(e) {
      if(videoGrid) {
        videoGrid.innerHTML = UIErrorState("لم نتمكن من استحضار الفيديوهات. تحقق من اتصالك.", "retry-videos");
        document.getElementById('retry-videos')?.addEventListener('click', fetchVideos);
      }
    }
  };

  // Run them without awaiting them here so they load independently
  fetchStories();
  fetchNews();
  fetchVideos();
}

async function loadAnalyticsContent() {
  const mostReadList = document.getElementById('most-read-list');
  const trendingList = document.getElementById('trending-list');
  const mostDiscussedList = document.getElementById('most-discussed-list');
  
  if (!mostReadList || !trendingList || !mostDiscussedList) return;
  
  mostReadList.innerHTML = UISpinner();
  trendingList.innerHTML = UISpinner();
  mostDiscussedList.innerHTML = UISpinner();

  try {
    const [mostReadSnap, trendingSnap, mostDiscussedSnap] = await Promise.all([
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        orderBy("views", "desc"),
        limit(20)
      )),
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        orderBy("likesCount", "desc"),
        limit(20)
      )),
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        orderBy("commentsCount", "desc"),
        limit(20)
      ))
    ]);

    const filterPublished = (docs) => docs.map(d => d.data()).slice(0, 5);

    renderList(filterPublished(mostReadSnap.docs), mostReadList, 'views');
    renderList(filterPublished(trendingSnap.docs), trendingList, 'likes');
    renderList(filterPublished(mostDiscussedSnap.docs), mostDiscussedList, 'comments');

  } catch(e) {
    console.error("Error loading analytics:", e);
    const err = UIErrorState("تعذر تحميل الإحصائيات", "retry-analytics");
    mostReadList.innerHTML = err;
    trendingList.innerHTML = err;
    mostDiscussedList.innerHTML = err;
    
    document.querySelectorAll('#retry-analytics').forEach(btn => {
      btn.addEventListener('click', loadAnalyticsContent);
    });
  }
}

function renderList(items, container, type) {
  if (items.length === 0) {
    container.innerHTML = UIEmptyState("لا توجد بيانات حالياً", "fa-chart-simple");
    return;
  }
  
  container.innerHTML = '';
  items.forEach((item, index) => {
    let statIcon = '';
    let statValue = 0;
    
    if (type === 'views') {
      statIcon = '<i class="fas fa-eye text-[var(--color-text-meta)]"></i>';
      statValue = item.views || 0;
    } else if (type === 'likes') {
      statIcon = '<i class="fas fa-heart text-[var(--color-accent)]"></i>';
      statValue = item.likesCount || 0;
    } else {
      statIcon = '<i class="fas fa-comment text-[var(--color-text-meta)]"></i>';
      statValue = item.commentsCount || 0;
    }

    const typeLabel = item.type === 'story' ? 'قصة' : item.type === 'video' ? 'فيديو' : 'خبر';
    const link = `/${item.type}/${item.slug}`;
    
    const div = document.createElement('a');
    div.href = link;
    
    if (index === 0) {
      div.className = 'group relative block overflow-hidden rounded-xl border border-[var(--color-border-subtle)] mb-4 bg-[var(--color-bg-surface)]';
      div.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/60 to-transparent z-10 group-hover:from-[var(--color-accent)]/20 transition-colors"></div>
        <img src="${item.coverImage || '/assets/images/icon-white.png'}" class="w-full h-48 object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="${item.title}" loading="lazy">
        <div class="absolute inset-x-0 bottom-0 p-4 z-20 flex flex-col gap-2">
          <div class="flex items-center gap-3 text-[11px] text-[var(--color-text-meta)] font-bold tracking-wider">
            <span class="bg-accent-15 text-[var(--color-accent)] px-2 py-0.5 rounded">${typeLabel}</span>
            <span class="flex items-center gap-1.5">${statIcon} ${statValue}</span>
          </div>
          <h4 class="text-[var(--color-text-primary)] text-base font-bold leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">${item.title}</h4>
        </div>
      `;
    } else {
      div.className = 'flex items-start gap-4 p-3 bg-transparent hover:bg-[var(--color-accent)]/5 rounded-lg transition group border-b border-[var(--color-border-subtle)] last:border-0';
      div.innerHTML = `
        <div class="text-xl font-black text-[var(--color-text-meta)] group-hover:text-[var(--color-accent)] transition w-4 text-center mt-0.5">
          ${index + 1}
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-1.5">
          <h4 class="text-[var(--color-text-secondary)] text-sm font-bold line-clamp-2 group-hover:text-[var(--color-text-primary)] transition-colors leading-snug">${item.title}</h4>
          <div class="flex items-center gap-3 text-[11px] text-[var(--color-text-meta)] font-medium">
            <span>${typeLabel}</span>
            <span class="flex items-center gap-1">${statIcon} ${statValue}</span>
          </div>
        </div>
      `;
    }
    
    container.appendChild(div);
  });
}

function renderStories(items, container) {
  if(!container) return;
  container.innerHTML = '';
  if(items.length === 0) {
    container.innerHTML = UIEmptyState("لا توجد قصص حالياً، ترقبوا المزيد من الكوابيس قريباً...", "fa-ghost");
    return;
  }
  
  items.forEach(item => {
    const link = `/story/${item.slug}`;
    const card = document.createElement('a');
    card.href = link;
    card.className = 'content-card-link';
    card.innerHTML = generateStoryCard(item, null, null, null);
    container.appendChild(card);
  });
}

function renderNews(items, container) {
  if(!container) return;
  container.innerHTML = '';
  if(items.length === 0) {
    container.innerHTML = UIEmptyState("لا توجد أخبار حالياً، الأحداث المروعة في طريقها إليكم...", "fa-newspaper");
    return;
  }
  
  items.forEach(item => {
    const link = `/news/${item.slug}`;
    
    let snippet = '';
    if(item.data && item.data.contentHtml) {
      const temp = document.createElement('div');
      temp.innerHTML = item.data.contentHtml;
      snippet = temp.textContent || temp.innerText || '';
      snippet = snippet.substring(0, 100) + '...';
    }
    
    const card = document.createElement('a');
    card.href = link;
    card.className = 'content-card-link';
    card.innerHTML = generateNewsCard(item, null, snippet, null);
    container.appendChild(card);
  });
}

function renderVideos(items, container) {
  if(!container) return;
  container.innerHTML = '';
  if(items.length === 0) {
    container.innerHTML = UIEmptyState("لا توجد فيديوهات حالياً، المشاهد المرعبة يتم تحضيرها...", "fa-video-slash");
    return;
  }
  
  items.forEach(item => {
    const link = `/video/${item.slug}`;
    const card = document.createElement('a');
    card.href = link;
    card.className = 'content-card-link';
    card.innerHTML = generateVideoCard(item, null, null);
    container.appendChild(card);
  });
}
