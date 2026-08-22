export const UILoadingSkeleton = (count = 3) => {
  let skeletons = '';
  for(let i=0; i<count; i++) {
    skeletons += `
      <div class="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-subtle)] overflow-hidden animate-pulse">
        <div class="h-48 bg-[var(--color-bg-elevated)]"></div>
        <div class="p-5 space-y-4">
          <div class="h-4 bg-[var(--color-bg-elevated)] rounded w-1/3"></div>
          <div class="h-6 bg-[var(--color-bg-elevated)] rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-3 bg-[var(--color-bg-elevated)] rounded"></div>
            <div class="h-3 bg-[var(--color-bg-elevated)] rounded w-5/6"></div>
          </div>
        </div>
      </div>
    `;
  }
  return skeletons;
};

export const UISpinner = (text = "جاري الاستحضار...") => `
  <div class="flex flex-col items-center justify-center py-10 w-full col-span-full">
    <div class="relative w-12 h-12 flex items-center justify-center mb-4">
      <div class="absolute inset-0 border-2 border-accent-30 border-t-[var(--color-accent)] rounded-full animate-spin"></div>
      <i class="fa-solid fa-ghost text-accent-50 text-sm animate-pulse"></i>
    </div>
    <p class="text-[var(--color-text-meta)] font-semibold text-sm">${text}</p>
  </div>
`;

export const UIEmptyState = (message = "لا يوجد محتوى حالياً", icon = "fa-spider") => `
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center w-full col-span-full bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-subtle)] border-dashed">
    <div class="w-20 h-20 mb-6 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center shadow-inner">
      <i class="fa-solid ${icon} text-3xl text-[var(--color-text-meta)] opacity-50"></i>
    </div>
    <h3 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">لا يوجد شيء هنا</h3>
    <p class="text-[var(--color-text-secondary)] max-w-sm mx-auto text-sm leading-relaxed">${message}</p>
  </div>
`;

export const UIErrorState = (message = "حدث خطأ في الاتصال", retryId = "btn-retry") => `
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center w-full col-span-full bg-accent-10 rounded-2xl border border-[var(--color-accent)]/20">
    <div class="w-16 h-16 mb-4 rounded-full bg-accent-20 flex items-center justify-center text-[var(--color-accent)]">
      <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
    </div>
    <h3 class="text-lg font-bold text-[var(--color-accent)] mb-2">حدث خطأ</h3>
    <p class="text-[var(--color-text-meta)] text-sm mb-6 max-w-sm">${message}</p>
    <button id="${retryId}" class="px-6 py-2.5 bg-[var(--color-bg-surface)] hover:bg-accent-20 border border-accent-50 hover:border-[var(--color-accent)] text-[var(--color-accent)] rounded-lg transition-all text-sm font-bold flex items-center gap-2 group focus:outline-none">
      <i class="fa-solid fa-rotate-right group-hover:rotate-180 transition-transform duration-500"></i> حاول مرة أخرى
    </button>
  </div>
`;

export const UISuccessState = (message = "تمت العملية بنجاح!") => `
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center w-full col-span-full bg-green-950/10 rounded-2xl border border-green-900/20">
    <div class="w-16 h-16 mb-4 rounded-full bg-green-900/20 flex items-center justify-center text-green-500">
      <i class="fa-solid fa-circle-check text-2xl"></i>
    </div>
    <h3 class="text-lg font-bold text-green-400 mb-2">نجاح</h3>
    <p class="text-[var(--color-text-secondary)] text-sm max-w-sm">${message}</p>
  </div>
`;

export const showToast = ({ type = 'info', title, message, duration = 4000 }) => {
  let container = document.getElementById('nightmares-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'nightmares-toast-container';
    container.className = 'fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[100] flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  
  let iconClass = 'fa-info-circle text-blue-500';
  let borderClass = 'border-blue-900/50';
  let titleColor = 'text-blue-400';
  
  if (type === 'success') {
    iconClass = 'fa-check-circle text-green-500';
    borderClass = 'border-green-900/50';
    titleColor = 'text-green-400';
  } else if (type === 'error') {
    iconClass = 'fa-triangle-exclamation text-[var(--color-accent)]';
    borderClass = 'border-accent-50';
    titleColor = 'text-[var(--color-accent)]';
    if (duration === 4000) duration = 6000;
  } else if (type === 'warning') {
    iconClass = 'fa-exclamation-circle text-yellow-500';
    borderClass = 'border-yellow-900/50';
    titleColor = 'text-yellow-400';
  }
  
  toast.className = `flex items-start gap-3 bg-[var(--color-bg-elevated)] backdrop-blur-md border ${borderClass} shadow-elevation p-4 rounded-xl pointer-events-auto transform sm:translate-x-full -translate-y-full sm:translate-y-0 opacity-0 transition-all duration-300 relative overflow-hidden group`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', 'polite');
  
  const accent = `<div class="absolute right-0 top-0 bottom-0 w-1 ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-[var(--color-accent)]' : type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'}"></div>`;

  toast.innerHTML = `
    ${accent}
    <div class="mt-0.5 shrink-0 mr-1 ml-2">
      <i class="fa-solid ${iconClass} text-xl drop-shadow-md"></i>
    </div>
    <div class="flex-1 min-w-0 pl-1 text-right">
      ${title ? `<h4 class="text-sm font-bold ${titleColor} mb-1">${title}</h4>` : ''}
      <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">${message}</p>
    </div>
    <button class="shrink-0 text-[var(--color-text-meta)] hover:text-[var(--color-text-primary)] transition-colors p-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] rounded" aria-label="إغلاق">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('sm:translate-x-full', '-translate-y-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'translate-y-0', 'opacity-100');
  });

  const removeToast = () => {
    toast.classList.remove('translate-x-0', 'translate-y-0', 'opacity-100');
    toast.classList.add('opacity-0', 'scale-95'); // simpler exit animation
    toast.addEventListener('transitionend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      if (container.childNodes.length === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
  };

  toast.querySelector('button').addEventListener('click', removeToast);

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
};

export const showConfirmModal = ({ title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', confirmColor = 'red' }) => {
  return new Promise((resolve) => {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');
    
    let btnColorClass = 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white border-white/20 focus:ring-2 focus:ring-[var(--color-accent)]';
    let iconColorClass = 'bg-accent-10 border-accent-30 text-[var(--color-accent)]';
    
    if (confirmColor === 'green') {
      btnColorClass = 'bg-green-700 hover:bg-green-600 text-white border-green-500/50 focus:ring-green-500';
      iconColorClass = 'bg-green-900/20 border-green-900/30 text-green-500';
    }

    modalOverlay.innerHTML = `
      <div class="bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-2xl p-6 shadow-elevation max-w-sm w-full transform scale-95 transition-transform duration-300 text-right" tabindex="-1">
        <div class="w-12 h-12 rounded-full ${iconColorClass} border flex items-center justify-center mb-4">
          <i class="fa-solid fa-triangle-exclamation text-xl"></i>
        </div>
        <h3 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">${title}</h3>
        <p class="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">${message}</p>
        <div class="flex items-center justify-end gap-3">
          <button id="confirm-cancel-btn" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] focus:outline-none transition-all">
            ${cancelText}
          </button>
          <button id="confirm-accept-btn" class="px-5 py-2.5 rounded-lg text-sm font-semibold border ${btnColorClass} shadow-lg focus:outline-none transition-all">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const modalContent = modalOverlay.querySelector('div');

    requestAnimationFrame(() => {
      modalOverlay.classList.remove('opacity-0');
      modalContent.classList.remove('scale-95');
    });

    const closeModal = (result) => {
      modalOverlay.classList.add('opacity-0');
      modalContent.classList.add('scale-95');
      modalOverlay.addEventListener('transitionend', () => {
        if (modalOverlay.parentNode) modalOverlay.parentNode.removeChild(modalOverlay);
        resolve(result);
      });
    };

    modalOverlay.querySelector('#confirm-accept-btn').addEventListener('click', () => closeModal(true));
    modalOverlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => closeModal(false));
    
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal(false);
    });

    modalOverlay.querySelector('#confirm-cancel-btn').focus();
  });
};



export const generateStoryCard = (item, displayTitle, categoryName, snippet) => `
  <article class="premium-story-card">
    <div class="story-image-wrapper">
      <img src="${item.coverImage || '/assets/images/icon-white.png'}" alt="${item.title || ''}" loading="lazy" decoding="async">
      <div class="story-overlay"></div>
      ${categoryName ? `<span class="story-category">${categoryName}</span>` : ''}
    </div>
    <div class="story-content">
      <h3 class="story-title">${displayTitle || item.title || ''}</h3>
      ${snippet ? `<p class="story-excerpt">${snippet}</p>` : ''}
      <div class="story-meta">
        <span class="story-author">${item.authorName || 'إدارة الكوابيس'}</span>
        ${item.readingTime ? `<span class="story-time"><i class="fa-solid fa-clock"></i> ${item.readingTime}</span>` : ''}
      </div>
    </div>
  </article>
`;

export const generateNewsCard = (item, displayTitle, snippet, categoryName) => {
  let dateObj = null;
  if (item.publishAt) {
    dateObj = item.publishAt.toDate ? item.publishAt.toDate() : new Date(item.publishAt);
  } else if (item.createdAt) {
    dateObj = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
  }
  const dateStr = dateObj ? dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  
  return `
    <article class="premium-news-card">
      <div class="news-image-wrapper">
        <img src="${item.coverImage || '/assets/images/icon-white.png'}" alt="${item.title || ''}" loading="lazy" decoding="async">
      </div>
      <div class="news-content">
        <div class="news-header">
          ${categoryName ? `<span class="news-category">${categoryName}</span>` : ''}
          ${dateStr ? `<span class="news-date">${dateStr}</span>` : ''}
        </div>
        <h3 class="news-title">${displayTitle || item.title || ''}</h3>
        ${snippet ? `<p class="news-excerpt">${snippet}</p>` : ''}
        <div class="news-footer">
          <span class="read-more-btn">اقرأ التفاصيل <i class="fa-solid fa-arrow-left"></i></span>
        </div>
      </div>
    </article>
  `;
};

export const generateVideoCard = (item, displayTitle, categoryName) => `
  <article class="premium-video-card">
    <div class="video-image-wrapper">
      <img src="${item.coverImage || '/assets/images/icon-white.png'}" alt="${item.title || ''}" loading="lazy" decoding="async">
      <div class="video-overlay"></div>
      <div class="play-indicator">
        <i class="fa-solid fa-play"></i>
      </div>
    </div>
    <div class="video-content">
      <h3 class="video-title">${displayTitle || item.title || ''}</h3>
      ${categoryName ? `<span class="video-category">${categoryName}</span>` : ''}
    </div>
  </article>
`;

export const showPromptModal = ({ title, message, placeholder = '', confirmText = 'تأكيد', cancelText = 'إلغاء' }) => {
  return new Promise((resolve) => {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    
    modalOverlay.innerHTML = `
      <div class="bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-2xl p-6 shadow-elevation max-w-sm w-full transform scale-95 transition-transform duration-300 text-right">
        <h3 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">${title}</h3>
        <p class="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">${message}</p>
        <input type="text" id="prompt-input" class="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-2 text-[var(--color-text-primary)] mb-6 focus:outline-none focus:border-[var(--color-accent)]" placeholder="${placeholder}" autocomplete="off">
        <div class="flex items-center justify-end gap-3">
          <button id="prompt-cancel-btn" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] focus:outline-none transition-all">${cancelText}</button>
          <button id="prompt-accept-btn" class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white border border-white/20 shadow-lg focus:outline-none transition-all">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
    const modalContent = modalOverlay.querySelector('div');
    const input = modalOverlay.querySelector('#prompt-input');
    
    requestAnimationFrame(() => {
      modalOverlay.classList.remove('opacity-0');
      modalContent.classList.remove('scale-95');
      input.focus();
    });
    
    const closeModal = (result) => {
      modalOverlay.classList.add('opacity-0');
      modalContent.classList.add('scale-95');
      modalOverlay.addEventListener('transitionend', () => {
        if (modalOverlay.parentNode) modalOverlay.parentNode.removeChild(modalOverlay);
        resolve(result);
      });
    };
    
    modalOverlay.querySelector('#prompt-accept-btn').addEventListener('click', () => closeModal(input.value.trim()));
    modalOverlay.querySelector('#prompt-cancel-btn').addEventListener('click', () => closeModal(null));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') closeModal(input.value.trim());
      if (e.key === 'Escape') closeModal(null);
    });
  });
};
