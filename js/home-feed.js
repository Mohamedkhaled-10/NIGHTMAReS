import { db } from './firebase-init.js';
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  loadHomeContent();
  loadAnalyticsContent();
});

async function loadHomeContent() {
  const storiesGrid = document.getElementById('stories-grid');
  const newsGrid = document.getElementById('news-grid');
  const videoGrid = document.getElementById('video-grid');
  
  try {
    const [storiesSnap, newsSnap, videosSnap] = await Promise.all([
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        where("type", "==", "story"),
        orderBy("createdAt", "desc"),
        limit(6)
      )),
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        where("type", "==", "news"),
        orderBy("createdAt", "desc"),
        limit(6)
      )),
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        where("type", "==", "video"),
        orderBy("createdAt", "desc"),
        limit(3)
      ))
    ]);
    
    const stories = storiesSnap.docs.map(d => d.data());
    const news = newsSnap.docs.map(d => d.data());
    const videos = videosSnap.docs.map(d => d.data());
    
    renderStories(stories, storiesGrid);
    renderNews(news, newsGrid);
    renderVideos(videos, videoGrid);
    
  } catch(e) {
    console.error("Error loading home feed:", e);
    const errorHtml = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 bg-black/40 rounded-xl border border-red-900/30">
        <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-200 mb-2">تعذر تحميل المحتوى</h3>
        <p class="text-gray-400">يبدو أن هناك خطأ في الاتصال. يرجى المحاولة لاحقاً.</p>
      </div>
    `;
    if(storiesGrid) storiesGrid.innerHTML = errorHtml;
    if(newsGrid) newsGrid.innerHTML = errorHtml;
    if(videoGrid) videoGrid.innerHTML = errorHtml;
  }
}

async function loadAnalyticsContent() {
  const mostReadList = document.getElementById('most-read-list');
  const trendingList = document.getElementById('trending-list');
  const mostDiscussedList = document.getElementById('most-discussed-list');
  
  if (!mostReadList || !trendingList || !mostDiscussedList) return;

  try {
    const [mostReadSnap, trendingSnap, mostDiscussedSnap] = await Promise.all([
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        orderBy("views", "desc"),
        limit(5)
      )),
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        orderBy("likesCount", "desc"),
        limit(5)
      )),
      getDocs(query(
        collection(db, "posts"),
        where("status", "==", "published"),
        orderBy("commentsCount", "desc"),
        limit(5)
      ))
    ]);

    renderList(mostReadSnap.docs.map(d => d.data()), mostReadList, 'views');
    renderList(trendingSnap.docs.map(d => d.data()), trendingList, 'likes');
    renderList(mostDiscussedSnap.docs.map(d => d.data()), mostDiscussedList, 'comments');

  } catch(e) {
    console.error("Error loading analytics:", e);
    const err = `<p class="text-red-500 text-sm text-center py-4">تعذر التحميل</p>`;
    mostReadList.innerHTML = err;
    trendingList.innerHTML = err;
    mostDiscussedList.innerHTML = err;
  }
}

function renderList(items, container, type) {
  if (items.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">لا توجد بيانات حالياً</p>';
    return;
  }
  
  container.innerHTML = '';
  items.forEach((item, index) => {
    let statIcon = '';
    let statValue = 0;
    
    if (type === 'views') {
      statIcon = '<i class="fas fa-eye text-gray-500"></i>';
      statValue = item.views || 0;
    } else if (type === 'likes') {
      statIcon = '<i class="fas fa-heart text-red-900"></i>';
      statValue = item.likesCount || 0;
    } else {
      statIcon = '<i class="fas fa-comment text-gray-500"></i>';
      statValue = item.commentsCount || 0;
    }

    const typeLabel = item.type === 'story' ? 'قصة' : item.type === 'video' ? 'فيديو' : 'خبر';
    const link = `/${item.type}/${item.slug}`;
    
    const div = document.createElement('a');
    div.href = link;
    div.className = 'flex items-center gap-3 p-3 bg-black/40 hover:bg-red-900/20 border border-transparent hover:border-red-900/50 rounded-lg transition group';
    
    div.innerHTML = `
      <div class="text-2xl font-black text-gray-700 group-hover:text-red-600 transition w-6 text-center">
        ${index + 1}
      </div>
      <img src="${item.coverImage || '/assets/images/icon-white.png'}" class="w-12 h-12 rounded object-cover border border-gray-800" alt="${item.title}">
      <div class="flex-1 min-w-0">
        <h4 class="text-white text-sm font-bold truncate group-hover:text-red-400 transition">${item.title}</h4>
        <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span class="bg-gray-800 px-2 py-0.5 rounded text-[10px]">${typeLabel}</span>
          <span class="flex items-center gap-1">${statIcon} ${statValue}</span>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderStories(items, container) {
  if(!container) return;
  container.innerHTML = '';
  if(items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 bg-black/20 rounded-xl border border-gray-800">
        <i class="fa-solid fa-ghost text-4xl text-gray-600 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-300 mb-2">لا توجد قصص حالياً</h3>
        <p class="text-gray-500">ترقبوا المزيد من الكوابيس قريباً...</p>
      </div>
    `;
    return;
  }
  
  items.forEach(item => {
    const link = `/story/${item.slug}`;
    const card = document.createElement('div');
    card.className = 'card cursor-pointer';
    card.onclick = () => window.location.href = link;
    card.innerHTML = `
      <div class="card-inner">
        <img src="${item.coverImage || '/assets/images/icon-white.png'}" alt="${item.title}" loading="lazy" decoding="async">
        <div class="overlay"></div>
        <div class="card-content">
          <h3>${item.title}</h3>
          <span class="fake-btn">اقرأ المزيد</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderNews(items, container) {
  if(!container) return;
  container.innerHTML = '';
  if(items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 bg-black/20 rounded-xl border border-gray-800">
        <i class="fa-solid fa-newspaper text-4xl text-gray-600 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-300 mb-2">لا توجد أخبار حالياً</h3>
        <p class="text-gray-500">الأحداث المروعة في طريقها إليكم...</p>
      </div>
    `;
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
    
    const card = document.createElement('div');
    card.className = 'news-card cursor-pointer';
    card.onclick = () => window.location.href = link;
    card.innerHTML = `
      <img src="${item.coverImage || '/assets/images/icon-white.png'}" alt="${item.title}" loading="lazy" decoding="async">
      <div class="news-content">
        <h3>${item.title}</h3>
        <p class="news-text">${snippet}</p>
        <span class="read-more-btn">اقرأ المزيد</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderVideos(items, container) {
  if(!container) return;
  container.innerHTML = '';
  if(items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 bg-black/20 rounded-xl border border-gray-800">
        <i class="fa-solid fa-video-slash text-4xl text-gray-600 mb-4"></i>
        <h3 class="text-xl font-bold text-gray-300 mb-2">لا توجد فيديوهات حالياً</h3>
        <p class="text-gray-500">المشاهد المرعبة يتم تحضيرها...</p>
      </div>
    `;
    return;
  }
  
  items.forEach(item => {
    const link = `/video/${item.slug}`;
    const card = document.createElement('a');
    card.href = link;
    card.className = 'video-card';
    card.innerHTML = `
      <img src="${item.coverImage || '/assets/images/icon-white.png'}" alt="${item.title}" loading="lazy" decoding="async">
      <div class="video-content">
        <h3>${item.title}</h3>
      </div>
    `;
    container.appendChild(card);
  });
}
