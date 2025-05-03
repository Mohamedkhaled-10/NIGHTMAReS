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

