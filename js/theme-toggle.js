/**
 * 🌓 NIGHTMAReS Theme Toggle Engine
 * يدعم التبديل السلس بين الوضع الداكن (Cinematic Noir) والوضع الفاتح (Premium Editorial Light)
 */
(function() {
  const THEME_STORAGE_KEY = 'nightmares-theme';

  // قراءة السمة المحفوظة أو تعيين الوضع الداكن كافتراضي دائماً
  function getPreferredTheme() {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch (e) {
      console.warn('localStorage is not accessible:', e);
    }
    return 'dark'; // الوضع الداكن هو الافتراضي دائماً للزوار الجدد
  }

  // تطبيق السمة على وسم html وتحديث أي أيقونات/أزرار تبديل
  function applyTheme(theme) {
    const currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // إشعار أي عناصر مستمعة بتغيير السمة
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: currentTheme } }));
    
    // تحديث شكل أيقونات أزرار التبديل إن وُجدت
    updateToggleButtons(currentTheme);
  }

  // تحديث حالة أزرار التبديل في الصفحة
  function updateToggleButtons(theme) {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن');
      const iconDark = btn.querySelector('.theme-icon-dark');
      const iconLight = btn.querySelector('.theme-icon-light');
      if (iconDark && iconLight) {
        if (theme === 'light') {
          iconDark.style.display = 'none';
          iconLight.style.display = 'inline-flex';
        } else {
          iconDark.style.display = 'inline-flex';
          iconLight.style.display = 'none';
        }
      }
    });
  }

  // تبديل السمة وحفظها في localStorage
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Unable to save theme to localStorage:', e);
    }
    applyTheme(newTheme);
    return newTheme;
  }

  // تصدير الدوال للاستخدام العام
  window.getNightmaresTheme = getPreferredTheme;
  window.applyNightmaresTheme = applyTheme;
  window.toggleTheme = toggleTheme;

  // تطبيق السمة فور تحميل السكربت
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // تحديث الأزرار وإضافة مستمعات الأحداث
  function init() {
    updateToggleButtons(initialTheme);
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
