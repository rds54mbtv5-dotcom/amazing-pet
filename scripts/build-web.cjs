// 为每次发布生成同版本资源地址，避免旧 CSS 和新 HTML 混用。
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
fs.mkdirSync(output, { recursive: true });
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const name of ['style.css', 'pet-state.js', 'renderer.js', 'pet.png']) {
  const content = fs.readFileSync(path.join(root, name));
  const extension = path.extname(name);
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  const filename = `${path.basename(name, extension)}.${hash}${extension}`;
  fs.writeFileSync(path.join(output, filename), content);
  html = html.replaceAll(`"${name}"`, `"${filename}"`);
}
fs.writeFileSync(path.join(output, 'index.html'), html);
console.log('Built GitHub Pages site with content-hashed assets in _site/');
