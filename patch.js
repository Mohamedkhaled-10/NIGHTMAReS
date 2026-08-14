const fs = require('fs');
let code = fs.readFileSync('js/firebase-init.js', 'utf8');
code = code.replace(
  /if \('serviceWorker' in navigator\) \{[\s\S]*\}\)/g,
  `if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.update();
    }).catch(err => console.log('SW registration failed:', err));
  };
  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}`
);
fs.writeFileSync('js/firebase-init.js', code);
