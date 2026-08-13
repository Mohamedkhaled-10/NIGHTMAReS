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

// Serve static files from the current directory
app.use(express.static(__dirname));

app.get(['/story/:slug', '/news/:slug', '/video/:slug'], (req, res) => {
  res.sendFile(path.join(__dirname, 'article.html'));
});

// Serve specific static HTML pages without .html extension
const pages = ['login', 'dashboard', 'profile', 'search', 'submit', 'download-page', 'character', 'Terms-of-Use-and-Privacy-Policy', 'contact-us'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', `${page}.html`));
  });
});

// For any other route, serve index.html (SPA fallback, though this seems to be multi-page)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
