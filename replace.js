const fs = require('fs');

const htmlFiles = [
  'index.html',
  'article.html',
  'pages/Terms-of-Use-and-Privacy-Policy.html',
  'pages/download-page.html',
  'pages/search.html',
  'pages/dashboard.html',
  'pages/login.html',
  'pages/contact-us.html',
  'pages/character.html',
  'pages/profile.html',
  'pages/submit.html'
];

htmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove old Navbars
    // For index.html
    content = content.replace(/<nav class="navbar hidden md:block">[\s\S]*?<\/div>\s*<\/div>\s*(?=<!-- قسم الـ Hero -->)/, '<!-- NAVBAR_PLACEHOLDER -->\n');
    // For article.html
    content = content.replace(/<nav class="navbar">[\s\S]*?<\/nav>/, '<!-- NAVBAR_PLACEHOLDER -->\n');
    // For profile.html
    content = content.replace(/<nav class="bg-gray-800 p-4 shadow-lg sticky top-0 z-50">[\s\S]*?<\/nav>/, '<!-- NAVBAR_PLACEHOLDER -->\n');
    
    // Add Placeholder if not present (for pages without nav like login.html)
    if (!content.includes('<!-- NAVBAR_PLACEHOLDER -->')) {
      content = content.replace(/<body[^>]*>/, match => `${match}\n<!-- NAVBAR_PLACEHOLDER -->\n`);
    }

    // 2. Remove old Footers
    // For index.html
    content = content.replace(/<footer id="footer">[\s\S]*?<\/footer>/, '<!-- FOOTER_PLACEHOLDER -->\n');
    // For article.html
    content = content.replace(/<footer>[\s\S]*?<\/footer>/, '<!-- FOOTER_PLACEHOLDER -->\n');
    
    // Remove inline floating buttons and age verification if they exist so they don't duplicate
    content = content.replace(/<!-- Share Story Floating Button -->[\s\S]*?<\/a>/, '');
    content = content.replace(/<!-- Age Verification Popup -->[\s\S]*?<\/div>\s*<\/div>/, '');

    // Add Placeholder if not present
    if (!content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
      // Find script tags before closing body, or just replace closing body
      content = content.replace(/<\/body>/, '<!-- FOOTER_PLACEHOLDER -->\n</body>');
    }

    // Remove inline JS blocks related to navbar/footer from index.html and main.js? We will clean up main.js later.
    // For now, let's write back
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
