const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/shot\.zone\.id/g, 'short.dot.zone.id');
  fs.writeFileSync(filePath, content, 'utf8');
}

['src/views/Home.tsx', 'src/views/Redirect.tsx', 'src/app/api/esshortens/route.ts'].forEach(replaceInFile);
console.log("Domain replacements complete");
