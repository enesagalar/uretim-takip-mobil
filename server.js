#!/usr/bin/env node
/**
 * Ekol Glass Üretim Takip — Mobil LAN Sunucusu
 * Bağımlılık yok; sadece Node.js yeterli.
 * Kullanım:  node server.js [port]     (varsayılan: 8080)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = parseInt(process.argv[2] || process.env.PORT || '8080', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, path.normalize(urlPath).replace(/^([.][.][/\\])+/, ''));

  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Bulunamadi'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': (ext === '.png' || ext === '.svg') ? 'public, max-age=86400' : 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  console.log('┌──────────────────────────────────────────────────┐');
  console.log('│   Ekol Glass Üretim Takip — Mobil LAN Sunucusu   │');
  console.log('└──────────────────────────────────────────────────┘');
  console.log('');
  console.log('  Telefonun aynı Wi-Fi ağındayken şu adresi açın:');
  ips.forEach((ip) => console.log('  →  http://' + ip + ':' + PORT));
  console.log('');
  console.log('  Bu makinenin tarayıcısından: http://localhost:' + PORT);
  console.log('  Kapatmak için: Ctrl+C');
  console.log('');
});
