// js/article.js
import { db } from './firebase-init.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    const docData = querySnapshot.docs[0].data();
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

  // Render HTML Content (depending on type, but generally it's in data.data.contentHtml or similar)
  const articleBody = document.getElementById('article-body');
  
  if (data.type === 'video' && data.data && data.data.embedCode) {
    articleBody.innerHTML = `<div class="video-container">${data.data.embedCode}</div>`;
    if (data.data.contentHtml) {
      articleBody.innerHTML += data.data.contentHtml;
    }
  } else if (data.data && data.data.contentHtml) {
    articleBody.innerHTML = data.data.contentHtml;
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
