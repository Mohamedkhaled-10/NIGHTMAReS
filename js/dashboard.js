const db = firebase.database();

function renderInput(id, field, value, onChange) {
  return `<input class="bg-gray-800 p-2 rounded w-full"
    value="${value}" onchange="dashboardUpdate('${id}','${field}', this.value, '${onChange}')" />`;
}

window.dashboardUpdate = function (id, field, val, section) {
  const ref = db.ref(section).child(id);
  ref.update({ [field]: val });
};

function renderSection(sectionId, sectionName) {
  const container = document.getElementById(sectionId + 'Container');
  const ref = db.ref(sectionId);

  ref.on("value", snapshot => {
    container.innerHTML = '';
    snapshot.forEach(child => {
      const data = child.val();
      const id = child.key;

      container.innerHTML += `
        <div class="bg-gray-900 p-4 rounded space-y-2">
          ${Object.entries(data).map(([k, v]) =>
            `<label class="block text-sm">${k}</label>${renderInput(id, k, v, sectionId)}`
          ).join('')}
          <button onclick="deleteItem('${sectionId}','${id}')" class="bg-red-600 px-3 py-1 rounded mt-2">🗑 حذف</button>
        </div>
      `;
    });
  });
}

function deleteItem(section, id) {
  db.ref(section).child(id).remove();
}

function addCard() {
  const ref = db.ref("cards");
  const newCard = {
    title: "عنوان جديد",
    image: "/assets/images/example.webp",
    link: "stories/x/x.html"
  };
  ref.push(newCard);
}

function addNews() {
  const ref = db.ref("news");
  const newNews = {
    title: "عنوان الخبر",
    image: "https://example.com/image.jpg",
    summary: "ملخص الخبر...",
    details: "تفاصيل الخبر الكاملة..."
  };
  ref.push(newNews);
}

// عرض البيانات عند تحميل الصفحة
renderSection("cards", "cards");
renderSection("news", "news");
