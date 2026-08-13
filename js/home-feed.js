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
    const q = query(
      collection(db, "posts"),
      where("status", "==", "published")
    );
    const snapshot = await getDocs(q);
    
    const stories = [];
    const news = [];
    const videos = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if(data.type === 'story') stories.push(data);
      else if(data.type === 'news') news.push(data);
      else if(data.type === 'video') videos.push(data);
    });
    
    // Sort logic (if createdAt exists)
    const sortDesc = (a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    };
    stories.sort(sortDesc);
    news.sort(sortDesc);
    videos.sort(sortDesc);
    
    renderStories(stories.slice(0, 6), storiesGrid);
    renderNews(news.slice(0, 6), newsGrid);
    renderVideos(videos.slice(0, 3), videoGrid);
    
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
        <img src="${item.coverImage || 'images/default.jpg'}" alt="${item.title}">
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
      <img src="${item.coverImage || 'images/default.jpg'}" alt="${item.title}">
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
      <img src="${item.coverImage || 'images/default.jpg'}" alt="${item.title}">
      <div class="video-content">
        <h3>${item.title}</h3>
      </div>
    `;
    container.appendChild(card);
  });
}
