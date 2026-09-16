/* ============================================================
   Ekol Glass Üretim Takip — Mobil İstemci
   Canlı: WebSocket (ws://sunucu:3001) + REST yedek
   ============================================================ */
'use strict';

/* ---------- Yardımcılar ---------- */
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('tr-TR');
const nf1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });
const num = (v) => nf.format(parseInt(v, 10) || 0);
const qtyOf = (v) => parseInt(v, 10) || 0;
const m2fmt = (v) => nf1.format(Math.round(v * 10) / 10);
const trLower = (s) => String(s || '').toLocaleLowerCase('tr-TR');
const pad2 = (n) => String(n).padStart(2, '0');
const dayKey = (d) => { const x = new Date(d); return isNaN(x) ? '' : x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate()); };
const todayKey = () => dayKey(Date.now());
const dateTR = (s) => { const x = new Date(s); return isNaN(x) ? '—' : x.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }); };
const dateFullTR = (s) => { const x = new Date(s); return isNaN(x) ? '—' : x.toLocaleDateString('tr-TR'); };
const timeTR = (s) => { const x = new Date(s); return isNaN(x) ? '' : x.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };
const dateTimeTR = (s) => { const x = new Date(s); return isNaN(x) ? '—' : x.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) + ' ' + timeTR(s); };
const dateTimeFullTR = (s) => { const x = new Date(s); return isNaN(x) ? '—' : x.toLocaleDateString('tr-TR') + ' ' + timeTR(s); };
const durTR = (a, b) => {
  const ms = new Date(b) - new Date(a);
  if (!(ms > 0)) return '';
  const m = Math.round(ms / 60000);
  if (m < 60) return m + ' dk';
  const h = Math.floor(m / 60), rm = m % 60;
  if (h < 24) return h + ' sa' + (rm ? ' ' + rm + ' dk' : '');
  const d = Math.floor(h / 24);
  return d + ' gün ' + (h % 24) + ' sa';
};
/* izlenebilirlik: son 48 sa göreli, sonrası kısa mutlak */
const relTime = (s) => {
  const x = new Date(s);
  if (isNaN(x)) return '—';
  const ms = Date.now() - x.getTime();
  if (ms >= 0 && ms < 48 * 3600000) return timeAgo(x.getTime());
  return dateTimeTR(x);
};
const timeAgo = (ts) => {
  if (!ts) return '—';
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 10) return 'şimdi';
  if (s < 60) return s + ' sn önce';
  if (s < 3600) return Math.floor(s / 60) + ' dk önce';
  if (s < 86400) return Math.floor(s / 3600) + ' sa önce';
  return Math.floor(s / 86400) + ' gün önce';
};
const m2Each = (o) => (parseFloat(String(o.width).replace(',', '.')) || 0) / 1000 * (parseFloat(String(o.height).replace(',', '.')) || 0) / 1000;

/* ---------- İkonlar ---------- */
const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 4.9-9 4.9-9-4.9L12 2z"/><path d="m3 11.9 9 4.9 9-4.9"/><path d="m3 16.9 9 4.9 9-4.9"/></svg>',
  factory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M7 18h1M12 18h1M17 18h1"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  wifiOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 14 0M2 8.8a15 15 0 0 1 20 0"/><path d="m2 2 20 20"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  trendUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 7 13.5 15.5l-4-4L2 19"/><path d="M16 7h6v6"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8z"/></svg>',
  go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v5l-4 2v-7L3 5z"/></svg>',
  mold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>'
};

/* ---------- Yapılandırma & Durum ---------- */
const LS_KEY = 'utm_cfg_v1';
const DEFAULT_CFG = { server: 'http://192.168.1.200:3001', live: true, pollSec: 20, demo: false, pdfTpl: '', manual: false };
let cfg = (() => { try { return { ...DEFAULT_CFG, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') }; } catch { return { ...DEFAULT_CFG }; } })();
const saveCfg = () => localStorage.setItem(LS_KEY, JSON.stringify(cfg));

/* ?server=… bağlantı parametresi: tek dokunuşla sunucu adresi ayarlar */
(() => {
  try {
    const q = new URLSearchParams(location.search);
    const sv = (q.get('server') || '').trim().replace(/\/+$/, '');
    if (/^https?:\/\/.+/.test(sv)) { cfg.server = sv; cfg.demo = false; saveCfg(); }
    else if (q.get('demo') === '1') { cfg.demo = true; saveCfg(); }
  } catch { /* yoksay */ }
})();

const S = {
  orders: [], byId: new Map(), processes: [],
  A: null,                // agrega önbelleği
  ws: null, wsOk: false, wsAttempts: 0, wsDead: false,
  pollTimer: null, demoTimer: null,
  lastSync: 0, clients: 0, loading: false, bootFailed: false,
  installEvt: null, hiddenUpdate: false,
  tunnelURL: null, tunnelBusy: false, lastTunnelTry: 0,
  prevSnap: null, lastNotif: 0, showAllToday: false
};

/* Liste ekranı durumu (yeniden çizimde korunur) */
const FL_KEY = 'utm_filters_v1';
const L = Object.assign(
  { q: '', status: 'Aktif', shown: 25, proc: 0, customer: '', days: 0, sort: 'new' },
  (() => { try { return JSON.parse(localStorage.getItem(FL_KEY) || '{}'); } catch { return {}; } })()
);
const saveFilters = () => localStorage.setItem(FL_KEY, JSON.stringify({ status: L.status, proc: L.proc, customer: L.customer, days: L.days, sort: L.sort }));

/* ---------- Veri Katmanı ---------- */
function effectiveServer() { return S.tunnelURL || cfg.server; }
function apiURL(path) { return effectiveServer().replace(/\/+$/, '') + path; }

async function api(path, timeoutMs = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(apiURL(path), {
      signal: ctl.signal,
      headers: { 'ngrok-skip-browser-warning': 'utm' }  // ngrok ücretsiz tünel için (başka sunucularda etkisiz)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

/* Teknik resim PDF'i: Ayarlar'daki adres şablonundan üretilir ({kod} → ürün/kalıp kodu).
   İlk kullanımda şablon doğrulanır, sonuç önbelleğe alınır. */
const pdfProbe = new Map(); // url -> true/false
function techPdfURL(o) {
  const tpl = (cfg.pdfTpl || '').trim();
  if (!tpl || !tpl.includes('{kod}')) return null;
  const code = String((o.moldCodes && o.moldCodes.single && o.moldCodes.single.code) || o.productCode || '').trim();
  if (!code) return null;
  try { return new URL(tpl.replace('{kod}', encodeURIComponent(code))).href; } catch { return null; }
}
async function techPdfExists(o) {
  const url = techPdfURL(o);
  if (!url) return null;
  if (pdfProbe.has(url)) return pdfProbe.get(url) ? url : null;
  let ok = false;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(url, { signal: ctl.signal, headers: { 'ngrok-skip-browser-warning': 'utm' } });
    clearTimeout(t);
    if (r.ok) {
      const ct = r.headers.get('content-type') || '';
      if (ct.includes('pdf')) ok = true;
      else if (ct.includes('html')) ok = false; // SPA fallback tuzağı
      else {
        const buf = await r.clone().slice(0, 5).arrayBuffer();
        ok = new TextDecoder().decode(buf).includes('%PDF');
      }
    }
  } catch { ok = false; }
  pdfProbe.set(url, ok);
  return ok ? url : null;
}

/* Kalıphane bilgisi (ürün kodu → raf/açıklama), önbellekli */
const moldCache = new Map();
async function moldInfo(code) {
  const c = String(code || '').trim();
  if (!c) return null;
  if (moldCache.has(c)) return moldCache.get(c);
  try {
    const r = await api('/api/mold-location/' + encodeURIComponent(c), 6000);
    const info = r && r.success ? r : null;
    moldCache.set(c, info);
    return info;
  } catch { moldCache.set(c, null); return null; }
}

function isMixedContent() {
  return location.protocol === 'https:' && cfg.server.startsWith('http://');
}

function wsURL() {
  try {
    const u = new URL(effectiveServer());
    return (u.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + u.host;
  } catch { return null; }
}

/* Tünel keşfi: repo'daki tunnel.json geçerli tünel adresini taşır.
   Manuel sunucu seçilmedikçe, LAN adresi başarısızsa otomatik denenir. */
async function tryTunnel() {
  if (cfg.manual || cfg.demo || S.tunnelBusy) return false;
  if (Date.now() - S.lastTunnelTry < 30000) return false;
  S.lastTunnelTry = Date.now(); S.tunnelBusy = true;
  try {
    const r = await fetch('./tunnel.json?v=' + Date.now(), { cache: 'no-store' });
    const j = await r.json();
    const u = String((j && j.url) || '').replace(/\/+$/, '');
    if (!/^https:\/\/.+/.test(u)) return false;
    if (u === effectiveServer()) { if (!S.wsOk && !S.loading) { refreshREST(true); } return false; }
    S.tunnelURL = u;
    S.wsDead = false; S.wsAttempts = 0; S.bootFailed = false;
    stopPolling();
    connectWS();
    refreshREST(true);
    render(route());
    return true;
  } catch { return false; }
  finally { S.tunnelBusy = false; }
}

function connectWS() {
  if (!cfg.live || S.wsDead || cfg.demo) return;
  const url = wsURL();
  if (!url) return;
  try { S.ws && S.ws.close(); } catch { /* yoksay */ }
  let settled = false;
  let ws;
  try { ws = new WebSocket(url); } catch { wsDown(); return; }
  S.ws = ws;

  const openTimer = setTimeout(() => { if (!settled) { try { ws.close(); } catch {} } }, 6000);

  ws.onopen = () => {
    settled = true; clearTimeout(openTimer);
    S.wsOk = true; S.wsAttempts = 0;
    stopPolling();
    try { ws.send(JSON.stringify({ type: 'GET_DATA' })); } catch { /* yoksay */ }
    paintStatus();
  };
  ws.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.type === 'INITIAL_DATA' || m.type === 'DATA_UPDATE') {
      const arr = m.data && m.data.workOrders;
      if (Array.isArray(arr)) setOrders(arr, m.type === 'DATA_UPDATE');
    } else if (m.type === 'CLIENT_COUNT_UPDATE') {
      S.clients = (m.data && m.data.connectedClients) || 0; paintStatus();
    } else if (m.type === 'NOTIFICATION') {
      const msg = (m.data && (m.data.message || m.data.title)) || 'Güncelleme var';
      toast(msg);
    }
  };
  ws.onclose = () => { clearTimeout(openTimer); if (S.ws === ws) wsDown(); };
  ws.onerror = () => { /* onclose takip eder */ };
}

function wsDown() {
  S.wsOk = false;
  paintStatus();
  if (cfg.live && !S.wsDead && !cfg.demo) {
    S.wsAttempts++;
    if (S.wsAttempts <= 6) {
      setTimeout(connectWS, Math.min(1000 * S.wsAttempts, 8000));
    } else {
      S.wsDead = true;
      startPolling();
    }
  }
}

function startPolling() {
  if (S.pollTimer || cfg.demo) return;
  S.pollTimer = setInterval(() => refreshREST(true), Math.max(5, cfg.pollSec) * 1000);
  refreshREST(true);
}
function stopPolling() { if (S.pollTimer) { clearInterval(S.pollTimer); S.pollTimer = null; } }

async function refreshREST(silent) {
  if (cfg.demo) return;
  if (!silent) S.loading = true, paintStatus();
  try {
    const [wo, pr] = await Promise.all([
      api('/api/work-orders?limit=999999&page=1'),
      S.processes.length ? Promise.resolve(null) : api('/api/processes').catch(() => null)
    ]);
    if (pr && Array.isArray(pr)) S.processes = pr;
    if (wo && Array.isArray(wo.data)) { setOrders(wo.data, false); S.bootFailed = false; }
  } catch (e) {
    if (!S.orders.length) S.bootFailed = true;
    if (!silent) toast('Sunucuya ulaşılamadı');
    // LAN/manuel adres başarısız → tünel keşfini dene (otomatik kip)
    if (!cfg.manual) setTimeout(() => { tryTunnel(); }, 1500);
  } finally {
    S.loading = false; paintStatus(); renderIfStale();
  }
}

function setOrders(arr, live) {
  if (live && S.prevSnap) diffAndNotify(arr);
  S.orders = arr;
  S.byId = new Map(arr.map((o) => [o.id, o]));
  S.prevSnap = buildSnap(arr);
  S.A = null; // agrega temizle, görünümde yeniden hesaplanır
  S.lastSync = Date.now();
  S.bootFailed = false;
  renderIfStale(live);
}

/* ---------- Anlık değişiklik algılama + bildirim ---------- */
function buildSnap(arr) {
  const m = new Map();
  for (const o of arr) {
    const pr = new Map();
    for (const p of o.processes || []) pr.set(p.id, trLower(p.status || 'beklemede'));
    m.set(o.id, { st: trLower(o.status), pr });
  }
  return m;
}

function diffAndNotify(arr) {
  const events = [];
  for (const o of arr) {
    const prev = S.prevSnap.get(o.id);
    const st = trLower(o.status);
    if (!prev) {
      if (dayKey(o.createdAt) === todayKey()) events.push({ kind: 'new-order', o, title: 'Yeni İş Emri', sub: '#' + o.workOrderNumber + ' · ' + (o.customerName || '').trim() });
      continue;
    }
    if (!prev.st.startsWith('tamamland') && st.startsWith('tamamland')) {
      events.push({ kind: 'order-done', o, title: 'İş Emri Tamamlandı', sub: '#' + o.workOrderNumber + ' · ' + (o.productName || '').trim().slice(0, 34) });
    }
    for (const p of o.processes || []) {
      const ps = trLower(p.status || 'beklemede');
      const pp = prev.pr.get(p.id);
      if (pp === ps) continue;
      if (!pp || !pp.startsWith('tamamland')) {
        if (ps.startsWith('tamamland')) events.push({ kind: 'proc-done', o, title: p.name + ' Tamamlandı', sub: '#' + o.workOrderNumber + ' · ' + (o.customerName || '').trim() });
        else if (ps.includes('devam')) events.push({ kind: 'proc-start', o, title: p.name + ' Başladı', sub: '#' + o.workOrderNumber + ' · ' + (o.customerName || '').trim() });
      }
    }
  }
  if (events.length) notifyEvents(events.slice(0, 12));
}

const NOTIF_STYLE = {
  'new-order': { ico: () => I.plus, cls: 'info' },
  'order-done': { ico: () => I.flag, cls: 'ok' },
  'proc-done': { ico: () => I.check, cls: 'ok' },
  'proc-start': { ico: () => I.play, cls: 'warn' }
};

function notifyEvents(events) {
  // çok olay varsa tek özet bildirimi
  if (events.length > 3) {
    const c = { 'new-order': 0, 'order-done': 0, 'proc-done': 0, 'proc-start': 0 };
    events.forEach((e) => c[e.kind]++);
    const parts = [];
    if (c['new-order']) parts.push(c['new-order'] + ' yeni iş emri');
    if (c['order-done']) parts.push(c['order-done'] + ' tamamlanan emir');
    if (c['proc-done']) parts.push(c['proc-done'] + ' biten proses');
    if (c['proc-start']) parts.push(c['proc-start'] + ' başlayan proses');
    banner({ kind: 'new-order', title: 'Canlı Güncelleme', sub: parts.join(' · ') });
    if (document.hidden && Notification.permission === 'granted') {
      try { new Notification('Ekol Glass · Canlı Güncelleme', { body: parts.join(' · '), icon: './icons/icon-192.png', tag: 'utm-live' }); } catch { /* yoksay */ }
    }
    return;
  }
  for (const e of events) {
    banner(e);
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Ekol Glass · ' + e.title, { body: e.sub || '', icon: './icons/icon-192.png', tag: 'utm-' + e.kind });
      } catch { /* yoksay */ }
    }
  }
}

function banner(e) {
  const now = Date.now();
  if (now - S.lastNotif < 900) setTimeout(() => banner(e), 900 - (now - S.lastNotif));
  S.lastNotif = Date.now();
  const host = document.body.querySelector('#notif-host') || (() => {
    const d = document.createElement('div');
    d.id = 'notif-host';
    document.body.appendChild(d);
    return d;
  })();
  const style = NOTIF_STYLE[e.kind] || NOTIF_STYLE['new-order'];
  const d = document.createElement('div');
  d.className = 'notif ' + style.cls;
  d.innerHTML = '<span class="n-ico">' + style.ico() + '</span>' +
    '<span class="n-body"><b>' + esc(e.title) + '</b>' + (e.sub ? '<small>' + esc(e.sub) + '</small>' : '') + '</span>' +
    '<span class="n-x">✕</span><i class="n-bar"></i>';
  if (e.o && e.o.id) { d.dataset.go = '#/emir/' + e.o.id; d.classList.add('tap'); }
  host.appendChild(d);
  while (host.children.length > 3) host.firstChild.remove();
  const kill = () => { d.classList.add('out'); setTimeout(() => d.remove(), 320); };
  d.querySelector('.n-x').onclick = (ev) => { ev.stopPropagation(); kill(); };
  if (d.classList.contains('tap')) d.onclick = () => { kill(); go('#/emir/' + e.o.id); };
  setTimeout(kill, 4200);
}

function aggregates() {
  if (S.A) return S.A;
  const t = todayKey();
  const tk = new Date(); tk.setHours(0, 0, 0, 0);
  let openedToday = 0, openedTodayQty = 0, activeCount = 0, activeM2 = 0, activeQty = 0;
  let completedCount = 0, cancelledCount = 0, overdue = 0;
  let procDoneToday = 0, outQtyToday = 0, outM2Today = 0, scrapQtyToday = 0, scrapM2Today = 0;
  let closedToday = 0, procStartedToday = 0;
  const perProc = new Map();
  const days = new Map();
  const dueList = [];
  const todayEvents = [];   // BUGÜNKÜ İŞLER akışı

  for (const o of S.orders) {
    const q = qtyOf(o.customerQuantity);
    const m2e = m2Each(o);
    const ck = dayKey(o.createdAt);
    if (ck === t) {
      openedToday++; openedTodayQty += q;
      todayEvents.push({ ts: new Date(o.createdAt).getTime() || 0, kind: 'order-open', o, label: 'İş emri açıldı', sub: (o.customerName || '').trim() + ' · ' + num(q) + ' adet' });
    }

    const st = trLower(o.status);
    if (st === 'aktif') {
      activeCount++; activeQty += q; activeM2 += m2e * q;
      const dd = o.dueDate ? new Date(o.dueDate) : null;
      if (dd && !isNaN(dd)) {
        const diff = Math.ceil((dd - tk) / 86400000);
        if (diff < 0) overdue++;
        else if (diff <= 3) dueList.push({ o, diff });
      }
    } else if (st.startsWith('tamamland')) completedCount++;
    else if (st.startsWith('iptal')) cancelledCount++;

    let lastEnd = 0;
    for (const p of o.processes || []) {
      const ps = trLower(p.status || 'beklemede');
      let pp = perProc.get(p.id);
      if (!pp) { pp = { pending: 0, running: 0, doneToday: 0, qtyToday: 0, m2Today: 0, scrapQtyToday: 0, lastDate: '' }; perProc.set(p.id, pp); }
      if (st === 'aktif') {
        if (ps === 'beklemede') pp.pending++;
        else if (ps.includes('devam')) pp.running++;
      }
      const pq = qtyOf(p.producedQuantity), sq = qtyOf(p.scrapQuantity);
      const pStart = p.startDate ? new Date(p.startDate).getTime() : 0;
      const pEnd = p.endDate ? new Date(p.endDate).getTime() : 0;
      if (pEnd > lastEnd) lastEnd = pEnd;
      if (pStart && dayKey(p.startDate) === t && ps !== 'beklemede') {
        procStartedToday++;
        todayEvents.push({ ts: pStart, kind: 'proc-start', o, label: p.name + ' başladı', sub: (o.customerName || '').trim() + ' · ' + num(qtyOf(p.producedQuantity) || q) + ' adet' });
      }
      if (ps.startsWith('tamamland') && p.endDate) {
        const dk = dayKey(p.endDate);
        if (!pp.lastDate || p.endDate > pp.lastDate) pp.lastDate = p.endDate;
        const d = days.get(dk) || { qty: 0, m2: 0, scrap: 0 };
        d.qty += pq; d.m2 += m2e * pq; d.scrap += sq; days.set(dk, d);
        if (dk === t) {
          procDoneToday++; outQtyToday += pq; outM2Today += m2e * pq;
          scrapQtyToday += sq; scrapM2Today += m2e * sq;
          pp.doneToday++; pp.qtyToday += pq; pp.m2Today += m2e * pq; pp.scrapQtyToday += sq;
          todayEvents.push({ ts: pEnd, kind: 'proc-done', o, label: p.name + ' tamamlandı', sub: (o.customerName || '').trim() + ' · ' + num(pq) + ' adet üretim' });
        }
      }
    }
    // bugün kapanan iş emri: son proses bugün bittiyse veya bugün Tamamlandı durumuna geçtiyse
    if (st.startsWith('tamamland') && (dayKey(lastEnd || 0) === t || dayKey(o.updatedAt) === t)) {
      closedToday++;
      todayEvents.push({ ts: lastEnd || new Date(o.updatedAt).getTime() || 0, kind: 'order-done', o, label: 'İş emri tamamlandı', sub: (o.productName || '').trim().slice(0, 40) });
    }
  }
  todayEvents.sort((a, b) => b.ts - a.ts);

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(tk.getTime() - i * 86400000);
    const k = dayKey(d);
    const v = days.get(k) || { qty: 0, m2: 0 };
    last7.push({ key: k, label: d.toLocaleDateString('tr-TR', { weekday: 'short' }), qty: v.qty, m2: v.m2, today: i === 0 });
  }
  dueList.sort((a, b) => a.diff - b.diff);

  const scrapPct = outQtyToday > 0 ? (scrapQtyToday / outQtyToday) * 100 : 0;
  S.A = { t, openedToday, openedTodayQty, activeCount, activeM2, activeQty, completedCount, cancelledCount, overdue, procDoneToday, outQtyToday, outM2Today, scrapQtyToday, scrapM2Today, scrapPct, closedToday, procStartedToday, todayEvents, perProc, last7, dueList, max7: Math.max(1, ...last7.map((x) => x.qty)) };
  return S.A;
}

function knownProcesses() {
  if (S.processes.length) return S.processes;
  const seen = new Map();
  for (const o of S.orders) for (const p of o.processes || []) if (!seen.has(p.id)) seen.set(p.id, { id: p.id, name: p.name });
  return [...seen.values()];
}

function procDisplayName(pid) {
  const p = S.processes.find((x) => x.id === pid);
  if (p) return p.name;
  const o = S.orders.find((o) => (o.processes || []).some((x) => x.id === pid));
  const q = o && o.processes.find((x) => x.id === pid);
  return q ? q.name : 'Proses ' + pid;
}

/* ---------- Demo kipi ---------- */
function startDemo() {
  stopPolling(); try { S.ws && S.ws.close(); } catch { /* yoksay */ } S.wsOk = false; S.wsDead = true;
  S.processes = window.DEMO_DATA.processes;
  setOrders(JSON.parse(JSON.stringify(window.DEMO_DATA.workOrders)), false);
  S.demoTimer = setInterval(() => {
    // rastgele bir bekleyen prosesi tamamla → canlılık simülasyonu
    const cand = S.orders.filter((o) => trLower(o.status) === 'aktif');
    if (!cand.length) return;
    const o = cand[Math.floor(Math.random() * cand.length)];
    const p = (o.processes || []).find((x) => trLower(x.status || '') === 'devam ediyor') || (o.processes || []).find((x) => trLower(x.status || '') === 'beklemede');
    if (p) {
      p.status = 'Tamamlandı'; p.progress = 100;
      p.producedQuantity = o.customerQuantity; p.endDate = new Date().toISOString();
      setOrders(S.orders, true);
      toast('Demo: ' + o.workOrderNumber + ' · ' + p.name + ' tamamlandı');
    }
  }, 12000);
}
function stopDemo() { if (S.demoTimer) { clearInterval(S.demoTimer); S.demoTimer = null; } }

/* ---------- Yönlendirme ---------- */
const VIEWS = { ozet: true, emirler: true, prosesler: true, ayarlar: true };
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/');
  if (parts[0] === 'emir' && parts[1]) return { name: 'emir', id: parts[1] };
  if (parts[0] === 'proses' && parts[1]) return { name: 'proses', id: parseInt(parts[1]) };
  if (parts[0] === 'detay' && parts[1]) return { name: 'detay', id: parts[1] };
  if (VIEWS[parts[0]]) return { name: parts[0] };
  return { name: 'ozet' };
}
function go(hash) { location.hash = hash; }

/* ---------- Çizim ---------- */
function paintStatus() {
  // üst çubuk canlı göstergesi + senkron satırı
  const pill = $('#live-pill'), sync = $('#syncline');
  if (cfg.demo) {
    if (pill) { pill.className = 'live-pill on'; pill.innerHTML = '<span class="dot"></span>DEMO'; }
    if (sync) sync.innerHTML = '<span>Demo veriler görüntüleniyor</span><span data-ts="' + S.lastSync + '">' + esc(timeAgo(S.lastSync)) + '</span>';
    return;
  }
  const state = S.wsOk ? 'on' : S.wsDead ? 'off' : 'wait';
  const label = S.wsOk ? (S.tunnelURL ? 'CANLI · TÜNEL' : 'CANLI') : S.wsDead ? 'BAĞLANTI YOK' : 'BAĞLANIYOR';
  if (pill) { pill.className = 'live-pill ' + state; pill.innerHTML = '<span class="dot"></span>' + label; }
  if (sync) {
    const extra = S.wsOk && S.clients ? ' · ' + S.clients + ' cihaz bağlı' : '';
    const host = effectiveServer().replace(/^https?:\/\//, '');
    sync.innerHTML =
      '<span>' + esc(timeAgo(S.lastSync)) + ' güncellendi' + extra + '</span>' +
      '<span>' + esc(host) + (S.tunnelURL ? ' (tünel)' : '') + '</span>';
  }
  const btn = $('#refresh-btn');
  if (btn) btn.classList.toggle('spin', S.loading);
}

const DETAY_TITLES = { uretim: 'Bugün Üretim Detayı', acilan: 'Bugün Açılan İş Emirleri', fire: 'Bugün Fire Kayıtları' };

function paintAppbar(r) {
  const detail = r.name === 'emir' || r.name === 'proses' || r.name === 'detay';
  const t1 = r.name === 'emir' ? 'İş Emri Detayı' : r.name === 'proses' ? procDisplayName(r.id) : r.name === 'detay' ? (DETAY_TITLES[r.id] || 'Detay') : 'Üretim Takip';
  const titles = '<div class="titles"><div class="t1">' + esc(t1) + '</div><div class="t2">Ekol Glass</div></div>';
  $('#appbar').innerHTML =
    (detail ? '<button class="iconbtn" id="back-btn" aria-label="Geri">' + I.back + '</button>' : '<img class="brand-mark" src="icons/icon-192.png" alt="">') +
    titles +
    '<span class="live-pill wait" id="live-pill"><span class="dot"></span>…</span>' +
    '<button class="iconbtn" id="refresh-btn" aria-label="Yenile">' + I.refresh + '</button>';
  $('#back-btn') && ($('#back-btn').onclick = () => history.length > 1 ? history.back() : go(r.name === 'emir' ? '/emirler' : r.name === 'detay' ? '/ozet' : '/prosesler'));
  $('#refresh-btn').onclick = () => { if (cfg.demo) { setOrders(S.orders, false); toast('Demo yenilendi'); } else refreshREST(false); };
}

function paintTabbar(r) {
  const tabs = [
    { id: 'ozet', lbl: 'Özet', ico: I.home },
    { id: 'emirler', lbl: 'İş Emirleri', ico: I.layers },
    { id: 'prosesler', lbl: 'Prosesler', ico: I.factory },
    { id: 'ayarlar', lbl: 'Ayarlar', ico: I.gear }
  ];
  const active = r.name === 'emir' ? 'emirler' : r.name === 'proses' ? 'prosesler' : r.name === 'detay' ? 'ozet' : r.name;
  $('#tabbar').innerHTML = tabs.map((t) =>
    '<a class="tab ' + (active === t.id ? 'active' : '') + '" href="#/' + t.id + '" data-tab="' + t.id + '">' + t.ico + '<span>' + t.lbl + '</span></a>'
  ).join('');
}

function skeleton() {
  return '<div class="wrap">' +
    '<div class="kpi-grid">' + '<div class="skel"></div>'.repeat(4) + '</div>' +
    '<div class="skel" style="margin-top:12px;min-height:150px"></div>' +
    '<div class="skel" style="margin-top:12px;min-height:220px"></div></div>';
}

function renderIfStale(live) {
  // odak input'taysa canlı yenilemeyi ertele (yazma deneyimini koru)
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'SELECT')) { S.hiddenUpdate = true; return; }
  const main = $('#view');
  const st = main.scrollTop;
  render(route());
  main.scrollTop = st;
  if (live) flashUpdate();
}
function flashUpdate() { const s = $('#syncline'); if (s) { s.style.opacity = '.45'; setTimeout(() => { s.style.opacity = '1'; }, 120); } }

function render(r) {
  paintAppbar(r); paintTabbar(r); paintStatus();
  const v = $('#view');
  const routeKey = r.name + ':' + (r.id || '');
  if (S.lastRouteKey !== routeKey) {
    S.lastRouteKey = routeKey;
    S.animateNext = true;
    DS.shown = {};
    v.classList.remove('anim'); void v.offsetWidth; v.classList.add('anim');
  }
  let html = '';
  try {
    if (r.name === 'ozet') html = viewOzet();
    else if (r.name === 'emirler') html = viewEmirler();
    else if (r.name === 'emir') html = viewEmirDetay(r.id);
    else if (r.name === 'prosesler') html = viewProsesler();
    else if (r.name === 'proses') html = viewProsesDetay(r.id);
    else if (r.name === 'detay') html = viewDetay(r.id);
    else if (r.name === 'ayarlar') html = viewAyarlar();
  } catch (err) {
    console.error('görünüm:', err);
    window.__utmErrs.push('view(' + r.name + '): ' + err.message);
    html = '<div class="wrap"><div class="banner err">' + I.alert + '<div><b>Görünüm hatası.</b> ' + esc(err.message) + '</div></div></div>';
  }
  v.innerHTML = html;
  try { afterRender(r); } catch (err) { console.error('afterRender:', err); window.__utmErrs.push('afterRender: ' + err.message); }
}

/* ---------- Görünümler ---------- */
function connErrorView() {
  const mixed = isMixedContent();
  return '<div class="wrap"><div class="conn-state">' +
    '<div class="cs-ico">' + I.wifiOff + '</div>' +
    '<h3>Sunucuya bağlanılamadı</h3>' +
    '<p>' + esc(cfg.server) + ' adresine ulaşılamıyor.</p>' +
    (mixed
      ? '<p style="margin-top:10px"><b>Önemli:</b> Bu sayfa HTTPS üzerinden açıldığı için tarayıcı, HTTP sunucusuna erişimi engelliyor. Fabrika Wi-Fi\'ındayken <b>LAN sürümünü</b> (http://...) kullanın veya Ayarlar → bağlantı rehberine bakın.</p>'
      : '<p style="margin-top:6px">Telefonun aynı ağda (Wi-Fi) olduğunu ve sunucunun açık olduğunu kontrol edin.</p>') +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:10px">' +
    '<button class="btn primary" id="retry-btn">Tekrar Dene</button>' +
    '<button class="btn ghost" id="demo-btn2">Demo Verilerle İncele</button>' +
    '</div></div>';
}

function todaySection(A) {
  const evIcon = { 'order-open': I.plus, 'order-done': I.flag, 'proc-start': I.play, 'proc-done': I.check };
  const evCls = { 'order-open': 'info', 'order-done': 'ok', 'proc-start': 'warn', 'proc-done': 'ok' };
  const shown = S.showAllToday ? A.todayEvents : A.todayEvents.slice(0, 8);
  const rows = shown.map((e) => {
    const hh = e.ts ? timeTR(e.ts) : '';
    return '<div class="lrow" data-go="#/emir/' + esc(e.o.id) + '">' +
      '<div class="li-ico" style="background:var(--' + (evCls[e.kind] === 'ok' ? 'ok' : evCls[e.kind] === 'warn' ? 'warn' : 'info') + '-soft);color:var(--' + (evCls[e.kind] === 'ok' ? 'ok' : evCls[e.kind] === 'warn' ? 'warn' : 'info') + ')">' + evIcon[e.kind] + '</div>' +
      '<div class="li-main"><div class="li-t">#' + esc(e.o.workOrderNumber) + ' · ' + esc(e.label) + '</div>' +
      '<div class="li-s">' + esc(e.sub || '') + '</div></div>' +
      '<div class="li-end">' + esc(hh) + '</div></div>';
  }).join('');
  return '<div class="sec-title">Bugünkü İşler <span style="color:var(--muted);text-transform:none;letter-spacing:0;font-weight:600">' + dateFullTR(Date.now()) + '</span></div>' +
    '<div class="card" style="padding:14px 14px 6px">' +
    '<div class="today-tiles">' +
    '<div class="ttile"><span class="tt-ico info">' + I.plus + '</span><b>' + num(A.openedToday) + '</b><span>Açılan Emir</span></div>' +
    '<div class="ttile"><span class="tt-ico ok">' + I.flag + '</span><b>' + num(A.closedToday) + '</b><span>Kapanan Emir</span></div>' +
    '<div class="ttile"><span class="tt-ico warn">' + I.play + '</span><b>' + num(A.procStartedToday) + '</b><span>Başlayan Proses</span></div>' +
    '<div class="ttile"><span class="tt-ico ok2">' + I.check + '</span><b>' + num(A.procDoneToday) + '</b><span>Biten Proses</span></div>' +
    '</div>' +
    '<div style="margin:6px -14px 0">' +
    (rows || '<div class="empty" style="padding:20px"><div class="e-t">Bugün için kayıt yok</div></div>') +
    '</div>' +
    (A.todayEvents.length > 8 ? '<button class="loadmore" id="today-toggle">' + (S.showAllToday ? 'Daha az göster' : 'Tümünü göster (' + num(A.todayEvents.length) + ')') + '</button>' : '') +
    '</div>';
}

function viewOzet() {
  if (!S.orders.length) return S.bootFailed ? connErrorView() : skeleton();
  const A = aggregates();
  const dueCards = A.dueList.slice(0, 4).map(({ o, diff }) => {
    const cls = diff < 0 ? 'termin-gec' : 'termin';
    const lbl = diff < 0 ? 'GECİKİYOR' : diff === 0 ? 'BUGÜN' : diff + ' GÜN';
    return '<div class="lrow" data-go="#/emir/' + esc(o.id) + '">' +
      '<div class="li-ico" style="background:var(--warn-soft);color:var(--warn)">' + I.calendar + '</div>' +
      '<div class="li-main"><div class="li-t">#' + esc(o.workOrderNumber) + ' · ' + esc(o.customerName || '').trim() + '</div>' +
      '<div class="li-s">' + esc((o.productName || '').trim()) + '</div></div>' +
      '<div class="li-end"><span class="badge ' + cls + '">' + lbl + '</span><br>' + dateTR(o.dueDate) + '</div></div>';
  }).join('') || '<div class="empty" style="padding:18px"><div class="e-t">Termini yaklaşan iş emri yok</div></div>';

  const bars = A.last7.map((d) =>
    '<div class="bar-wrap"><div class="bar-val">' + num(d.qty) + '</div>' +
    '<div class="bar ' + (d.qty ? (d.today ? 'today' : '') : 'zero') + '" style="height:' + Math.max(3, Math.round((d.qty / A.max7) * 62)) + 'px"></div>' +
    '<div class="bar-lbl">' + (d.today ? 'bugün' : esc(d.label)) + '</div></div>'
  ).join('');

  const topProcs = knownProcesses()
    .filter((p) => { const pp = A.perProc.get(p.id); return pp && (pp.pending + pp.running + pp.doneToday) > 0; })
    .sort((a, b) => ((A.perProc.get(b.id) || {}).pending || 0) - ((A.perProc.get(a.id) || {}).pending || 0));

  const procCards = topProcs.slice(0, 8).map((p) => {
    const pp = A.perProc.get(p.id) || {};
    return '<div class="card tap proc-card" data-go="#/proses/' + p.id + '">' +
      '<div class="p-name"><span class="pno">' + esc(String(p.name).slice(0, 2)) + '</span>' + esc(p.name) + '</div>' +
      '<div class="proc-nums">' +
      '<div class="pnum pend"><b>' + num(pp.pending || 0) + '</b><span>Bekleyen</span></div>' +
      '<div class="pnum run"><b>' + num(pp.running || 0) + '</b><span>Devam</span></div>' +
      '<div class="pnum done"><b>' + num(pp.doneToday || 0) + '</b><span>Bugün</span></div>' +
      '</div></div>';
  }).join('') || '<div class="empty" style="padding:18px"><div class="e-t">Aktif proses kaydı yok</div></div>';

  return '<div class="wrap">' +
    (isMixedContent() ? '<div class="banner warn">' + I.alert + '<div><b>Güvenli bağlantı kısıtı:</b> HTTPS sayfa üzerinden HTTP sunucuya erişilemiyor. Ayarlar → Kurulum bölümünden LAN sürümünü kullanın.</div></div>' : '') +
    '<div class="kpi-grid">' +
    '<div class="kpi brand" data-go="#/detay/uretim" role="link" aria-label="Bugün üretim detayı"><span class="kpi-go">' + I.go + '</span><div class="kpi-ico">' + I.trendUp + '</div><div class="kpi-label">Bugün Üretim</div><div class="kpi-num" data-count="' + A.outQtyToday + '">' + num(A.outQtyToday) + '<small>adet</small></div><div class="kpi-sub">' + m2fmt(A.outM2Today) + ' m² · ' + num(A.procDoneToday) + ' proses</div></div>' +
    '<div class="kpi info" data-go="#/detay/acilan" role="link" aria-label="Bugün açılan iş emirleri"><span class="kpi-go">' + I.go + '</span><div class="kpi-ico">' + I.box + '</div><div class="kpi-label">Bugün Açılan</div><div class="kpi-num" data-count="' + A.openedToday + '">' + num(A.openedToday) + '<small>iş emri</small></div><div class="kpi-sub">' + num(A.openedTodayQty) + ' adet sipariş</div></div>' +
    '<div class="kpi ok" data-go="#/emirler" role="link" aria-label="Aktif iş emirleri"><span class="kpi-go">' + I.go + '</span><div class="kpi-ico">' + I.layers + '</div><div class="kpi-label">Aktif İş Emri</div><div class="kpi-num" data-count="' + A.activeCount + '">' + num(A.activeCount) + '</div><div class="kpi-sub">' + num(A.activeQty) + ' adet · ' + m2fmt(A.activeM2) + ' m²</div></div>' +
    '<div class="kpi ' + (A.scrapQtyToday > 0 ? 'warn' : 'ok') + '" data-go="#/detay/fire" role="link" aria-label="Bugün fire kayıtları"><span class="kpi-go">' + I.go + '</span><div class="kpi-ico">' + I.flame + '</div><div class="kpi-label">Bugün Fire</div><div class="kpi-num" data-count="' + A.scrapQtyToday + '">' + num(A.scrapQtyToday) + '<small>adet</small></div><div class="kpi-sub">' + m2fmt(A.scrapM2Today) + ' m² · %' + nf1.format(A.scrapPct) + '</div></div>' +
    '</div>' +

    todaySection(A) +

    '<div class="sec-title">Son 7 Gün Üretim <span class="lnk" style="color:var(--muted)">adet/gün</span></div>' +
    '<div class="card"><div class="sparkbars">' + bars + '</div></div>' +

    '<div class="sec-title">Termin Yaklaşanlar' + (A.overdue ? ' <span class="badge termin-gec">' + num(A.overdue) + ' geciken</span>' : '') + '</div>' +
    '<div class="card" style="padding:4px 12px">' + dueCards + '</div>' +

    '<div class="sec-title">Proses Durumu <span class="lnk" data-go="#/prosesler">Tümü</span></div>' +
    '<div class="proc-grid">' + procCards + '</div>' +
    '</div>';
}

function woCard(o) {
  const procs = (o.processes || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const done = procs.filter((p) => trLower(p.status || '').startsWith('tamamland')).length;
  const pct = procs.length ? Math.round((done / procs.length) * 100) : 0;
  const next = procs.find((p) => trLower(p.status || '') === 'devam ediyor') || procs.find((p) => trLower(p.status || '') === 'beklemede');
  const st = trLower(o.status);
  const badge = st.startsWith('tamamland') ? '<span class="badge tamamlandi">Tamamlandı</span>' : st.startsWith('iptal') ? '<span class="badge iptal">İptal</span>' : '<span class="badge aktif">Aktif</span>';
  const q = qtyOf(o.customerQuantity);
  const m2 = m2Each(o) * q;
  let dueChip = '';
  if (o.dueDate && st === 'aktif') {
    const dd = new Date(o.dueDate); const tk = new Date(); tk.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dd - tk) / 86400000);
    if (diff < 0) dueChip = '<span class="badge termin-gec">Termin ' + dateTR(o.dueDate) + ' · ' + (-diff) + ' gün gecikti</span>';
    else if (diff <= 3) dueChip = '<span class="badge termin">Termin: ' + dateTR(o.dueDate) + (diff === 0 ? ' · BUGÜN' : ' · ' + diff + ' gün') + '</span>';
  }
  const dots = procs.slice(0, 7).map((p) => {
    const ps = trLower(p.status || 'beklemede');
    const cls = ps.startsWith('tamamland') ? 'done' : ps.includes('devam') ? 'run' : 'pend';
    return '<span class="pd ' + cls + '"><i></i>' + esc(String(p.name).split(' ')[0].slice(0, 9)) + '</span>';
  }).join('') + (procs.length > 7 ? '<span class="pd pend" style="background:none">+' + (procs.length - 7) + '</span>' : '');

  return '<div class="card tap wo-card" data-go="#/emir/' + esc(o.id) + '">' +
    '<div class="wo-top"><span class="wo-no">#' + esc(o.workOrderNumber) + '</span>' + badge + '</div>' +
    '<div class="wo-name">' + esc((o.productName || 'Ürün belirtilmemiş').trim()) + '</div>' +
    '<div class="wo-meta"><span><b>' + num(q) + ' adet</b></span><span>' + m2fmt(m2) + ' m²</span><span>' + esc(String(o.width || '').trim()) + '×' + esc(String(o.height || '').trim()) + ' mm</span><span>' + esc((o.thickness || '').trim()) + '</span><span>' + esc((o.color || '').trim()) + '</span></div>' +
    '<div class="wo-meta" style="margin-top:3px"><span>' + esc((o.customerName || '').trim()) + '</span>' + (dueChip ? '<span>' + dueChip + '</span>' : '') + '</div>' +
    '<div class="wo-meta" style="margin-top:5px;font-size:11.5px;color:var(--muted)"><span>Açılış: ' + esc(dateTimeTR(o.createdAt)) + '</span><span>Son hareket: ' + esc(relTime(o.updatedAt)) + '</span></div>' +
    '<div class="proc-dots">' + dots + '</div>' +
    '<div class="wo-foot"><div class="progress"><i style="width:' + pct + '%"></i></div><span class="wo-proc">' + done + '/' + procs.length + '</span></div>' +
    (next && st === 'aktif' ? '<div class="next-proc">Sıradaki: <b>' + esc(next.name) + '</b>' + (trLower(next.status || '').includes('devam') ? ' · <span class="badge devam">devam ediyor</span>' : '') + '</div>' : '') +
    '</div>';
}

function viewEmirler() {
  if (!S.orders.length) return S.bootFailed ? connErrorView() : skeleton();
  const chips = [['Aktif', 'Aktif'], ['Tamamlandı', 'Tamamlandı'], ['İptal', 'İptal'], ['', 'Tümü']].map(([v, l]) =>
    '<div class="chip ' + (L.status === v ? 'active' : '') + '" data-status="' + v + '">' + l + '</div>'
  ).join('');
  const n = activeFilterCount();
  return '<div class="wrap" style="padding-bottom:4px">' +
    '<div class="filter-row">' +
    '<div class="searchbar">' + I.search + '<input id="wo-search" type="search" placeholder="İş emri no, ürün, müşteri ara…" value="' + esc(L.q) + '" autocomplete="off"></div>' +
    '<button class="filterbtn ' + (n ? 'has' : '') + '" id="filter-btn">' + I.filter + (n ? '<span class="cnt">' + n + '</span>' : '') + '</button>' +
    '</div>' +
    '<div class="chips">' + chips + '</div>' +
    '</div><div class="wrap" id="wo-list"></div>';
}

/* Filtre alt paneli */
function openFilterSheet() {
  const host = $('#sheet-host');
  const procs = knownProcesses();
  const custs = topCustomers();
  const sortLbls = { new: 'Yeni→Eski', old: 'Eski→Yeni', due: 'Termin', qty: 'Adet', m2: 'm²' };
  host.innerHTML =
    '<div class="sheet-backdrop" id="sh-backdrop"></div>' +
    '<div class="sheet" id="sh-sheet">' +
    '<div class="sheet-grab"></div>' +
    '<div class="sheet-head"><h3>Filtreler</h3><button class="sheet-close" id="sh-close">✕</button></div>' +

    '<div class="sec-title">Proses <span style="color:var(--muted);text-transform:none;letter-spacing:0">(seçilen proseste bekleyen/devam)</span></div>' +
    '<div class="chip-wrap">' + '<div class="chip ' + (!L.proc ? 'active' : '') + '" data-f="proc" data-v="0">Tümü</div>' +
    procs.map((p) => '<div class="chip ' + (L.proc === p.id ? 'active' : '') + '" data-f="proc" data-v="' + p.id + '">' + esc(p.name) + '</div>').join('') + '</div>' +

    '<div class="sec-title">Müşteri</div>' +
    '<div class="mini-search">' + I.search + '<input id="cust-search" type="search" placeholder="Müşteri ara…" autocomplete="off"></div>' +
    '<div class="chip-wrap" id="cust-list">' + '<div class="chip ' + (!L.customer ? 'active' : '') + '" data-f="customer" data-v="">Tümü</div>' +
    custs.map((c) => '<div class="chip ' + (L.customer === c ? 'active' : '') + '" data-f="customer" data-v="' + esc(c) + '">' + esc(c) + '</div>').join('') + '</div>' +

    '<div class="sec-title">Tarih (oluşturma)</div>' +
    '<div class="seg" id="day-seg">' +
    [[0, 'Tümü'], [1, 'Bugün'], [7, '7 Gün'], [30, '30 Gün']].map(([v, l]) => '<button data-f="days" data-v="' + v + '" class="' + (L.days === v ? 'active' : '') + '">' + l + '</button>').join('') +
    '</div>' +

    '<div class="sec-title">Sıralama</div>' +
    '<div class="seg">' +
    Object.entries(sortLbls).map(([v, l]) => '<button data-f="sort" data-v="' + v + '" class="' + (L.sort === v ? 'active' : '') + '">' + l + '</button>').join('') +
    '</div>' +

    '<div style="margin-top:18px"><button class="btn ghost" id="sh-reset">Tüm Filtreleri Temizle</button></div>' +
    '</div>';

  setTimeout(() => { const bd = $('#sh-backdrop'), sh = $('#sh-sheet'); if (bd) bd.classList.add('open'); if (sh) sh.classList.add('open'); }, 30);

  const close = () => {
    const bd = $('#sh-backdrop'), sh = $('#sh-sheet');
    if (!bd) return;
    bd.classList.remove('open'); sh.classList.remove('open');
    setTimeout(() => { host.innerHTML = ''; }, 280);
  };
  $('#sh-close').onclick = close;
  $('#sh-backdrop').onclick = close;

  host.onclick = (e) => {
    const el = e.target.closest('[data-f]');
    if (!el) return;
    const f = el.getAttribute('data-f');
    let v = el.getAttribute('data-v');
    if (f === 'proc') v = parseInt(v);
    if (f === 'days') v = parseInt(v);
    L[f] = v; saveFilters();
    // aynı gruptaki çiplerin aktifliğini güncelle
    $$('[data-f="' + f + '"]').forEach((x) => x.classList.toggle('active', x === el || (f === 'days' || f === 'sort' ? x.getAttribute('data-v') === String(v) : x === el)));
    const rb = $('#refresh-btn'); if (rb) rb.classList.add('spin');
    paintWoList(); renderIfStale(false);
    const rb2 = $('#refresh-btn'); if (rb2) rb2.classList.remove('spin');
    if (f === 'proc' || f === 'customer') setTimeout(close, 220);
  };
  const cs = $('#cust-search');
  cs.oninput = () => {
    const q = trLower(cs.value.trim());
    $$('[data-f="customer"]').forEach((c) => {
      if (!c.getAttribute('data-v')) return; // "Tümü" hep açık
      c.style.display = !q || trLower(c.getAttribute('data-v')).includes(q) ? '' : 'none';
    });
  };
  $('#sh-reset').onclick = () => {
    L.proc = 0; L.customer = ''; L.days = 0; L.sort = 'new'; saveFilters();
    close(); L.shown = 25; render(route());
  };
}

function activeFilterCount() {
  let n = 0;
  if (L.proc) n++;
  if (L.customer) n++;
  if (L.days) n++;
  if (L.sort !== 'new') n++;
  return n;
}

function filteredOrders() {
  const q = trLower(L.q.trim());
  let arr = S.orders;
  if (L.status) arr = arr.filter((o) => trLower(o.status).startsWith(trLower(L.status).slice(0, 5)));
  if (q) arr = arr.filter((o) =>
    trLower(o.workOrderNumber).includes(q) || trLower(o.productName).includes(q) ||
    trLower(o.customerName).includes(q) || trLower(o.productCode).includes(q) ||
    trLower(o.productCode).replace(/\s/g, '').includes(q.replace(/\s/g, ''))
  );
  // proses filtresi: sunucu (GET /api/work-orders?process=ID) ile aynı semantik —
  // o prosesi BEKLEYEN veya DEVAM EDEN iş emirleri (emir durumu ne olursa olsun)
  if (L.proc) arr = arr.filter((o) => (o.processes || []).some((p) => p.id === L.proc && (trLower(p.status || 'beklemede') === 'beklemede' || trLower(p.status || '').includes('devam'))));
  if (L.customer) arr = arr.filter((o) => trLower(String(o.customerName || '').trim()) === trLower(L.customer));
  if (L.days) {
    const cut = dayKey(new Date(Date.now() - (L.days - 1) * 86400000));
    arr = arr.filter((o) => String(o.orderDate || '') >= cut);
  }
  const qy = (o) => qtyOf(o.customerQuantity);
  const mm = (o) => m2Each(o) * qtyOf(o.customerQuantity);
  const cmp = {
    new: (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    old: (a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')),
    due: (a, b) => (a.dueDate ? String(a.dueDate) : '9999').localeCompare(b.dueDate ? String(b.dueDate) : '9999'),
    qty: (a, b) => qy(b) - qy(a),
    m2: (a, b) => mm(b) - mm(a)
  }[L.sort] || null;
  if (cmp) arr = arr.slice().sort(cmp);
  return arr;
}

function topCustomers(limit = 14) {
  const m = new Map();
  for (const o of S.orders) {
    const c = String(o.customerName || '').trim();
    if (c) m.set(c, (m.get(c) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([c]) => c);
}

function activeFilterChips() {
  const out = [];
  if (L.proc) out.push({ k: 'proc', l: procDisplayName(L.proc) });
  if (L.customer) out.push({ k: 'customer', l: L.customer });
  if (L.days) out.push({ k: 'days', l: L.days === 1 ? 'Bugün' : L.days + ' Gün' });
  const sortLbls = { new: 'Yeni→Eski', old: 'Eski→Yeni', due: 'Termin', qty: 'Adet', m2: 'm²' };
  if (L.sort && L.sort !== 'new') out.push({ k: 'sort', l: 'Sıra: ' + (sortLbls[L.sort] || L.sort) });
  if (L.q.trim()) out.push({ k: 'q', l: '“' + L.q.trim().slice(0, 18) + '”' });
  return out;
}

function paintWoList() {
  const host = $('#wo-list'); if (!host) return;
  const arr = filteredOrders();
  const slice = arr.slice(0, L.shown);
  const af = activeFilterChips();
  host.innerHTML =
    '<div class="sec-title" style="margin-top:2px">' + num(arr.length) + ' iş emri</div>' +
    (af.length ? '<div class="afchips">' + af.map((f) =>
      '<span class="afchip" data-rm="' + f.k + '">' + esc(f.l) + ' <b>✕</b></span>').join('') + '</div>' : '') +
    (slice.map(woCard).join('') || '<div class="empty"><div class="e-t">Sonuç bulunamadı</div><div style="font-size:12.5px;margin-top:4px">Farklı bir arama veya filtre deneyin</div></div>') +
    (arr.length > L.shown ? '<button class="loadmore" id="more-btn">Daha fazla göster (' + num(arr.length - L.shown) + ')</button>' : '');
  const more = $('#more-btn'); if (more) more.onclick = () => { L.shown += 25; paintWoList(); };
  $$('.afchip', host).forEach((c) => c.onclick = () => {
    const k = c.getAttribute('data-rm');
    if (k === 'q') { L.q = ''; const si = $('#wo-search'); if (si) si.value = ''; }
    else if (k === 'sort') L.sort = 'new';
    else L[k] = k === 'proc' ? 0 : k === 'days' ? 0 : '';
    saveFilters(); L.shown = 25; renderIfStale(false);
  });
}

/* Ölçü özet kartı + teknik resim PDF görüntüleyici */
function viewEmirDetay(id) {
  const o = S.byId.get(id);
  if (!o) return '<div class="wrap"><div class="empty"><div class="e-t">İş emri bulunamadı</div></div><div class="btn ghost" data-go="#/emirler" style="text-align:center">Listeye dön</div></div>';
  const procs = (o.processes || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const st = trLower(o.status);
  const reopened = String(o.isReopenedFromShortfall) === 'true';
  const badge = st.startsWith('tamamland') ? '<span class="badge tamamlandi">Tamamlandı</span>' : st.startsWith('iptal') ? '<span class="badge iptal">İptal</span>' : '<span class="badge aktif">Aktif</span>';
  const q = qtyOf(o.customerQuantity);
  const W = parseFloat(String(o.width).replace(',', '.')) || 0;
  const H = parseFloat(String(o.height).replace(',', '.')) || 0;

  const steps = procs.map((p) => {
    const ps = trLower(p.status || 'beklemede');
    const cls = ps.startsWith('tamamland') ? 'done' : ps.includes('devam') ? 'run' : '';
    const b = ps.startsWith('tamamland') ? '<span class="badge tamamlandi">Tamamlandı</span>' : ps.includes('devam') ? '<span class="badge devam">Devam ediyor</span>' : '<span class="badge beklemede">Beklemede</span>';
    const pq = qtyOf(p.producedQuantity), sq = qtyOf(p.scrapQuantity);
    const sure = p.startDate && p.endDate ? durTR(p.startDate, p.endDate) : '';
    const devamEdiyor = ps.includes('devam') && p.startDate ? durTR(p.startDate, Date.now()) : '';
    const eksik = ps.startsWith('tamamland') && !p.producedQuantity ? '<span class="badge warn" style="background:var(--warn-soft);color:var(--warn)">Adet girilmedi</span>' : '';
    return '<div class="step ' + cls + '">' +
      '<div class="step-dot">' + (cls === 'done' ? I.check : cls === 'run' ? I.play : '') + '</div>' +
      '<div class="step-body"><div class="step-row"><span class="step-name">' + esc(p.name) + '</span>' + b + eksik + '</div>' +
      '<div class="step-info">' +
      (pq ? '<span>Üretim: <b>' + num(pq) + ' adet</b></span>' : '') +
      (sq ? '<span style="color:var(--danger)">Fire: <b>' + num(sq) + ' adet</b>' + (p.scrapReason ? ' (' + esc(p.scrapReason) + ')' : '') + '</span>' : '') +
      (p.startDate ? '<span>Başlangıç: <b>' + dateTimeFullTR(p.startDate) + '</b></span>' : '') +
      (p.endDate ? '<span>Bitiş: <b>' + dateTimeFullTR(p.endDate) + '</b></span>' : '') +
      (sure ? '<span>Süre: <b>' + sure + '</b></span>' : '') +
      (devamEdiyor ? '<span>Süren: <b style="color:var(--warn)">' + devamEdiyor + '</b></span>' : '') +
      (p.completedBy ? '<span>Operatör: <b>' + esc(p.completedBy) + '</b></span>' : p.startedBy ? '<span>Başlatan: <b>' + esc(p.startedBy) + '</b></span>' : '') +
      '</div></div></div>';
  }).join('');

  // izlenebilirlik: toplam çevrim süresi (ilk proses başlangıcı → son proses bitişi)
  const starts = procs.map((p) => p.startDate ? new Date(p.startDate).getTime() : 0).filter(Boolean);
  const ends = procs.map((p) => p.endDate ? new Date(p.endDate).getTime() : 0).filter(Boolean);
  const cevrim = starts.length && ends.length ? durTR(Math.min(...starts), Math.max(...ends)) : '';

  const kv = (k, v) => '<div class="kv"><div class="k">' + k + '</div><div class="v">' + (v || '—') + '</div></div>';
  const singleCode = String((o.moldCodes && o.moldCodes.single && o.moldCodes.single.code) || o.productCode || '').trim();
  const singleShelf = String((o.moldCodes && o.moldCodes.single && o.moldCodes.single.shelf) || o.singleShelfLocation || '').trim();

  return '<div class="wrap">' +
    '<div class="detail-head"><span class="wo-no" style="font-size:16px">#' + esc(o.workOrderNumber) + '</span>' + badge + (reopened ? '<span class="badge reopened">Eksik Adetten Açıldı</span>' : '') + '</div>' +
    '<div style="font-size:15px;font-weight:700;margin:8px 0 12px;line-height:1.35">' + esc((o.productName || '').trim()) + '</div>' +

    '<div class="sec-title">Teknik Bilgiler</div>' +
    '<div class="card tech-card">' +
    '<div class="tech-specs">' +
    '<div class="ts"><b>' + (W ? num(W) : '—') + '×' + (H ? num(H) : '—') + '</b><span>Ölçü (mm)</span></div>' +
    '<div class="ts"><b>' + esc((o.thickness || '').trim() || '—') + '</b><span>Kalınlık</span></div>' +
    '<div class="ts"><b>' + esc((o.color || '').trim() || '—') + '</b><span>Renk</span></div>' +
    '<div class="ts"><b>' + m2fmt(m2Each(o) * q) + '</b><span>m² (toplam)</span></div>' +
    '</div>' +
    '<div style="margin-top:8px;font-size:12px;color:var(--text-2);text-align:center">Ada ölçüsü: ' + m2fmt(m2Each(o)) + ' m² × ' + num(q) + ' adet</div>' +
    '<div id="tech-pdf-slot" style="margin-top:12px"></div>' +
    '</div>' +

    '<div class="sec-title">Teknik ve Künye Bilgileri</div>' +
    '<div class="card"><div class="kv-grid">' +
    kv('Müşteri', esc((o.customerName || '').trim())) +
    kv('Sipariş Adedi', num(q) + ' adet') +
    kv('Ürün Kodu', esc(String(o.productCode || '').trim())) +
    kv('İş Form No', esc(String(o.orderFormNumber || '').trim())) +
    kv('2. Ürün Kodu', esc(String(o.secondProductCode || '').trim())) +
    kv('2. Raf', esc(String(o.secondShelfLocation || '').trim())) +
    kv('1. Raf', esc(String(o.firstShelfLocation || '').trim())) +
    kv('Sipariş Tarihi', o.orderDate ? dateFullTR(o.orderDate) : '—') +
    kv('Termin', o.dueDate ? dateFullTR(o.dueDate) : '—') +
    kv('Oluşturan', esc(o.createdBy)) +
    kv('Oluşturma', o.createdAt ? dateTimeFullTR(o.createdAt) : '—') +
    kv('Son Güncelleme', o.updatedAt ? dateTimeFullTR(o.updatedAt) : '—') +
    kv('Toplam Çevrim', cevrim || '—') +
    '</div>' +
    (o.additionalInfo && String(o.additionalInfo).trim() ? '<div style="margin-top:12px;padding:9px 11px;border-radius:9px;background:var(--card-2);font-size:13px;color:var(--text-2)"><b style="color:var(--text)">Not:</b> ' + esc(String(o.additionalInfo).trim()) + '</div>' : '') +
    '</div>' +

    '<div class="sec-title">Kalıp ve Raf</div>' +
    '<div class="card" id="mold-card">' +
    (singleCode ? '<div class="mold-row"><div class="mr-ico">' + I.mold + '</div><div class="mr-main"><div class="mr-t">' + esc(singleCode) + '</div><div class="mr-s" id="mold-desc">Kalıp kodu · yükleniyor…</div></div>' + (singleShelf ? '<span class="badge aktif">Raf ' + esc(singleShelf) + '</span>' : '') + '</div>' : '<div class="empty" style="padding:12px"><div class="e-t">Kalıp kodu yok</div></div>') +
    '</div>' +

    '<div class="sec-title">Proses Akışı</div>' +
    '<div class="card"><div class="stepper">' + (steps || '<div class="empty" style="padding:14px"><div class="e-t">Proses tanımı yok</div></div>') + '</div></div>' +
    '</div>';
}

/* ---------- Detay rapor ekranları (KPI kartlarından girilir) ---------- */
const DS = { shown: {} };

function detayRows(kind) {
  const t = todayKey();
  const rows = [];
  if (kind === 'uretim') {
    for (const o of S.orders) {
      const m2e = m2Each(o);
      for (const p of o.processes || []) {
        if (trLower(p.status || '').startsWith('tamamland') && p.endDate && dayKey(p.endDate) === t) {
          rows.push({ o, ts: new Date(p.endDate).getTime() || 0, ico: I.check, cls: 'ok',
            t: '#' + o.workOrderNumber + ' · ' + p.name,
            s: (o.customerName || '').trim() + ' · ' + num(qtyOf(p.producedQuantity)) + ' adet · ' + m2fmt(m2e * qtyOf(p.producedQuantity)) + ' m²' + (p.completedBy ? ' · ' + p.completedBy : ''),
            right: timeTR(p.endDate) });
        }
      }
    }
  } else if (kind === 'acilan') {
    for (const o of S.orders) {
      if (dayKey(o.createdAt) === t) {
        rows.push({ o, ts: new Date(o.createdAt).getTime() || 0, ico: I.plus, cls: 'info',
          t: (o.productName || '').trim().slice(0, 42),
          s: (o.customerName || '').trim() + ' · ' + num(qtyOf(o.customerQuantity)) + ' adet · ' + m2fmt(m2Each(o) * qtyOf(o.customerQuantity)) + ' m² · ' + (o.createdBy || ''),
          right: timeTR(o.createdAt) });
      }
    }
  } else if (kind === 'fire') {
    for (const o of S.orders) {
      const m2e = m2Each(o);
      for (const p of o.processes || []) {
        const sq = qtyOf(p.scrapQuantity);
        if (sq > 0 && p.endDate && dayKey(p.endDate) === t) {
          rows.push({ o, ts: new Date(p.endDate).getTime() || 0, ico: I.flame, cls: 'danger',
            t: '#' + o.workOrderNumber + ' · ' + p.name,
            s: 'Fire: ' + num(sq) + ' adet (' + m2fmt(m2e * sq) + ' m²)' + (p.scrapReason ? ' — ' + p.scrapReason : '') + (p.completedBy ? ' · ' + p.completedBy : ''),
            right: timeTR(p.endDate) });
        }
      }
    }
  }
  rows.sort((a, b) => b.ts - a.ts);
  return rows;
}

function viewDetay(kind) {
  if (!S.orders.length) return S.bootFailed ? connErrorView() : skeleton();
  if (!DETAY_TITLES[kind]) return '<div class="wrap"><div class="empty"><div class="e-t">Bilinmeyen rapor</div></div></div>';
  const A = aggregates();
  let sum = '';
  if (kind === 'uretim') {
    sum = '<div class="pnum done"><b>' + num(A.outQtyToday) + '</b><span>Adet</span></div>' +
      '<div class="pnum pend"><b>' + m2fmt(A.outM2Today) + '</b><span>m²</span></div>' +
      '<div class="pnum run"><b>' + num(A.procDoneToday) + '</b><span>Proses</span></div>';
  } else if (kind === 'acilan') {
    sum = '<div class="pnum done"><b>' + num(A.openedToday) + '</b><span>İş Emri</span></div>' +
      '<div class="pnum pend"><b>' + num(A.openedTodayQty) + '</b><span>Adet</span></div>' +
      '<div class="pnum run"><b>' + num(A.todayEvents.filter((e) => e.kind === 'order-open').length) + '</b><span>Kayıt</span></div>';
  } else {
    sum = '<div class="pnum pend"><b>' + num(A.scrapQtyToday) + '</b><span>Fire Adet</span></div>' +
      '<div class="pnum run"><b>' + m2fmt(A.scrapM2Today) + '</b><span>m²</span></div>' +
      '<div class="pnum done"><b>%' + nf1.format(A.scrapPct) + '</b><span>Oran</span></div>';
  }
  return '<div class="wrap">' +
    '<div class="card" style="display:flex;gap:8px">' + sum + '</div>' +
    '<div class="sec-title"><span id="det-count">…</span> ' + dateFullTR(Date.now()) + '</div>' +
    '<div class="card" style="padding:4px 12px" id="det-list"></div>' +
    '</div>';
}

/* Liste yalnız kendi konağını yeniden çizer (WS tick'lerinde tüm ekranı değil) */
function paintDetList() {
  const host = $('#det-list'); if (!host) return;
  const kind = route().id;
  const rows = detayRows(kind);
  const shown = DS.shown[kind] || 50;
  const html = rows.slice(0, shown).map((r2) => {
    const cv = r2.cls === 'danger' ? 'danger' : r2.cls === 'ok' ? 'ok' : r2.cls === 'warn' ? 'warn' : 'info';
    return '<div class="lrow" data-go="#/emir/' + esc(r2.o.id) + '">' +
      '<div class="li-ico" style="background:var(--' + cv + '-soft);color:var(--' + cv + ')">' + r2.ico + '</div>' +
      '<div class="li-main"><div class="li-t">' + esc(r2.t) + '</div><div class="li-s">' + esc(r2.s) + '</div></div>' +
      '<div class="li-end">' + esc(r2.right) + '<br><span style="font-size:10px;color:var(--muted)">' + esc(r2.o.status) + '</span></div></div>';
  }).join('');
  const cnt = $('#det-count'); if (cnt) cnt.textContent = num(rows.length) + ' kayıt ·';
  host.innerHTML =
    (html || '<div class="empty" style="padding:26px"><div class="e-t">Bugün için kayıt yok</div></div>') +
    (rows.length > shown ? '<button class="loadmore" id="det-more">Daha fazla göster (' + num(rows.length - shown) + ')</button>' : '');
  const more = $('#det-more');
  if (more) more.onclick = () => { DS.shown[kind] = (DS.shown[kind] || 50) + 50; paintDetList(); };
}

function viewProsesler() {
  if (!S.orders.length && !S.processes.length) return S.bootFailed ? connErrorView() : skeleton();
  const A = aggregates();
  const list = knownProcesses();
  const cards = list.map((p) => {
    const pp = A.perProc.get(p.id) || { pending: 0, running: 0, doneToday: 0, qtyToday: 0, m2Today: 0 };
    return '<div class="card tap proc-card" data-go="#/proses/' + p.id + '">' +
      '<div class="p-name"><span class="pno">' + esc(String(p.name).slice(0, 2)) + '</span>' + esc(p.name) + '</div>' +
      '<div class="proc-nums">' +
      '<div class="pnum pend"><b>' + num(pp.pending) + '</b><span>Bekleyen</span></div>' +
      '<div class="pnum run"><b>' + num(pp.running) + '</b><span>Devam</span></div>' +
      '<div class="pnum done"><b>' + num(pp.doneToday) + '</b><span>Bugün</span></div>' +
      '</div>' +
      '<div style="margin-top:8px;font-size:11.5px;color:var(--muted)">Bugün: ' + num(pp.qtyToday) + ' adet · ' + m2fmt(pp.m2Today) + ' m²' + (pp.lastDate ? ' · son: ' + timeAgo(new Date(pp.lastDate).getTime()) : '') + '</div>' +
      '</div>';
  }).join('');
  return '<div class="wrap"><div class="sec-title" style="margin-top:4px">Proses Durumu — Bekleyen İşler</div><div class="proc-grid">' + cards + '</div></div>';
}

function viewProsesDetay(pid) {
  const name = procDisplayName(pid);
  const A = aggregates();
  const arr = S.orders.filter((o) =>
    trLower(o.status) === 'aktif' &&
    (o.processes || []).some((p) => p.id === pid && (trLower(p.status || 'beklemede') === 'beklemede' || trLower(p.status || '').includes('devam')))
  ).sort((a, b) => String(b.workOrderNumber).localeCompare(String(a.workOrderNumber)));
  const pp = A.perProc.get(pid) || {};
  return '<div class="wrap">' +
    '<div class="card" style="display:flex;gap:12px;align-items:center">' +
    '<div class="pnum pend" style="flex:1"><b>' + num(pp.pending || 0) + '</b><span>Bekleyen</span></div>' +
    '<div class="pnum run" style="flex:1"><b>' + num(pp.running || 0) + '</b><span>Devam</span></div>' +
    '<div class="pnum done" style="flex:1"><b>' + num(pp.doneToday || 0) + '</b><span>Bugün</span></div>' +
    '</div>' +
    '<div class="sec-title">' + esc(name) + ' — ' + num(arr.length) + ' aktif iş emri</div>' +
    (arr.map(woCard).join('') || '<div class="empty"><div class="e-t">Bu proseste bekleyen iş yok</div></div>') +
    '</div>';
}

function viewAyarlar() {
  const mixed = isMixedContent();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return '<div class="wrap">' +
    (cfg.demo ? '<div class="banner info">' + I.info + '<div><b>Demo kipi açık.</b> Gerçek veri için kapatın.</div></div>' : '') +
    (mixed ? '<div class="banner warn">' + I.alert + '<div><b>HTTPS kısıtı:</b> Bu sayfa HTTPS üzerinden; tarayıcı <b>http://</b> sunuculara erişimi engeller. Fabrika Wi-Fi\'ında LAN sürümünü (http://…) açın ya da sunucuya HTTPS tüneli kurun.</div></div>' : '') +

    '<div class="sec-title">Bağlantı</div>' +
    '<div class="card">' +
    '<div class="setrow" style="border:0;padding-top:2px"><div><div class="sl">' + (S.wsOk ? 'Bağlı · Otomatik' : 'Bağlanıyor…') + (S.tunnelURL ? ' <span class="badge aktif">TÜNEL</span>' : '') + '</div><div class="sd">' + esc(effectiveServer().replace(/^https?:\/\//, '')) + ' — LAN ya da tünel otomatik seçilir, ayar gerekmez</div></div><span class="live-pill ' + (S.wsOk ? 'on' : 'wait') + '"><span class="dot"></span>' + (S.wsOk ? 'CANLI' : '…') + '</span></div>' +
    '<div style="display:flex;gap:10px"><button class="btn ghost small" id="reconnect-btn" style="flex:1">↻ Yeniden Bağlan</button><button class="btn ghost small" id="notify-btn" style="flex:1">🔔 Bildirimleri Etkinleştir</button></div>' +
    '<div id="notify-state" style="margin-top:10px"></div>' +
    (cfg.manual ? '<div style="margin-top:10px"><button class="btn ghost small" id="auto-server" style="width:100%">↺ Otomatik Bağlantıya Dön</button></div>' : '') +
    '<details style="margin-top:12px"><summary style="font-size:13px;font-weight:700;color:var(--text-2);cursor:pointer;padding:6px 0">Gelişmiş: elle sunucu / test / teknik resim</summary><div style="padding-top:8px">' +
    '<div class="field"><label>Sunucu Adresi</label><input type="text" id="set-server" value="' + esc(cfg.server) + '" inputmode="url" autocapitalize="off" spellcheck="false"><div class="hint">Örn: http://192.168.1.200:3001</div></div>' +
    '<div class="field"><label>Teknik Resim Adres Şablonu (PDF)</label><input type="text" id="set-pdftpl" value="' + esc(cfg.pdfTpl || '') + '" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="http://sunucu/klasor/{kod}.pdf"><div class="hint">{kod} yerine ürün/kalıp kodu yazılır. İş emri detayında PDF olarak açılır.</div></div>' +
    '<div style="display:flex;gap:10px"><button class="btn primary small" id="save-server" style="flex:1">Kaydet & Bağlan</button><button class="btn ghost small" id="test-server" style="flex:1">Bağlantı Testi</button></div>' +
    '<div class="setrow" style="margin-top:8px"><div><div class="sl">Canlı Güncelleme (WebSocket)</div><div class="sd">Değişiklikler anında yansır</div></div><label class="switch"><input type="checkbox" id="set-live" ' + (cfg.live ? 'checked' : '') + '><span class="track"></span><span class="thumb"></span></label></div>' +
    '<div class="setrow"><div><div class="sl">Yedek Yenileme Aralığı</div><div class="sd">WebSocket yoksa bu sıklıkla yenilenir</div></div><select id="set-poll" style="padding:8px 10px;border-radius:9px;border:1px solid var(--border-strong);background:var(--card);color:var(--text);font-weight:700">' + [10, 20, 30, 60].map((s) => '<option value="' + s + '" ' + (cfg.pollSec == s ? 'selected' : '') + '>' + s + ' sn</option>').join('') + '</select></div>' +
    '<div id="test-result" style="margin-top:10px"></div>' +
    '</div></details>' +
    '</div>' +

    '<div class="sec-title">Uzaktan Erişim (Her Ağdan)</div>' +
    '<div class="card" style="font-size:13px;line-height:1.65;color:var(--text-2)">' +
    '<div style="font-weight:700;color:var(--text);margin-bottom:6px">Fabrika dışından bağlanmak için:</div>' +
    '1. Üretim sunucusu makinesine (192.168.1.200) <b>ngrok</b> kurun (ücretsiz): <b>dashboard.ngrok.com</b><br>' +
    '2. Ücretsiz hesap açın, <b>statik domaine</b> sahip olun (ör: <b>sizin-adiniz.ngrok-free.app</b>)<br>' +
    '3. Sunucu makinesinde çalıştırın: <b>ngrok http --url=sizin-adiniz.ngrok-free.app 3001</b><br>' +
    '4. Bu uygulamada Sunucu Adresi olarak <b>https://sizin-adiniz.ngrok-free.app</b> yazıp kaydedin<br><br>' +
    '<div class="banner warn" style="margin:0">' + I.alert + '<div><b>Güvenlik:</b> Sistemde sunucu tarafı oturum koruması yok. Tünel, üretim verisini internete açar; sadece ihtiyacınız varken kullanın.</div></div>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:8px">Fabrika Wi-Fi içindeyseniz tünel gerekmez; LAN adresi (http://192.168.1.200:3001) daha hızlıdır.</div>' +
    '</div>' +

    '<div class="sec-title">Kurulum — Ana Ekrana Ekle</div>' +
    '<div class="card">' +
    (isIOS
      ? '<div style="font-size:13.5px;line-height:1.7">1. Bu sayfayı <b>Safari</b> ile açın<br>2. Alt bardaki <b>Paylaş</b> ' + '<span style="color:var(--brand-2);font-weight:700">□↑</span>' + ' düğmesine dokunun<br>3. <b>Ana Ekrana Ekle</b> → <b>Ekle</b><br><span style="color:var(--muted);font-size:12px">Uygulama tam ekran, ikonlu olarak çalışır.</span></div>'
      : '<div style="font-size:13.5px;line-height:1.7">1. Chrome menüsü <b>⋮</b> → <b>Ana ekrana ekle</b> / <b>Uygulamayı yükle</b><br><span style="color:var(--muted);font-size:12px">Yükleme seçeneği görünmezse tarayıcı menüsündeki "Ana ekrana ekle"yi kullanın.</span></div>') +
    '<div id="install-slot" style="margin-top:12px"></div>' +
    '</div>' +

    '<div class="sec-title">Veri</div>' +
    '<div class="card">' +
    '<div class="setrow"><div><div class="sl">Demo Kipi</div><div class="sd">Sunucu olmadan sentetik verilerle inceleme</div></div><label class="switch"><input type="checkbox" id="set-demo" ' + (cfg.demo ? 'checked' : '') + '><span class="track"></span><span class="thumb"></span></label></div>' +
    '<div style="margin-top:12px"><button class="btn ghost" id="full-refresh">Tüm Veriyi Yenile</button></div>' +
    '</div>' +

    '<div class="sec-title">Hakkında</div>' +
    '<div class="card" style="text-align:center">' +
    '<img src="assets/logo.png" alt="Ekol Glass" style="width:150px;image-rendering:auto;margin:6px auto 10px;display:block">' +
    '<div style="font-size:13.5px;font-weight:700">Üretim Takip Mobil</div>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:3px">v1.0.0 · Ekol Glass</div>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:8px">Veri kaynağı: ' + esc(cfg.server) + '</div>' +
    '</div>' +
    '</div>';
}

/* ---------- Etkileşim ---------- */
function afterRender(r) {
  if (r.name === 'emirler') paintWoList();
  if (r.name === 'detay') paintDetList();

  // genel: data-go ile gezinme
  $('#view').onclick = (e) => {
    const t = e.target.closest('[data-go]');
    if (t) { go(t.getAttribute('data-go')); }
  };

  if (r.name === 'emirler') {
    const inp = $('#wo-search');
    if (inp) {
      let deb;
      inp.oninput = () => { clearTimeout(deb); deb = setTimeout(() => { L.q = inp.value; L.shown = 25; paintWoList(); }, 220); };
      $$('.chip[data-status]').forEach((c) => c.onclick = () => {
        L.status = c.getAttribute('data-status'); L.shown = 25; saveFilters();
        $$('.chip[data-status]').forEach((x) => x.classList.toggle('active', x === c));
        paintWoList();
      });
    }
    const fb = $('#filter-btn');
    if (fb) fb.onclick = openFilterSheet;
  }

  if (r.name === 'ozet') {
    // KPI sayı animasyonu — yalnız ekran girişinde, canlı yenilemede tekrar oynamaz
    if (S.animateNext) {
      S.animateNext = false;
      $$('.kpi-num[data-count]').forEach((el, i) => {
        const target = parseInt(el.getAttribute('data-count')) || 0;
        const small = el.querySelector('small');
        const t0 = performance.now() + i * 70;
        const dur = 550;
        const step = (now) => {
          const k = Math.min(1, Math.max(0, (now - t0) / dur));
          const v = Math.round(target * (1 - Math.pow(1 - k, 3)));
          el.innerHTML = nf.format(v) + (small ? small.outerHTML : '');
          if (k < 1 && el.isConnected) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }
    const tt = $('#today-toggle');
    if (tt) tt.onclick = () => { S.showAllToday = !S.showAllToday; renderIfStale(false); };
  }

  if (r.name === 'emir') {
    const o = S.byId.get(r.id);
    // kalıphane açıklamasını canlı çek
    const el = $('#mold-desc');
    if (o && el) {
      const code = String((o.moldCodes && o.moldCodes.single && o.moldCodes.single.code) || o.productCode || '').trim();
      moldInfo(code).then((info) => {
        if (!el.isConnected) return;
        el.textContent = info && info.description ? info.description : 'Kalıp kodu';
      }).catch(() => { if (el.isConnected) el.textContent = 'Kalıp kodu'; });
    }
    // teknik resim PDF'i (adres şablonu tanımlıysa)
    const slot = $('#tech-pdf-slot');
    if (o && slot) {
      const url = techPdfURL(o);
      if (!url) {
        slot.innerHTML = '<div class="hint" style="text-align:center">Teknik resim: Ayarlar → “Teknik Resim Adres Şablonu” tanımlanınca burada PDF olarak açılır</div>';
      } else {
        slot.innerHTML = '<a class="btn primary" style="text-decoration:none" id="pdf-open" target="_blank" rel="noopener" href="' + esc(url) + '">📄 Teknik Resmi Aç (PDF)</a>';
        techPdfExists(o).then((u) => {
          if (!u || !slot.isConnected) return;
          slot.insertAdjacentHTML('beforeend',
            '<iframe src="' + esc(u) + '" style="width:100%;height:420px;border:1px solid var(--border);border-radius:12px;margin-top:10px;background:#fff" title="Teknik resim"></iframe>');
        });
      }
    }
  }

  if (r.name === 'ozet' || r.name === 'ayarlar') {
    const d = $('#demo-btn2'); if (d) d.onclick = () => { cfg.demo = true; saveCfg(); reboot(); };
    const rt = $('#retry-btn'); if (rt) rt.onclick = async () => {
      S.wsDead = false; S.wsAttempts = 0; S.bootFailed = false; S.lastTunnelTry = 0; S.tunnelURL = null;
      await tryTunnel();
      if (!S.wsOk) { refreshREST(false); connectWS(); }
      render(route());
    };
  }

  if (r.name === 'ayarlar') {
    const rb = $('#reconnect-btn');
    if (rb) rb.onclick = () => {
      S.tunnelURL = null; S.wsDead = false; S.wsAttempts = 0; S.bootFailed = false; S.lastTunnelTry = 0;
      toast('Yeniden bağlanılıyor…');
      tryTunnel().then(() => { if (!S.wsOk) { refreshREST(true); connectWS(); } });
      render(route());
    };
    const nb = $('#notify-btn');
    const nState = $('#notify-state');
    const paintNotifyState = () => {
      if (!nState) return;
      const p = ('Notification' in window) ? Notification.permission : 'unsupported';
      nState.innerHTML = p === 'granted'
        ? '<div class="banner info">' + I.check + '<div><b>Bildirimler açık.</b> Uygulama arka plandayken üretim güncellemeleri bildirim olarak gelir.</div></div>'
        : p === 'denied'
          ? '<div class="banner warn">' + I.alert + '<div>Bildirim izni reddedilmiş. Tarayıcı ayarlarından bu site için bildirimlere izin verin.</div></div>'
          : '<div class="banner info">' + I.bell + '<div>İzin verirseniz yeni iş emri, başlayan/biten prosesler bildirim olarak düşer.</div></div>';
    };
    paintNotifyState();
    if (nb) nb.onclick = async () => {
      if (!('Notification' in window)) { toast('Bu tarayıcı bildirim desteklemiyor'); return; }
      try { await Notification.requestPermission(); } catch { /* yoksay */ }
      paintNotifyState();
      if (Notification.permission === 'granted') toast('Bildirimler etkin ✔');
    };
    $('#save-server').onclick = () => {
      const v = $('#set-server').value.trim().replace(/\/+$/, '');
      if (!/^https?:\/\/.+/.test(v)) { toast('Geçerli bir adres girin (http://…)'); return; }
      cfg.server = v; cfg.manual = true; S.tunnelURL = null;
      const tp = $('#set-pdftpl').value.trim();
      if (tp && !tp.includes('{kod}')) { toast('PDF şablonunda {kod} eksik'); return; }
      cfg.pdfTpl = tp; pdfProbe.clear();
      saveCfg(); toast('Kaydedildi, bağlanılıyor…'); reboot();
    };
    const asBtn = $('#auto-server');
    if (asBtn) asBtn.onclick = () => {
      cfg.manual = false; S.tunnelURL = null; S.wsDead = false; S.wsAttempts = 0; S.lastTunnelTry = 0;
      saveCfg(); toast('Otomatik kipe geçildi'); reboot();
    };
    $('#test-server').onclick = async () => {
      const v = $('#set-server').value.trim().replace(/\/+$/, '');
      const out = $('#test-result');
      out.innerHTML = '<div class="banner info">' + I.info + '<div>Test ediliyor…</div></div>';
      const t0 = performance.now();
      try {
        const old = cfg.server; cfg.server = v;
        const r2 = await api('/api/processes', 6000);
        cfg.server = old;
        out.innerHTML = '<div class="banner ' + (isMixedContentTest(v) ? 'warn' : 'info') + '">' + (isMixedContentTest(v) ? I.alert : I.check) + '<div><b>Başarılı.</b> ' + Math.round(performance.now() - t0) + ' ms · ' + (Array.isArray(r2) ? r2.length : '?') + ' proses bulundu' + (isMixedContentTest(v) ? ' — ancak HTTPS sayfadan bu HTTP adrese tarayıcı izin vermez!' : '') + '</div></div>';
      } catch {
        out.innerHTML = '<div class="banner err">' + I.alert + '<div><b>Başarısız.</b> Adrese ulaşılamıyor. Ağ, adres ve port kontrol edin.</div></div>';
      }
    };
    $('#set-live').onchange = (e) => { cfg.live = e.target.checked; saveCfg(); if (cfg.live) { S.wsDead = false; S.wsAttempts = 0; connectWS(); } else { try { S.ws && S.ws.close(); } catch {} stopPolling(); } paintStatus(); };
    $('#set-poll').onchange = (e) => { cfg.pollSec = parseInt(e.target.value); saveCfg(); if (S.pollTimer) { stopPolling(); startPolling(); } };
    $('#set-demo').onchange = (e) => { cfg.demo = e.target.checked; saveCfg(); reboot(); };
    $('#full-refresh').onclick = () => { if (cfg.demo) { setOrders(S.orders, false); toast('Yenilendi'); } else { S.processes = []; refreshREST(false); } };
    const slot = $('#install-slot');
    if (S.installEvt && slot) slot.innerHTML = '<button class="btn primary" id="install-btn">📲 Uygulamayı Yükle</button>';
    const ib = $('#install-btn'); if (ib) ib.onclick = async () => { S.installEvt.prompt(); await S.installEvt.userChoice; S.installEvt = null; slot.innerHTML = ''; };
  }
}

function isMixedContentTest(server) { return location.protocol === 'https:' && server.startsWith('http://'); }

/* ---------- Toast ---------- */
function toast(msg) {
  const w = $('#toast-wrap');
  const d = document.createElement('div');
  d.className = 'toast'; d.textContent = msg;
  w.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity .3s'; setTimeout(() => d.remove(), 320); }, 2600);
}

/* ---------- Aşağı çek yenile ---------- */
(function initPTR() {
  const el = $('#ptr');
  let startY = 0, pulling = false, dist = 0;
  document.addEventListener('touchstart', (e) => {
    if ($('#view').scrollTop > 4 || !e.touches.length) { pulling = false; return; }
    startY = e.touches[0].clientY; pulling = true; dist = 0;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    dist = e.touches[0].clientY - startY;
    if (dist > 8 && dist < 96) { el.hidden = false; el.style.transform = 'translate(-50%,' + (-46 + Math.min(dist * .55, 44)) + 'px)'; }
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!pulling) return; pulling = false;
    if (dist > 62) {
      el.classList.add('loading');
      if (cfg.demo) { setOrders(S.orders, false); toast('Yenilendi'); setTimeout(done, 500); }
      else refreshREST(false).then(done);
      function done() { setTimeout(() => { el.classList.remove('loading'); el.hidden = true; }, 350); }
    } else { el.hidden = true; }
    el.style.transform = '';
  });
})();

/* ---------- Sayaç (x sn önce) ---------- */
setInterval(() => {
  const el = $('#syncline span[data-ts]');
  if (el) el.textContent = timeAgo(parseInt(el.getAttribute('data-ts')) || 0);
}, 5000);

/* ---------- Hata yakalama (teşhis) ---------- */
window.__utmErrs = [];
window.addEventListener('error', (e) => window.__utmErrs.push((e.message || '') + ' @' + (e.lineno || '?')));
window.addEventListener('unhandledrejection', (e) => window.__utmErrs.push('REJ: ' + ((e.reason && e.reason.message) || String(e.reason))));
window.__utmDebug = () => ({ orders: S.orders.length, wsOk: S.wsOk, wsDead: S.wsDead, bootFailed: S.bootFailed, lastSync: S.lastSync, poll: !!S.pollTimer, cfg, errs: window.__utmErrs.slice(0, 8), hash: location.hash });

/* ---------- Önyükleme ---------- */
function reboot() {
  stopPolling(); stopDemo();
  S.wsDead = false; S.wsAttempts = 0; S.bootFailed = false; S.orders = []; S.processes = []; S.A = null; S.clients = 0;
  boot();
}

async function boot() {
  try { render(route()); } catch (err) { console.error('ilk render:', err); window.__utmErrs.push('boot-render: ' + err.message); }
  window.addEventListener('hashchange', () => { S.hiddenUpdate = false; render(route()); window.scrollTo(0, 0); });

  if (cfg.demo) { startDemo(); paintStatus(); return; }

  // süreçleri ve veriyi çek; WS paralel bağlanır
  api('/api/processes').then((p) => { if (Array.isArray(p)) { S.processes = p; if (route().name === 'ozet' || route().name === 'prosesler') render(route()); } }).catch(() => {});
  connectWS();
  refreshREST(true);

  // 10 sn sonra hâlâ veri yoksa: önce tünel keşfi, olmuyorsa hata görünümü
  setTimeout(async () => {
    if (!S.orders.length) {
      const ok = await tryTunnel();
      if (!ok && !S.orders.length) { S.bootFailed = true; render(route()); }
    }
  }, 10000);

  // arka plana dönünce hızlı tazele; bağlantı düşükse tünel değişmiş olabilir
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !cfg.demo) {
      if (S.wsOk && S.orders.length) { try { S.ws.send(JSON.stringify({ type: 'GET_DATA' })); } catch {} }
      else { S.wsDead = false; S.wsAttempts = 0; S.lastTunnelTry = 0; tryTunnel().then(() => { if (!S.wsOk) { connectWS(); refreshREST(true); } }); }
    }
  });
}

/* SW kaydı (yalnız güvenli bağlam) */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installEvt = e; });

boot();
