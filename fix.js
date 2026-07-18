const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/controllers');
const files = fs.readdirSync(dir);
files.forEach(file => {
  if (file.endsWith('.ts')) {
    let p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/message:\s*error\.message/g, "message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message");
    fs.writeFileSync(p, content);
    console.log('Updated', file);
  }
});
