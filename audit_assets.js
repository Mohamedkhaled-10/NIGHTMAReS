const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('find . -type f -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json"').toString().split('\n').filter(Boolean);
const existingAssets = execSync('find assets -type f').toString().split('\n').filter(Boolean).map(f => '/' + f);
existingAssets.push('/favicon.ico');

const usedAssets = new Set();
const missingAssets = new Set();

files.forEach(file => {
  if (file.includes('node_modules') || file.includes('audit_assets')) return;
  const content = fs.readFileSync(file, 'utf-8');
  
  // match assets/images/... to the next quote
  const regex = /['"(](?:https?:\/\/[^\/]+)?\/?(assets\/images\/[^'"()]+|favicon\.ico|images\/[^'"()]+)['")]/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let rawPath = match[1];
    
    if (rawPath.startsWith('images/')) {
        rawPath = '/assets/' + rawPath;
    } else if (!rawPath.startsWith('/')) {
        rawPath = '/' + rawPath;
    }

    try {
        rawPath = decodeURI(rawPath);
    } catch(e){}

    usedAssets.add(rawPath);
    if (!existingAssets.includes(rawPath)) {
        missingAssets.add(`${rawPath} (in ${file})`);
    }
  }
});

console.log("=== MISSING ASSETS ===");
missingAssets.forEach(a => console.log(a));

console.log("\n=== UNUSED ASSETS ===");
existingAssets.forEach(a => {
  if (!usedAssets.has(a) && !usedAssets.has(encodeURI(a))) {
    console.log(a);
  }
});
