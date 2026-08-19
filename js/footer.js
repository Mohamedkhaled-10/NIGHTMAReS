import { showToast } from "./ui-utils.js";
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
        showToast({ type: 'warning', message: 'يجب تأكيد أنك تبلغ من العمر 16 عامًا أو أكثر.' });
      }
    });
  }

  /* Floating CTA Logic */
  const floatingCta = document.getElementById('floating-cta');
  if (floatingCta) {
    let scrollTimeout;
    
    const hideCta = () => {
      floatingCta.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none');
      floatingCta.classList.remove('opacity-100', 'translate-y-0');
    };

    const showCta = () => {
      floatingCta.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none');
      floatingCta.classList.add('opacity-100', 'translate-y-0');
    };

    // 1. Initially hide after a delay
    setTimeout(() => {
      hideCta();
    }, 3500);

    // 2. Handle scroll (Passive listener)
    window.addEventListener('scroll', () => {
      showCta();
      clearTimeout(scrollTimeout);
      
      // Set a new timeout to hide when scrolling stops
      scrollTimeout = setTimeout(() => {
        if (!floatingCta.matches(':hover')) {
          hideCta();
        }
      }, 2500);
    }, { passive: true });

    // 3. Keep visible when hovered
    floatingCta.addEventListener('mouseenter', () => {
      clearTimeout(scrollTimeout);
      showCta();
    });
    
    floatingCta.addEventListener('mouseleave', () => {
      scrollTimeout = setTimeout(() => {
        hideCta();
      }, 2500);
    });
  }
});
