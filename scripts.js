/* تحديث حركة marker في شريط التنقل */
let marker = document.querySelector('#marker');
let listItems = document.querySelectorAll('.navbar ul li');

function moveIndicator(element) {
  marker.style.left = element.offsetLeft + "px";
  marker.style.width = element.offsetWidth + "px";
}

listItems.forEach(item => {
  item.addEventListener('mousemove', function() {
    moveIndicator(this);
  });
  item.addEventListener('mouseleave', function() {
    let active = document.querySelector('.navbar ul li.active');
    if (active) moveIndicator(active);
  });
});

function setActive() {
  listItems.forEach(item => item.classList.remove('active'));
  this.classList.add('active');
  moveIndicator(this);
}
listItems.forEach(item => {
  item.addEventListener('click', setActive);
});

/* تبديل صور قسم الـ Hero مع تأثير التلاشي */
let heroImg = document.querySelector('.hero-image img');
let currentHeroIndex = 0;

setInterval(() => {
  heroImg.classList.add('fade-out');
  setTimeout(() => {
    currentHeroIndex = (currentHeroIndex + 1) % [
      "images/1.webp",
      "images/2.webp",
      "images/3.webp"
    ].length;
    heroImg.src = [
      "images/1.webp",
      "images/2.webp",
      "images/3.webp"
    ][currentHeroIndex];
    heroImg.classList.remove('fade-out');
  }, 500);
}, 4000);

/* إظهار تأثير الدخان الأخضر في قسم الـ Hero بناءً على توقيت القاهرة */
function updateHeroSmokeVisibility() {
  const now = new Date();
  let cairoHour = now.getUTCHours() + 2; // توقيت القاهرة (UTC+2)
  if (cairoHour >= 24) cairoHour -= 24;
  const heroSmoke = document.querySelector('.hero-smoke');
  if (cairoHour >= 17 || cairoHour < 6) {
    heroSmoke.style.display = 'block';
  } else {
    heroSmoke.style.display = 'none';
  }
}
updateHeroSmokeVisibility();
setInterval(updateHeroSmokeVisibility, 10 * 60 * 1000);

/* التحكم في عدد القوالب وإضافة زر "إظهار المزيد" */
document.querySelectorAll('.news-section').forEach(section => {
  let cards = section.querySelectorAll('.news-card');
  
  if (cards.length > 6) {
    cards.forEach((card, index) => {
      if (index >= 6) card.style.display = 'none';
    });

    let blurOverlay = document.createElement('div');
    blurOverlay.classList.add('blur-overlay');
    blurOverlay.textContent = "إظهار المزيد";

    section.appendChild(blurOverlay);

    blurOverlay.addEventListener('click', () => {
      if (blurOverlay.classList.contains('expanded')) {
        // إخفاء القوالب الزائدة
        cards.forEach((card, index) => {
          if (index >= 6) card.style.display = 'none';
        });
        blurOverlay.textContent = "إظهار المزيد";
        blurOverlay.classList.remove('expanded');
      } else {
        // عرض القوالب المخفية
        cards.forEach(card => card.style.display = 'block');
        blurOverlay.textContent = "إظهار أقل";
        blurOverlay.classList.add('expanded');
      }
    });
  }
});
// Array of images for the hero section
const heroImages = ["hero1.jpg", "hero2.jpg", "hero3.jpg"];
let heroIndex = 0;

// Function to change the main image every few seconds
setInterval(() => {
  heroIndex = (heroIndex + 1) % [
    "images/1.webp",
    "images/2.webp",
    "images/3.webp"
  ].length;
  document.getElementById("heroImage").src = [
    "images/1.webp",
    "images/2.webp",
    "images/3.webp"
  ][heroIndex];
}, 4000); // Change image every 4 seconds

// تحميل بيانات الكروت من Firebase
const db = firebase.database();

db.ref("cards").once("value").then(snapshot => {
  const cards = snapshot.val();
  const cardElements = document.querySelectorAll(".cards-section .card");
  cardElements.forEach((card, i) => {
    if (cards[i]) {
      card.querySelector("img").src = cards[i].image;
      card.querySelector("h3").textContent = cards[i].title;
      card.querySelector("a").href = cards[i].link;
    }
  });
});

db.ref("news").once("value").then(snapshot => {
  const newsList = snapshot.val();
  const newsElements = document.querySelectorAll(".news-card");
  newsElements.forEach((card, i) => {
    if (newsList[i]) {
      card.querySelector("img").src = newsList[i].image;
      card.querySelector("h3").textContent = newsList[i].title;
      card.querySelector(".news-text").firstChild.textContent = newsList[i].short;
      card.querySelector(".more-text").textContent = newsList[i].more;
    }
  });

  activateReadMore();
});

window.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes bounceIn {
      0% { opacity: 0; transform: translateY(100%); }
      60% { opacity: 1; transform: translateY(-10px); }
      80% { transform: translateY(5px); }
      100% { transform: translateY(0); }
    }
    .animate-bounce-in {
      animation: bounceIn 0.5s ease-out;
    }
  `;
  document.head.appendChild(style);

  const menuBtn = document.getElementById('menuBtn');
  const sidebarMenu = document.getElementById('sidebarMenu');
  const overlay = document.getElementById('overlay');
  const hamburgerWrapper = document.getElementById('hamburgerWrapper');
  const navbar = document.querySelector('.navbar');

  menuBtn?.addEventListener('click', () => {
    sidebarMenu.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    hamburgerWrapper.classList.add('hidden');
  });

  overlay?.addEventListener('click', () => {
    sidebarMenu.classList.add('translate-x-full');
    overlay.classList.add('hidden');
    hamburgerWrapper.classList.remove('hidden');
  });

  let lastScrollTop = 0;
  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      navbar.style.top = '-80px';
      hamburgerWrapper.style.transform = "translateX(100px)";
    } else {
      navbar.style.top = '0';
      hamburgerWrapper.style.transform = "translateX(0)";
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });

  const searchToggle = document.getElementById("searchToggle");
  const searchForm = document.getElementById("searchForm");
  let searchOpen = false;
  searchToggle?.addEventListener("click", () => {
    searchForm.style.maxHeight = searchOpen ? "0" : "200px";
    searchOpen = !searchOpen;
  });

  const mobileSearchBtn = document.getElementById("mobileSearchBtn");
  const mobileSearchForm = document.getElementById("mobileSearchForm");
  let isSearchOpen = false;
  mobileSearchBtn?.addEventListener("click", () => {
    mobileSearchForm.style.maxHeight = isSearchOpen ? "0" : "120px";
    isSearchOpen = !isSearchOpen;
  });

  const searchInput = document.getElementById("searchInput");
  const cards = document.querySelectorAll(".cards-section .card");
  const newsCards = document.querySelectorAll(".news-section .news-card");
  const suggestionsList = document.getElementById("suggestionsList");
  const titles = [
    "سفاح الجيزة", "الطريق 56", "فتاة الطريق", "Silent Hill 2",
    "The Outlast Trials", "Killing Floor 3", "Ritual Tides",
    "28 YEARS LATER", "المداح", "Hell House LLC", "Final Destination"
  ];

  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    cards.forEach(card => {
      const title = card.querySelector("h3").textContent.toLowerCase();
      card.style.display = title.includes(query) ? "block" : "none";
    });
    newsCards.forEach(card => {
      const title = card.querySelector("h3").textContent.toLowerCase();
      card.style.display = title.includes(query) ? "block" : "none";
    });

    suggestionsList.innerHTML = "";
    if (!query) return suggestionsList.classList.add("hidden");

    const matched = titles.filter(title => title.toLowerCase().includes(query));
    if (!matched.length) return suggestionsList.classList.add("hidden");

    matched.forEach(title => {
      const li = document.createElement("li");
      li.textContent = title;
      li.className = "px-4 py-2 hover:bg-red-900 cursor-pointer";
      li.onclick = () => {
        searchInput.value = title;
        suggestionsList.classList.add("hidden");
        searchInput.dispatchEvent(new Event('input'));
      };
      suggestionsList.appendChild(li);
    });
    suggestionsList.classList.remove("hidden");
  });

  document.addEventListener("click", e => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.classList.add("hidden");
    }
  });

  const notifBtn = document.getElementById("notifBtn");
  const notifMenu = document.getElementById("notifMenu");
  notifBtn?.addEventListener("click", () => {
    notifMenu.classList.toggle("hidden");
    document.getElementById("notifDot")?.classList.add("hidden");
  });

  window.addEventListener("click", (e) => {
    if (!notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
      notifMenu.classList.add("hidden");
    }
  });

  function activateReadMore() {
    const buttons = document.querySelectorAll(".read-more-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const textElement = this.previousElementSibling.querySelector(".more-text");
        if (textElement.style.display === "none") {
          textElement.style.display = "inline";
          this.textContent = "إخفاء";
        } else {
          textElement.style.display = "none";
          this.textContent = "اقرأ المزيد";
        }
      });
    });
  }
});

// Firebase Notifications
firebase.database().ref("notifications").on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;

  const oldNotif = document.getElementById("live-notification");
  if (oldNotif) oldNotif.remove();

  const notifBox = document.createElement("div");
  notifBox.id = "live-notification";
  notifBox.className = "fixed bottom-4 right-4 w-80 bg-[#1f1f1f] text-white rounded-lg shadow-lg p-4 z-50 animate-bounce-in";
  notifBox.innerHTML = `
    <div class="flex items-start gap-4">
      <img src="${data.image}" class="w-16 h-16 object-cover rounded-md flex-shrink-0" alt="notif">
      <div class="flex-1">
        <p class="mb-2">${data.text}</p>
        <div class="flex justify-between items-center">
          <a href="${data.link}" class="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded text-sm" target="_blank">اذهب إلى</a>
          <button onclick="document.getElementById('live-notification')?.remove()" class="text-sm text-gray-400 hover:text-white">إغلاق</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(notifBox);
});

// FCM
const messaging = firebase.messaging();
messaging.requestPermission().then(() => messaging.getToken()).then(token => {
  console.log("FCM Token:", token);
}).catch(err => console.error("FCM Error:", err));

messaging.onMessage(payload => {
  const { title, body } = payload.notification;
  const notifList = document.getElementById("notificationsList");
  const notifDot = document.getElementById("notifDot");
  const noNotifMsg = notifList.querySelector("li.text-center");
  if (noNotifMsg) noNotifMsg.remove();

  const li = document.createElement("li");
  li.className = "px-4 py-3 text-sm text-white hover:bg-[#2c2c2e] cursor-pointer transition";
  li.innerHTML = `<strong class="block text-red-500">${title}</strong><span class="text-gray-300">${body}</span>`;
  notifList.prepend(li);
  notifDot.classList.remove("hidden");
});


