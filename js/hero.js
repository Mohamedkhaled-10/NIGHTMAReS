/**
 * NIGHTMAReS — Editorial Hero Controller
 * Handles dynamic content population and restrained desktop atmospheric interaction.
 */

export function updateHeroFeaturedStory(story) {
  if (!story) return;

  const card = document.getElementById('hero-featured-card');
  const titleEl = document.getElementById('hero-featured-title');
  const imgEl = document.getElementById('hero-featured-img');
  const catEl = document.getElementById('hero-featured-category');
  const linkEl = document.getElementById('hero-featured-link');
  const cardContainerLink = document.getElementById('hero-featured-card-link');
  const primaryCta = document.getElementById('hero-primary-cta');
  const dateEl = document.getElementById('hero-featured-date');

  const storyUrl = `/story/${story.slug}`;

  if (titleEl && story.title) {
    titleEl.textContent = story.title;
  }

  if (imgEl) {
    if (story.coverImage) {
      imgEl.src = story.coverImage;
      imgEl.alt = story.title || "القصة المميزة";
    }
  }

  if (catEl) {
    catEl.textContent = story.category || 'قصة مميزة';
  }

  if (dateEl) {
    const rawDate = story.publishAt || story.createdAt;
    if (rawDate) {
      const d = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
      dateEl.textContent = d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }

  if (linkEl) {
    linkEl.href = storyUrl;
  }

  if (cardContainerLink) {
    cardContainerLink.href = storyUrl;
  }

  if (primaryCta) {
    primaryCta.href = storyUrl;
  }

  if (card) {
    card.classList.remove('opacity-60');
  }
}

/**
 * Initializes restrained desktop mouse interaction (subtle parallax)
 * Strictly disabled on mobile / touch / prefers-reduced-motion.
 */
export function initHeroInteractions() {
  const heroSection = document.getElementById('home');
  const floatingCard = document.getElementById('hero-featured-card');
  
  if (!heroSection || !floatingCard) return;

  // Check if device supports fine hover and doesn't prefer reduced motion
  const isDesktop = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isDesktop || prefersReducedMotion) return;

  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;
  let isHovered = false;
  let rafId = null;

  const onMouseMove = (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX = x * 8; // Max 4px range in either direction
    mouseY = y * 8;
  };

  const onMouseEnter = () => {
    isHovered = true;
    loop();
  };

  const onMouseLeave = () => {
    isHovered = false;
    mouseX = 0;
    mouseY = 0;
  };

  const loop = () => {
    currentX += (mouseX - currentX) * 0.05;
    currentY += (mouseY - currentY) * 0.05;

    if (floatingCard) {
      floatingCard.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
    }

    if (isHovered || Math.abs(mouseX - currentX) > 0.05 || Math.abs(mouseY - currentY) > 0.05) {
      rafId = requestAnimationFrame(loop);
    } else {
      if (floatingCard) {
        floatingCard.style.transform = '';
      }
      cancelAnimationFrame(rafId);
    }
  };

  heroSection.addEventListener('mousemove', onMouseMove, { passive: true });
  heroSection.addEventListener('mouseenter', onMouseEnter, { passive: true });
  heroSection.addEventListener('mouseleave', onMouseLeave, { passive: true });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroInteractions);
} else {
  initHeroInteractions();
}
