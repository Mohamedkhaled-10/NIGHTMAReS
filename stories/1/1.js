window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / scrollHeight) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
  });
  window.onscroll = function() {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      document.getElementById("scrollToTop").style.display = "block";
    } else {
      document.getElementById("scrollToTop").style.display = "none";
    }
  };
  
  document.getElementById("scrollToTop").addEventListener("click", function() {
    window.scrollTo({top: 0, behavior: 'smooth'});
  });
    // إظهار الزر عند التمرير لأسفل الصفحة
window.onscroll = function () {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
      scrollToTopBtn.classList.add('show');
    } else {
      scrollToTopBtn.classList.remove('show');
    }
  };
  
  // وظيفة العودة للأعلى عند النقر
  document.getElementById('scrollToTop').addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // إظهار شريط التنقل عند التمرير للأعلى
  let lastScrollTop = 0;
  window.addEventListener("scroll", function () {
    const navbar = document.querySelector('.navbar');
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
  
    if (currentScroll > lastScrollTop) {
      // إذا كان المستخدم يمر لأسفل، اختفاء شريط التنقل
      navbar.classList.remove('show');
    } else {
      // إذا كان المستخدم يمر للأعلى، يظهر شريط التنقل
      navbar.classList.add('show');
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // لضمان التمرير للأعلى عند الوصول للأعلى
  });

function toggleShareButtons() {
  const buttons = document.getElementById('additional-buttons');
  buttons.style.display = buttons.style.display === 'none' || buttons.style.display === '' ? 'block' : 'none';
}
  
