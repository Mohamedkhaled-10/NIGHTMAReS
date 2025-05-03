document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const stories = document.querySelectorAll('.story');
  
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filterValue = button.getAttribute('data-filter');
  
        // إخفاء كل القصص
        stories.forEach(story => {
          if (filterValue === 'all' || story.classList.contains(filterValue)) {
            story.style.display = 'block'; // عرض القصص التي تطابق الفلتر
          } else {
            story.style.display = 'none'; // إخفاء القصص التي لا تطابق الفلتر
          }
        });
      });
    });
  });
  