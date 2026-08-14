document.addEventListener("DOMContentLoaded", () => {
  /* Marker movement */
  let marker = document.querySelector('#marker');
  let listItems = document.querySelectorAll('.navbar ul li');
  function moveIndicator(element) {
    if(!marker || !element) return;
    marker.style.left = element.offsetLeft + "px";
    marker.style.width = element.offsetWidth + "px";
  }
  
  // Set active state based on current URL
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;
  
  listItems.forEach(item => {
    item.classList.remove('active');
    const link = item.querySelector('a');
    if (link) {
      const href = link.getAttribute('href');
      if (href === currentPath || href === currentPath + currentHash || (currentPath === '/' && href === '/#home' && !currentHash)) {
        item.classList.add('active');
      }
    }
  });
  
  // Set initial marker position
  let active = document.querySelector('.navbar ul li.active');
  if (active) moveIndicator(active);

  listItems.forEach(item => {
    item.addEventListener('mousemove', function() {
      moveIndicator(this);
    });
    item.addEventListener('mouseleave', function() {
      let active = document.querySelector('.navbar ul li.active');
      if (active) moveIndicator(active);
    });
    item.addEventListener('click', function() {
      listItems.forEach(item => item.classList.remove('active'));
      this.classList.add('active');
      moveIndicator(this);
    });
  });

  /* Search Toggle */
  const searchToggle = document.getElementById("searchToggle");
  const searchForm = document.getElementById("searchForm");
  let searchOpen = false;
  if(searchToggle && searchForm) {
    searchToggle.addEventListener("click", () => {
      if (searchOpen) {
        searchForm.style.maxHeight = "0";
      } else {
        searchForm.style.maxHeight = "200px";
      }
      searchOpen = !searchOpen;
    });
  }

  /* Hamburger Menu Toggle */
  const menuBtn = document.getElementById('menuBtn');
  const sidebarMenu = document.getElementById('sidebarMenu');
  const overlay = document.getElementById('overlay');
  const hamburgerWrapper = document.getElementById('hamburgerWrapper');
  const navbar = document.querySelector('.navbar');

  if(menuBtn) {
    menuBtn.addEventListener('click', () => {
      if(sidebarMenu) sidebarMenu.classList.remove('translate-x-full');
      if(overlay) overlay.classList.remove('hidden');
      if(hamburgerWrapper) hamburgerWrapper.classList.add('hidden');
    });
  }

  if(overlay) {
    overlay.addEventListener('click', () => {
      if(sidebarMenu) sidebarMenu.classList.add('translate-x-full');
      if(overlay) overlay.classList.add('hidden');
      if(hamburgerWrapper) hamburgerWrapper.classList.remove('hidden');
    });
  }

  /* Mobile Search Toggle */
  const mobileSearchBtn = document.getElementById("mobileSearchBtn");
  const mobileSearchForm = document.getElementById("mobileSearchForm");
  let isSearchOpen = false;
  if (mobileSearchBtn && mobileSearchForm) {
    mobileSearchBtn.addEventListener("click", () => {
      if (isSearchOpen) {
        mobileSearchForm.style.maxHeight = "0";
      } else {
        mobileSearchForm.style.maxHeight = "120px";
      }
      isSearchOpen = !isSearchOpen;
    });
  }

  /* Notifications Toggle */
  const notifBtn = document.getElementById("notifBtn");
  const notifMenu = document.getElementById("notifMenu");
  const notifDot = document.getElementById("notifDot");
  if (notifBtn && notifMenu) {
    notifBtn.addEventListener("click", () => {
      notifMenu.classList.toggle("hidden");
      if (notifDot) notifDot.classList.add("hidden");
    });
    window.addEventListener("click", (e) => {
      if (!notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
        notifMenu.classList.add("hidden");
      }
    });
  }

  /* Scroll Hide/Show */
  let lastScrollTop = 0;
  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      if(navbar) navbar.style.top = '-80px';
      if(hamburgerWrapper) hamburgerWrapper.style.transform = "translateX(100px)";
    } else {
      if(navbar) navbar.style.top = '0';
      if(hamburgerWrapper) hamburgerWrapper.style.transform = "translateX(0)";
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });

  /* Search Redirect logic */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const input = e.target.querySelector('input[type="search"]');
    if(input && input.value.trim()) {
      window.location.href = '/search?q=' + encodeURIComponent(input.value.trim());
    }
  };
  if(searchForm) searchForm.addEventListener('submit', handleSearchSubmit, true);
  if(mobileSearchForm) mobileSearchForm.addEventListener('submit', handleSearchSubmit, true);
});
