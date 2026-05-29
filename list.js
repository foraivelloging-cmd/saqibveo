const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) { 
        if (!file.includes('node_modules') && !file.includes('.next')) {
          results = results.concat(walk(file));
        }
      } else { 
        results.push(file);
      }
    });
  } catch (err) {}
  return results;
}

console.log(walk('src/app/api'));
