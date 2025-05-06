// شريط التمرير العلوي
window.addEventListener('scroll', () => {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (window.scrollY / scrollHeight) * 100;
  document.getElementById('progress-bar').style.width = progress + '%';
});


let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function () {
  let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  if (currentScroll > lastScrollTop) {
    // عند النزول - اخفِ الشريط بتحريك للأعلى
    navbar.style.transform = 'translate(-50%, -100px)';
  } else {
    // عند الصعود - أعده لمكانه
    navbar.style.transform = 'translate(-50%, 0)';
  }

  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});

function toggleShareButtons() {
  const buttons = document.getElementById('additional-buttons');
  buttons.style.display = buttons.style.display === 'none' || buttons.style.display === '' ? 'block' : 'none';
}
