import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function initAuthUI() {
  const desktopUnauth = document.getElementById("desktop-auth-unauthenticated");
  const desktopAuth = document.getElementById("desktop-auth-authenticated");
  const desktopAvatar = document.getElementById("desktop-user-avatar");
  const desktopName = document.getElementById("desktop-user-name");
  const desktopAdmin = document.getElementById("desktop-admin-link");
  const desktopLogout = document.getElementById("desktop-logout-btn");

  const mobileUnauth = document.getElementById("mobile-auth-unauthenticated");
  const mobileAuth = document.getElementById("mobile-auth-authenticated");
  const mobileAvatar = document.getElementById("mobile-user-avatar");
  const mobileName = document.getElementById("mobile-user-name");
  const mobileAdmin = document.getElementById("mobile-admin-link");
  const mobileLogout = document.getElementById("mobile-logout-btn");

  const updateUI = async (user) => {
    if (user) {
      if (desktopUnauth) desktopUnauth.classList.add("hidden");
      if (desktopAuth) desktopAuth.classList.remove("hidden");
      if (mobileUnauth) mobileUnauth.classList.add("hidden");
      if (mobileAuth) mobileAuth.classList.remove("hidden");
      
      const dropdownEmail = document.getElementById("desktop-dropdown-user-email");
      if (dropdownEmail && user.email) {
        dropdownEmail.textContent = user.email;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          const displayName = user.displayName || userData.displayName || "مستخدم";
          if (desktopName) desktopName.textContent = displayName;
          if (mobileName) mobileName.textContent = displayName;
          
          const photoURL = user.photoURL || userData.photoURL;
          if (photoURL) {
            if (desktopAvatar) desktopAvatar.src = photoURL;
            if (mobileAvatar) mobileAvatar.src = photoURL;
          }

          if (userData.role === "admin") {
            if (desktopAdmin) desktopAdmin.classList.remove("hidden");
            if (mobileAdmin) mobileAdmin.classList.remove("hidden");
          } else {
            if (desktopAdmin) desktopAdmin.classList.add("hidden");
            if (mobileAdmin) mobileAdmin.classList.add("hidden");
          }
        } else {
          // Fallback if no Firestore doc
          const displayName = user.displayName || "مستخدم";
          if (desktopName) desktopName.textContent = displayName;
          if (mobileName) mobileName.textContent = displayName;
          
          if (user.photoURL) {
            if (desktopAvatar) desktopAvatar.src = user.photoURL;
            if (mobileAvatar) mobileAvatar.src = user.photoURL;
          }
        }
      } catch (err) {
        console.error("Error fetching user data", err);
        // Fallback
        const displayName = user.displayName || "مستخدم";
        if (desktopName) desktopName.textContent = displayName;
        if (mobileName) mobileName.textContent = displayName;
      }
    } else {
      if (desktopUnauth) desktopUnauth.classList.remove("hidden");
      if (desktopAuth) desktopAuth.classList.add("hidden");
      if (mobileUnauth) mobileUnauth.classList.remove("hidden");
      if (mobileAuth) mobileAuth.classList.add("hidden");
      if (desktopAdmin) desktopAdmin.classList.add("hidden");
      if (mobileAdmin) mobileAdmin.classList.add("hidden");
    }
  };

  onAuthStateChanged(auth, updateUI);

  // Handle BFCache navigation
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && auth.currentUser !== undefined) {
      updateUI(auth.currentUser);
    }
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect to home explicitly to prevent being stuck on protected pages
      window.location.href = '/'; 
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  if (desktopLogout) desktopLogout.addEventListener("click", handleLogout);
  if (mobileLogout) mobileLogout.addEventListener("click", handleLogout);

  // Capture current URL for login return
  const loginLinks = document.querySelectorAll('a[href="/login"]');
  loginLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
      window.location.href = '/login';
    });
  });

  // Dropdown toggle logic
  const dropdownBtn = document.getElementById('desktop-user-dropdown-btn');
  const dropdownMenu = document.getElementById('desktop-user-dropdown-menu');
  const dropdownChevron = document.getElementById('desktop-dropdown-chevron');

  if (dropdownBtn && dropdownMenu) {
    const toggleDropdown = (e) => {
      e.stopPropagation();
      const isExpanded = !dropdownMenu.classList.contains('opacity-0');
      if (isExpanded) {
        closeDropdown();
      } else {
        dropdownMenu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        dropdownMenu.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
        if (dropdownChevron) dropdownChevron.style.transform = 'rotate(180deg)';
      }
    };

    const closeDropdown = () => {
      dropdownMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
      dropdownMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
      if (dropdownChevron) dropdownChevron.style.transform = 'rotate(0deg)';
    };

    dropdownBtn.addEventListener('click', toggleDropdown);

    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        closeDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthUI);
} else {
  initAuthUI();
}
