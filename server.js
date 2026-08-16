const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.get('/api/firebase-config', (req, res) => {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    res.sendFile(configPath);
  } else {
    res.status(404).json({ error: 'Config not found' });
  }
});

// Helper function to serve HTML with layout
function servePage(res, pagePath) {
  if (!fs.existsSync(pagePath)) {
    return res.status(404).send('404 - Page Not Found');
  }
  let html = fs.readFileSync(pagePath, 'utf8');
  const navbarPath = path.join(__dirname, 'components', 'navbar.html');
  const footerPath = path.join(__dirname, 'components', 'footer.html');
  
  const navbar = fs.existsSync(navbarPath) ? fs.readFileSync(navbarPath, 'utf8') : '';
  const footer = fs.existsSync(footerPath) ? fs.readFileSync(footerPath, 'utf8') : '';
  
  html = html.replace('<!-- NAVBAR_PLACEHOLDER -->', navbar);
  html = html.replace('<!-- FOOTER_PLACEHOLDER -->', footer);
  
  // Ensure Tailwind and main styles are loaded
  if (!html.includes('tailwindcss.com')) {
    html = html.replace('</head>', '  <script src="https://cdn.tailwindcss.com" defer></script>\n</head>');
  }
  if (!html.includes('/styles/main.css') && !html.includes('"styles/main.css"')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="/styles/main.css">\n</head>');
  }
  if (!html.includes('unpkg.com/ionicons')) {
    html = html.replace('</head>', '  <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>\n  <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>\n</head>');
  }
  if (!html.includes('font-awesome')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n</head>');
  }
  
  res.send(html);
}

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Serve static files from the current directory, EXCEPT html files (which need layout injection)
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    // Intercept .html direct accesses and serve with layout (or config injection for admin)
    if (req.path === '/admin/index.html') {
       let html = fs.readFileSync(path.join(__dirname, req.path), 'utf8');
       return res.send(html);
    }
    const pagePath = path.join(__dirname, req.path);
    return servePage(res, pagePath);
  }
  next();
});

app.use(express.static(__dirname, { index: false }));

app.get(['/story/:slug', '/news/:slug', '/video/:slug'], (req, res) => {
  servePage(res, path.join(__dirname, 'article.html'));
});

app.get('/author/:id', (req, res) => {
  servePage(res, path.join(__dirname, 'pages', 'author.html'));
});

// Serve specific static HTML pages without .html extension
const pages = ['login', 'explore', 'profile', 'search', 'submit', 'download-page', 'character', 'Terms-of-Use-and-Privacy-Policy', 'contact-us'];

pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    servePage(res, path.join(__dirname, 'pages', `${page}.html`));
  });
});

app.get('/admin', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'admin', 'index.html'), 'utf8');
  res.send(html);
});

app.get('/', (req, res) => {
  servePage(res, path.join(__dirname, 'index.html'));
});

app.get('/home', (req, res) => {
  servePage(res, path.join(__dirname, 'index.html'));
});

app.get('/sitemap.html', (req, res) => {
  servePage(res, path.join(__dirname, 'sitemap.html'));
});

// Explicit 404 handler
app.use((req, res) => {
  res.status(404);
  servePage(res, path.join(__dirname, '404.html'));
});

// Explicit 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500);
  servePage(res, path.join(__dirname, '500.html'));
});

// Export app for Vercel Serverless Functions
module.exports = app;

// Listen on port 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
