import { db } from './firebase-init.js';
import { collection, getDocs, doc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- Notifications Logic ---
// Listen for live system notifications
function initNotifications() {
  const notifRef = doc(db, "system", "live_notification");
  onSnapshot(notifRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Check if it's recent (within the last 10 minutes)
      // to avoid showing old notifications on refresh
      if (!data.timestamp) return;
      
      // Server Timestamp might be pending initially, wait until it's resolved or estimate locally
      const notifTime = data.timestamp.toMillis ? data.timestamp.toMillis() : Date.now();
      const now = Date.now();
      
      if (now - notifTime < 10 * 60 * 1000) { // 10 minutes
        // Remove any existing
        const oldNotif = document.getElementById("live-notification");
        if (oldNotif) oldNotif.remove();
        
        const notifBox = document.createElement("div");
        notifBox.id = "live-notification";
        notifBox.className = "fixed bottom-4 right-4 w-80 bg-[#1f1f1f] border border-red-900 text-white rounded-lg shadow-2xl shadow-red-900/20 p-4 z-50 animate-bounce-in";
        
        let imgHtml = '';
        if (data.image) {
          imgHtml = `<img src="${data.image}" class="w-16 h-16 object-cover rounded-md flex-shrink-0" alt="notif">`;
        }
        
        let linkHtml = '';
        if (data.link) {
          linkHtml = `<a href="${data.link}" class="bg-red-600 hover:bg-red-800 text-white px-3 py-1 rounded text-sm transition" target="_blank">التفاصيل</a>`;
        }
        
        notifBox.innerHTML = `
          <div class="flex items-start gap-4">
            ${imgHtml}
            <div class="flex-1">
              <p class="mb-3 font-semibold text-sm leading-relaxed">${data.text}</p>
              <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
                ${linkHtml}
                <button onclick="document.getElementById('live-notification')?.remove()" class="text-sm text-gray-400 hover:text-white transition">إغلاق</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(notifBox);
  
        // Add to dropdown list if it exists
        const notifList = document.getElementById("notificationsList");
        if (notifList) {
          const noNotifMsg = notifList.querySelector("li.text-center");
          if (noNotifMsg) noNotifMsg.remove();
  
          const li = document.createElement("li");
          li.className = "px-4 py-3 text-sm text-white hover:bg-[#2c2c2e] cursor-pointer transition";
          li.innerHTML = `<strong class="block text-red-500">إشعار جديد</strong><span class="text-gray-300">${data.text}</span>`;
          notifList.prepend(li);
          
          // Show the red dot if dropdown is closed
          const notifDot = document.getElementById("notifDot");
          const notifMenu = document.getElementById("notifMenu");
          if (notifDot && notifMenu && notifMenu.classList.contains("hidden")) {
            notifDot.classList.remove("hidden");
          }
        }
  
      }
    }
  });
}

if (document.readyState === 'complete') {
  initNotifications();
} else {
  window.addEventListener('load', initNotifications);
}


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

