document.addEventListener("DOMContentLoaded", () => {
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
