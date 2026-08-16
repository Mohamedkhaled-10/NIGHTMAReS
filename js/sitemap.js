import { db } from './firebase-init.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('sitemap-loading');
  const content = document.getElementById('sitemap-content');
  
  const listStories = document.getElementById('list-stories');
  const listNews = document.getElementById('list-news');
  const listVideos = document.getElementById('list-videos');

  try {
    const q = query(
      collection(db, "posts"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    
    const now = new Date();
    
    snap.forEach(doc => {
      const post = doc.data();
      
      let isPublished = true;
      if (post.publishAt) {
        const pDate = post.publishAt.toDate ? post.publishAt.toDate() : new Date(post.publishAt);
        if (pDate > now) isPublished = false;
      }
      
      if (!isPublished) return;

      const li = document.createElement('li');
      li.innerHTML = `<a href="/${post.type}/${post.slug}" class="hover:text-white transition">${post.title}</a>`;
      
      if (post.type === 'story') {
        listStories.appendChild(li);
      } else if (post.type === 'news') {
        listNews.appendChild(li);
      } else if (post.type === 'video') {
        listVideos.appendChild(li);
      }
    });

    if (listStories.children.length === 0) listStories.innerHTML = '<li class="text-gray-500 list-none">لا توجد قصص.</li>';
    if (listNews.children.length === 0) listNews.innerHTML = '<li class="text-gray-500 list-none">لا توجد أخبار.</li>';
    if (listVideos.children.length === 0) listVideos.innerHTML = '<li class="text-gray-500 list-none">لا توجد فيديوهات.</li>';

    loading.classList.add('hidden');
    content.classList.remove('hidden');

  } catch (error) {
    console.error("Error loading sitemap:", error);
    loading.innerHTML = '<p class="text-red-500 font-bold">حدث خطأ أثناء جلب خريطة الموقع.</p>';
  }
});
