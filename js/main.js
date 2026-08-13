/* تبديل صور قسم الـ Hero مع تأثير التلاشي */
let heroImg = document.querySelector('.hero-image img');
let currentHeroIndex = 0;

if (heroImg) {
  setInterval(() => {
    heroImg.classList.add('fade-out');
    setTimeout(() => {
      currentHeroIndex = (currentHeroIndex + 1) % [
        "/assets/images/1.webp",
        "/assets/images/2.webp",
        "/assets/images/3.webp"
      ].length;
      heroImg.src = [
        "/assets/images/1.webp",
        "/assets/images/2.webp",
        "/assets/images/3.webp"
      ][currentHeroIndex];
      heroImg.classList.remove('fade-out');
    }, 500);
  }, 4000);
}
