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
  const mobileAdmin = document.getElementById("mobile-admin-link");
  const mobileLogout = document.getElementById("mobile-logout-btn");

  const updateUI = async (user) => {
    if (user) {
      if (desktopUnauth) desktopUnauth.classList.add("hidden");
      if (desktopAuth) desktopAuth.classList.remove("hidden");
      if (mobileUnauth) mobileUnauth.classList.add("hidden");
      if (mobileAuth) mobileAuth.classList.remove("hidden");
      if (desktopName) desktopName.textContent = user.displayName || "مستخدم";
      if (desktopAvatar && user.photoURL) desktopAvatar.src = user.photoURL;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === "admin") {
            if (desktopAdmin) desktopAdmin.classList.remove("hidden");
            if (mobileAdmin) mobileAdmin.classList.remove("hidden");
          } else {
            if (desktopAdmin) desktopAdmin.classList.add("hidden");
            if (mobileAdmin) mobileAdmin.classList.add("hidden");
          }
        }
      } catch (err) {
        console.error("Error fetching user role", err);
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthUI);
} else {
  initAuthUI();
}
