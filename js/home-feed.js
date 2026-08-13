import { db } from './firebase-init.js';
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  loadHomeContent();
});

async function loadHomeContent() {
  const storiesGrid = document.querySelector('.cards-section');
  const newsGrid = document.querySelector('.news-grid');
  const videoGrid = document.querySelector('.video-grid');
  
  if(storiesGrid) storiesGrid.innerHTML = '<div style="text-align:center; padding:50px; color:#888; width:100%;">جاري تحميل القصص...</div>';
  if(newsGrid) newsGrid.innerHTML = '<div style="text-align:center; padding:50px; color:#888; width:100%; grid-column:1/-1;">جاري تحميل الأخبار...</div>';
  if(videoGrid) videoGrid.innerHTML = '<div style="text-align:center; padding:50px; color:#888; width:100%; grid-column:1/-1;">جاري تحميل الفيديوهات...</div>';

  try {
    // Run parallel queries to limit Firebase reads
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
    if(storiesGrid) storiesGrid.innerHTML = '<div style="text-align:center; color:red; width:100%;">خطأ في التحميل</div>';
    if(newsGrid) newsGrid.innerHTML = '<div style="text-align:center; color:red; width:100%; grid-column:1/-1;">خطأ في التحميل</div>';
    if(videoGrid) videoGrid.innerHTML = '<div style="text-align:center; color:red; width:100%; grid-column:1/-1;">خطأ في التحميل</div>';
  }
}

function renderStories(items, container) {
  if(!container) return;
  container.innerHTML = '';
  if(items.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#888; width:100%;">لا توجد قصص حالياً.</div>';
    return;
  }
  
  items.forEach(item => {
    const link = `/story/${item.slug}`;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-inner">
        <img src="${item.coverImage || 'images/default.jpg'}" alt="${item.title}" loading="lazy" decoding="async">
        <div class="overlay"></div>
        <div class="card-content">
          <h3>${item.title}</h3>
          <a href="${link}">اقرأ المزيد</a>
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
    container.innerHTML = '<div style="text-align:center; color:#888; width:100%; grid-column:1/-1;">لا توجد أخبار حالياً.</div>';
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
    card.className = 'news-card';
    card.innerHTML = `
      <img src="${item.coverImage || 'images/default.jpg'}" alt="${item.title}" loading="lazy" decoding="async">
      <div class="news-content">
        <h3>${item.title}</h3>
        <p class="news-text">${snippet}</p>
        <button class="read-more-btn" onclick="window.location.href='${link}'">اقرأ المزيد</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderVideos(items, container) {
  if(!container) return;
  container.innerHTML = '';
  if(items.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#888; width:100%; grid-column:1/-1;">لا توجد فيديوهات حالياً.</div>';
    return;
  }
  
  items.forEach(item => {
    const link = `/video/${item.slug}`;
    const card = document.createElement('a');
    card.href = link;
    card.className = 'video-card';
    card.innerHTML = `
      <img src="${item.coverImage || 'images/default.jpg'}" alt="${item.title}" loading="lazy" decoding="async">
      <div class="video-content">
        <h3>${item.title}</h3>
      </div>
    `;
    container.appendChild(card);
  });
}
