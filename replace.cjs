const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace /api/esshortens with absolute URL in fetches
  content = content.replace(/'\/api\/esshortens'/g, "'https://saqibveo1.vercel.app/api/esshortens'");
  content = content.replace(/`\$\{API_BASE\}\/api\/esshortens/g, "`https://saqibveo1.vercel.app/api/esshortens");
  content = content.replace(/`\$\{API_ENDPOINT\}\/api\/esshortens/g, "`https://saqibveo1.vercel.app/api/esshortens");
  content = content.replace(/\$\{window\.location\.origin\}\/api\/esshortens/g, "https://saqibveo1.vercel.app/api/esshortens");
  
  // also specifically change origin things in text
  content = content.replace(/const API_ENDPOINT = '\$\{window\.location\.origin\}';/g, "const API_ENDPOINT = 'https://saqibveo1.vercel.app';");
  content = content.replace(/API_ENDPOINT = "\$\{window\.location\.origin\}"/g, "API_ENDPOINT = \"https://saqibveo1.vercel.app\"");
  
  // Update activeBackend
  content = content.replace(/https:\/\/saqibveo\.vercel\.app/g, "https://saqibveo1.vercel.app");

  fs.writeFileSync(filePath, content, 'utf8');
}

replaceInFile('src/views/Home.tsx');
if (fs.existsSync('public/index.html')) replaceInFile('public/index.html');
if (fs.existsSync('test-api.js')) replaceInFile('test-api.js');
if (fs.existsSync('test-api.html')) replaceInFile('test-api.html');
console.log("Replacements complete");
