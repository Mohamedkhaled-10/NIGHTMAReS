  const popup = document.getElementById("imagePopup");
  const popupImg = document.getElementById("popupImage");

  document.querySelectorAll(".screenshots img").forEach(img => {
    img.addEventListener("click", () => {
      popup.style.display = "flex";
      popupImg.src = img.src;
    });
  });

  popup.addEventListener("click", () => {
    popup.style.display = "none";
    popupImg.src = "";
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