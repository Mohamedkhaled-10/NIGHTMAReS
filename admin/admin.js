const db = firebase.database();

function saveCard(index, data) {
  firebase.database().ref("cards/" + index).set(data)
    .then(() => alert("✅ تم حفظ القالب"))
    .catch((err) => alert("❌ فشل في الحفظ: " + err.message));
}

function saveNews(index, data) {
  firebase.database().ref("news/" + index).set(data)
    .then(() => alert("✅ تم حفظ الخبر"))
    .catch((err) => alert("❌ فشل في الحفظ: " + err.message));
}

document.getElementById("cardForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const index = document.getElementById("cardNumber").value - 1;
  const data = {
    image: document.getElementById("cardImageURL").value,
    title: document.getElementById("cardTitle").value,
    link: document.getElementById("cardLink").value
  };
  saveCard(index, data);
});

document.getElementById("newsForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const index = document.getElementById("newsNumber").value - 1;
  const data = {
    image: document.getElementById("newsImage").value,
    title: document.getElementById("newsTitle").value,
    short: document.getElementById("newsShort").value,
    more: document.getElementById("newsMore").value
  };
  saveNews(index, data);
});
