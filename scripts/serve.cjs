const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8765);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.png':'image/png' };
http.createServer((req, res) => {
  let filename;
  try { filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400); res.end(); return; }
  if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  if (filename === root) filename = path.join(root, 'index.html');
  fs.readFile(filename, (err, bytes) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type':types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(bytes);
  });
}).listen(port, '127.0.0.1', () => console.log(`Pet preview: http://127.0.0.1:${port}`));
