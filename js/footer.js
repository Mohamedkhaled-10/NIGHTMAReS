document.addEventListener("DOMContentLoaded", () => {
  /* Horror Character */
  const messages = [
    "مرحبًا بك في عالم الظلام...",
    "هل تظن أنك وحدك؟",
    "راقب الأشياء من حولك جيدًا...",
    "أنا هنا لأحكي لك قصة لن تنساها!"
  ];

  const container = document.getElementById("character");
  const bubble = document.getElementById("bubble");
  let index = 0;

  function showNextMessage() {
    if (index >= messages.length) {
      if(container) container.style.bottom = "-200px";
      if(container) container.style.opacity = "0";
      setTimeout(() => {
        if(container) container.style.display = "none";
      }, 2000);
      localStorage.setItem("horrorCharacterShown", "true");
      return;
    }

    if(bubble) bubble.style.opacity = "0";
    setTimeout(() => {
      if(bubble) {
        bubble.textContent = messages[index];
        bubble.style.opacity = "1";
      }
      index++;
      setTimeout(showNextMessage, 3500);
    }, 500);
  }

  const hasShown = localStorage.getItem("horrorCharacterShown");
  if (!hasShown) {
    if(container) container.style.display = "block";
    setTimeout(showNextMessage, 1000);
  } else {
    if(container) container.style.display = "none";
  }

  /* Age Verification */
  const isVerified = localStorage.getItem('ageVerified');
  const popup = document.getElementById('age-verification-popup');
  if (!isVerified && popup) {
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  const enterBtn = document.getElementById('enterSiteBtn');
  if(enterBtn) {
    enterBtn.addEventListener('click', () => {
      const check = document.getElementById('ageCheck').checked;
      if (check) {
        localStorage.setItem('ageVerified', 'true');
        popup.style.display = 'none';
        document.body.style.overflow = '';
      } else {
        alert("يجب تأكيد أنك تبلغ من العمر 16 عامًا أو أكثر.");
      }
    });
  }
});
