#!/usr/bin/env node
/**
 * Ekol Glass — Tünel Bekçisi
 * cloudflared hızlı tüneli çalıştırır; adres değişince repo'daki tunnel.json
 * dosyasını güncelleyip GitHub'a iter. Mobil uygulama bu dosyadan güncel
 * tünel adresini otomatik keşfeder.
 *
 * Çalıştırma:  node tunnel/watchdog.js
 * Durdurma:   Ctrl+C (veya görev yöneticisinden node/cloudflared)
 */
'use strict';
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const EXE_CANDIDATES = [
  path.resolve(__dirname, '..', '..', 'cloudflared.exe'),
  path.resolve(__dirname, 'cloudflared.exe'),
  'cloudflared'
];
const TARGET = process.env.TUNNEL_TARGET || 'http://192.168.1.200:3001';
const LOG = path.join(__dirname, 'watchdog.log');

const exe = EXE_CANDIDATES.find((p) => { try { fs.accessSync(p); return true; } catch { return false; } }) || 'cloudflared';
const log = (...a) => {
  const line = new Date().toISOString().slice(11, 19) + ' ' + a.join(' ');
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
};

function readCurrentUrl() {
  try { return (JSON.parse(fs.readFileSync(path.join(REPO, 'tunnel.json'), 'utf8')) || {}).url || ''; }
  catch { return ''; }
}

function pushNewUrl(url) {
  fs.writeFileSync(path.join(REPO, 'tunnel.json'), JSON.stringify({ url, ts: new Date().toISOString() }, null, 2) + '\n');
  try {
    execFileSync('git', ['-C', REPO, 'add', 'tunnel.json'], { stdio: 'ignore' });
    execFileSync('git', ['-C', REPO, '-c', 'user.name=enesagalar', '-c', 'user.email=enesagalar@users.noreply.github.com',
      'commit', '-m', 'tünel: ' + url], { stdio: 'ignore' });
    execFileSync('git', ['-C', REPO, 'push'], { stdio: 'ignore' });
    log('YAYINLANDI:', url);
  } catch (e) {
    log('PUSH HATASI:', String(e.message).slice(0, 120));
  }
}

function runOnce() {
  return new Promise((resolve) => {
    log('Tünel başlatılıyor →', TARGET);
    const child = spawn(exe, ['tunnel', '--url', TARGET], { stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    let published = '';
    const timer = setInterval(() => {
      const m = buf.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m && m[0] !== published) {
        published = m[0];
        if (published !== readCurrentUrl()) pushNewUrl(published);
        else log('Adres aynı, yayın gereksiz:', published);
      }
    }, 2000);
    child.stdout.on('data', (d) => { buf += d.toString(); });
    child.stderr.on('data', (d) => { buf += d.toString(); });
    child.on('exit', (code) => {
      clearInterval(timer);
      log('cloudflared kapandı (kod ' + code + '), 5 sn sonra yeniden başlatılacak');
      resolve();
    });
  });
}

(async () => {
  log('=== Bekçi başladı ===');
  while (true) {
    try { await runOnce(); } catch (e) { log('HATA:', String(e.message).slice(0, 120)); }
    await new Promise((r) => setTimeout(r, 5000));
  }
})();
