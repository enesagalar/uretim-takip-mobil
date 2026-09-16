#!/usr/bin/env node
/**
 * Ekol Glass — Tünel Bekçisi v2
 * - ngrok yapılandırılmışsa (tunnel/ngrok.conf): kalıcı statik adresli ngrok çalıştırır.
 * - Değilse: cloudflared hızlı tüneli çalıştırır; adres değişince tunnel.json'ı
 *   güncelleyip GitHub'a iter (mobil uygulama otomatik keşfeder).
 * - Sağlık kontrolü: tünel 3 kez üst üste cevap vermezse süreci yeniden başlatır.
 *
 * Çalıştırma:  node tunnel/watchdog.js
 */
'use strict';
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const TARGET = process.env.TUNNEL_TARGET || 'http://192.168.1.200:3001';
const LOG = path.join(__dirname, 'watchdog.log');
const NGROK_CONF = path.join(__dirname, 'ngrok.conf');

const exeOf = (base) => [
  path.resolve(__dirname, base),
  path.resolve(__dirname, '..', '..', base),
  base.replace(/\.exe$/, '')
];
const cloudflared = exeOf('cloudflared.exe').find((p) => { try { fs.accessSync(p); return true; } catch { return false; } }) || 'cloudflared';
const ngrok = exeOf('ngrok.exe').find((p) => { try { fs.accessSync(p); return true; } catch { return false; } });

const log = (...a) => {
  const line = new Date().toISOString().slice(11, 19) + ' ' + a.join(' ');
  console.log(line);
  try { fs.appendFileSync(LOG, line + '\n'); } catch { /* yoksay */ }
};

function readCurrentUrl() {
  try { return (JSON.parse(fs.readFileSync(path.join(REPO, 'tunnel.json'), 'utf8')) || {}).url || ''; }
  catch { return ''; }
}

function git(args) {
  execFileSync('git', ['-C', REPO].concat(args), { stdio: 'ignore' });
}

function publishUrl(url) {
  if (url === readCurrentUrl()) { log('Adres aynı, yayın gereksiz'); return; }
  fs.writeFileSync(path.join(REPO, 'tunnel.json'), JSON.stringify({ url, ts: new Date().toISOString() }, null, 2) + '\n');
  try {
    git(['add', 'tunnel.json']);
    git(['-c', 'user.name=enesagalar', '-c', 'user.email=enesagalar@users.noreply.github.com', 'commit', '-m', 'tünel: ' + url]);
    git(['push']);
    log('YAYINLANDI:', url);
  } catch (e) {
    log('PUSH HATASI:', String(e.message).slice(0, 120));
  }
}

function readNgrokConf() {
  try {
    const txt = fs.readFileSync(NGROK_CONF, 'utf8');
    const url = (txt.match(/^NGROK_URL=(.+)$/m) || [])[1];
    return url ? { url: url.trim() } : null;
  } catch { return null; }
}

function watchOutput(child, onUrl) {
  let buf = '';
  child.stdout.on('data', (d) => { buf += d.toString(); });
  child.stderr.on('data', (d) => { buf += d.toString(); });
  return setInterval(() => {
    const m = buf.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i) || buf.match(/https:\/\/[a-z0-9.-]+\.ngrok[a-z0-9.-]*/i);
    if (m) onUrl(m[0].replace(/\/$/, ''));
  }, 2000);
}

let currentUrl = '';
let child = null;
let fails = 0;

async function probe(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 9000);
    const r = await fetch(url.replace(/\/+$/, '') + '/api/processes', { signal: ctl.signal, headers: { 'ngrok-skip-browser-warning': 'utm' } });
    clearTimeout(t);
    return r.ok;
  } catch { return false; }
}

async function runForever() {
  const conf = readNgrokConf();
  for (;;) {
    if (conf && ngrok) {
      log('ngrok kipi başlatılıyor →', conf.url);
      publishUrl(conf.url);
      currentUrl = conf.url;
      child = spawn(ngrok, ['http', '--url=' + conf.url, TARGET.replace(/^https?:\/\//, ''), '--log=stdout'], { stdio: ['ignore', 'pipe', 'pipe'] });
    } else {
      log('cloudflared kipi başlatılıyor →', TARGET);
      child = spawn(cloudflared, ['tunnel', '--url', TARGET], { stdio: ['ignore', 'pipe', 'pipe'] });
      const timer = watchOutput(child, (u) => {
        if (u && u !== currentUrl) { currentUrl = u; publishUrl(u); }
      });
      child.on('exit', () => clearInterval(timer));
    }
    child.stdout.on('data', () => {});
    child.stderr.on('data', () => {});
    const exited = new Promise((res) => child.on('exit', (c) => res(c)));

    // sağlık döngüsü
    const health = setInterval(async () => {
      if (!currentUrl) return;
      const ok = await probe(currentUrl);
      if (ok) { fails = 0; return; }
      fails++;
      log('sağlık kontrolü başarısız (' + fails + '/3):', currentUrl);
      if (fails >= 3) {
        log('tünel yanıtsız — yeniden başlatılıyor');
        fails = 0;
        clearInterval(health);
        try { child.kill(); } catch { /* yoksay */ }
      }
    }, 60000);

    const code = await exited;
    clearInterval(health);
    log('süreç kapandı (kod ' + code + '), 5 sn sonra yeniden başlatılacak');
    await new Promise((r) => setTimeout(r, 5000));
  }
}

log('=== Bekçi v2 başladı ===');
runForever().catch((e) => log('FATAL:', e.message));
