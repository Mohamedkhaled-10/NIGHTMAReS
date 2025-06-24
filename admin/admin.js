document.getElementById("cardForm").addEventListener("submit", function (e) {
  e.preventDefault();
  let num = parseInt(document.getElementById("cardNumber").value) - 1;

  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      data.cards[num].image = document.getElementById("cardImageURL").value;
      data.cards[num].title = document.getElementById("cardTitle").value;
      data.cards[num].link = document.getElementById("cardLink").value;

      // هنا المفروض تحفظ البيانات في ملف data.json من خلال backend (Node.js أو PHP)
      alert("تم تحديث القالب بنجاح!");
    });
});

document.getElementById("newsForm").addEventListener("submit", function (e) {
  e.preventDefault();
  let num = parseInt(document.getElementById("newsNumber").value) - 1;

  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      data.news[num].image = document.getElementById("newsImage").value;
      data.news[num].title = document.getElementById("newsTitle").value;
      data.news[num].short = document.getElementById("newsShort").value;
      data.news[num].more = document.getElementById("newsMore").value;

      alert("تم تحديث الخبر!");
    });
});
