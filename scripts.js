// تحديث حركة marker في شريط التنقل
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

// تبديل صور قسم الـ Hero مع تأثير التلاشي
let heroImg = document.querySelector('.hero-image img');
let heroImages = [
  "images/1.webp",
  "images/2.webp",
  "images/3.webp"
];
let currentHeroIndex = 0;

setInterval(() => {
  heroImg.classList.add('fade-out');
  setTimeout(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
    heroImg.src = heroImages[currentHeroIndex];
    heroImg.classList.remove('fade-out');
  }, 500);
}, 4000);

// إظهار تأثير الدخان الأخضر في قسم الـ Hero بناءً على توقيت القاهرة (من 5 مساءً إلى 6 صباحاً)
function updateHeroSmokeVisibility() {
  const now = new Date();
  let cairoHour = now.getUTCHours() + 2; // توقيت القاهرة (UTC+2)
  if (cairoHour >= 24) cairoHour -= 24;
  const heroSmoke = document.querySelector('.hero-smoke');
  // إذا كان الوقت بين 17:00 (5 مساءً) و 6:00 صباحاً
  if (cairoHour >= 17 || cairoHour < 6) {
    heroSmoke.style.display = 'block';
  } else {
    heroSmoke.style.display = 'none';
  }
}
updateHeroSmokeVisibility();
setInterval(updateHeroSmokeVisibility, 10 * 60 * 1000);
