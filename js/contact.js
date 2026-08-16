import { UISuccessState, UIErrorState } from './ui-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const btnSubmit = document.getElementById('btn-submit');
  
  if(form) {
    // Create a container for messages
    const msgContainer = document.createElement('div');
    msgContainer.id = 'status-msg';
    msgContainer.className = 'hidden mt-8';
    form.parentNode.appendChild(msgContainer);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const btnText = btnSubmit.querySelector('span');
      const originalText = btnText.textContent;
      const btnIcon = btnSubmit.querySelector('i');
      
      btnSubmit.disabled = true;
      btnText.textContent = 'جاري الإرسال...';
      btnIcon.className = 'fa-solid fa-spinner fa-spin';
      msgContainer.classList.add('hidden');
      
      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          form.reset();
          msgContainer.innerHTML = UISuccessState('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
          msgContainer.classList.remove('hidden');
          form.style.display = 'none'; // hide form on success
        } else {
          msgContainer.innerHTML = UIErrorState('حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.', 'retry-contact');
          msgContainer.classList.remove('hidden');
          document.getElementById('retry-contact')?.addEventListener('click', () => btnSubmit.click());
        }
      } catch (error) {
        console.error('Contact form error:', error);
        msgContainer.innerHTML = UIErrorState('حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.', 'retry-contact');
        msgContainer.classList.remove('hidden');
        document.getElementById('retry-contact')?.addEventListener('click', () => btnSubmit.click());
      } finally {
        btnSubmit.disabled = false;
        btnText.textContent = originalText;
        btnIcon.className = 'fa-solid fa-paper-plane group-hover:-translate-x-1 transition-transform';
      }
    });
  }
});
