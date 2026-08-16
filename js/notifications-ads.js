import { db } from './firebase-init.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- Ads Logic ---
async function loadAds() {
  const adContainer = document.getElementById('AD_CONTAINER_ID');
  if (!adContainer) return;
  
  try {
    const q = query(collection(db, "ads_templates"), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      adContainer.style.display = 'none';
      return;
    }
    
    // Pick a random active ad
    const ads = [];
    querySnapshot.forEach(docSnap => ads.push(docSnap.data()));
    
    const randomAd = ads[Math.floor(Math.random() * ads.length)];
    
    // Render the ad
    adContainer.innerHTML = `
      <a href="${randomAd.link}" target="_blank" class="block bg-[#111] border border-gray-800 hover:border-red-600 rounded-xl overflow-hidden shadow-lg transition transform hover:scale-[1.02]">
        <div class="relative">
          <span class="absolute top-2 right-2 bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded shadow z-10">إعلان</span>
          <img src="${randomAd.image}" alt="إعلان" class="w-full h-auto object-cover max-h-64">
        </div>
        ${randomAd.text ? `<div class="p-3 text-center text-gray-300 font-semibold">${randomAd.text}</div>` : ''}
      </a>
    `;
    
  } catch (err) {
    console.error("Error loading ads:", err);
  }
}

// Ensure it loads after the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAds);
} else {
  loadAds();
}

