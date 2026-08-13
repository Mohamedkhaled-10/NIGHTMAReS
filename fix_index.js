const fs = require('fs');

const liveHtml = fs.readFileSync('index_live.html', 'utf8');

// Extract the body content from the live HTML
const bodyMatch = liveHtml.match(/<!-- قسم الـ Hero -->[\s\S]*?(?=<!-- Horror Character Feature -->|<footer)/);

if (bodyMatch) {
  const head = liveHtml.match(/[\s\S]*?(?=<\/head>)/)[0] + '</head>\n<body>\n<!-- NAVBAR_PLACEHOLDER -->\n';
  let bodyContent = bodyMatch[0];
  
  // We need to also get the script tags that were right after the footer or at the bottom
  const scriptContent = `
<!-- FOOTER_PLACEHOLDER -->
<script src="/js/main.js"></script>
<script type="module" src="/js/notifications-ads.js"></script>
<script type="module" src="/js/home-feed.js"></script>
<script>
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").then(() => {
      console.log("Service Worker Registered");
    }).catch(error => {
      console.log("Service Worker registration failed:", error);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".read-more-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const textElement = this.previousElementSibling.querySelector(".more-text");
        if (textElement.style.display === "none") {
          textElement.style.display = "inline";
          this.textContent = "إخفاء";
        } else {
          textElement.style.display = "none";
          this.textContent = "اقرأ المزيد";
        }
      });
    });
  });
</script>
</body>
</html>
`;
  
  fs.writeFileSync('index.html', head + bodyContent + scriptContent);
  console.log('Restored index.html');
} else {
  console.log('Could not find body content in live HTML');
}
