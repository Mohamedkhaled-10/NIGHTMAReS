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
