// Demo veri üreteci — tamamen sentetik, gerçek müşteri/ürün verisi içermez.
// Çıktı: js/demo-data.js  (window.DEMO_DATA)
import { writeFileSync } from 'node:fs';

const PROCS = [
  { id: 1, name: 'Kesim', description: 'Malzemenin kesilmesi işlemi' },
  { id: 2, name: 'Cnc Rodaj', description: 'CNC tezgahında rodaj işlemi' },
  { id: 3, name: 'Su Jeti', description: 'Su jeti ile kesme işlemi' },
  { id: 5, name: 'Delik', description: 'Delik açma işlemi' },
  { id: 8, name: 'Serigrafi Baskı', description: 'Serigrafi baskı işlemi' },
  { id: 10, name: 'Temper(Bombe)', description: 'Bombe şeklinde temperleme' },
  { id: 11, name: 'Temper(Düz)', description: 'Düz temperleme işlemi' },
  { id: 14, name: 'Isı Cam', description: 'Isı cam uygulaması' },
  { id: 15, name: 'Ambalaj', description: 'Ambalajleme işlemi' }
];

const CUSTOMERS = ['ANADOLU TURİZM A.Ş.', 'MARMARA OTO KİRALAMA', 'EGE SERAMİK', 'YILDIZ KAROSER', 'KARDELEN TURİZM', 'MERİÇ OTO EKSPERTİZ', 'BAKLAN OTO', 'GÜNEŞ TURİZM', 'AKDENİZ KAROSER', 'SELÇUK OTO'];
const PRODUCTS = [
  ['1457X608 OTO KAPI CAMI FÜME', '4mm', 'Füme'],
  ['1410X830 PANORAMİK YAN CAM ŞEFFAF', '4mm', 'Şeffaf'],
  ['1760X1150 ÖZEL CAM BRONZ', '8mm', 'Bronz'],
  ['950X700 ARAKASAN CAM ŞEFFAF', '5mm', 'Şeffaf'],
  ['1200X600 TAVAN CAMI LACİVERT', '5mm', 'Lacivert'],
  ['1800X1200 REZİSTANSLI Ön CAM', '4.8mm', 'Şeffaf'],
  ['820X610 SERİGRAFİLİ ARKA CAM', '4mm', 'Füme'],
  ['1600X900 BOMBELİ YAN CAM ŞEFFAF', '5mm', 'Şeffaf'],
  ['700X500 ÜÇGEN SABİT CAM', '8mm', 'Bronz'],
  ['1350X760 ISICAM KAPI CAMI', '6mm', 'Şeffaf']
];
const USERS = ['admin', 'planlama', 'Üretim'];
const COLORS = ['Füme', 'Şeffaf', 'Bronz', 'Lacivert', 'Yeşil'];

let seed = 42;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;

const now = Date.now();
const DAY = 86400000;
const orders = [];

for (let i = 0; i < 64; i++) {
  const created = new Date(now - ri(0, 13) * DAY - ri(0, 20) * 3600000);
  const [pname, thick] = pick(PRODUCTS);
  const w = ri(500, 1900), h = ri(400, 1200);
  const qty = ri(1, 24);
  const ageDays = (now - created.getTime()) / DAY;

  let status = 'Aktif';
  const r = rnd();
  if (ageDays > 6 && r < 0.6) status = 'Tamamlandı';
  else if (r > 0.96) status = 'İptal';

  const procCount = ri(3, 5);
  const procs = PROCS.slice(0, procCount).map((p, idx) => {
    let ps = 'beklemede', produced = '', scrap = '', sDate = '', eDate = '', by = '';
    if (status === 'Tamamlandı' || status === 'İptal') {
      ps = 'Tamamlandı';
      produced = String(qty); scrap = rnd() > 0.8 ? String(ri(1, 2)) : '';
      sDate = new Date(created.getTime() + (idx + 1) * 4 * 3600000).toISOString();
      eDate = new Date(created.getTime() + (idx + 2) * 5 * 3600000).toISOString();
      by = pick(USERS);
    } else if (rnd() < 0.55) {
      // aktif emirde bazı prosesler ilerlemiş
      const done = ri(1, procCount - 1);
      if (idx < done) {
        ps = 'Tamamlandı';
        produced = String(qty); scrap = rnd() > 0.85 ? '1' : '';
        sDate = new Date(created.getTime() + (idx + 1) * 6 * 3600000).toISOString();
        eDate = new Date(created.getTime() + (idx + 2) * 6 * 3600000).toISOString();
        by = pick(USERS);
      } else if (idx === done) {
        ps = 'devam ediyor';
        produced = String(Math.max(1, Math.floor(qty / 2)));
        sDate = new Date(now - ri(1, 5) * 3600000).toISOString();
        by = pick(USERS);
      }
    }
    return { id: p.id, name: p.name, order: idx + 1, status: ps, progress: ps === 'Tamamlandı' ? 100 : 0, producedQuantity: produced, scrapQuantity: scrap, scrapReason: '', startedBy: by, completedBy: by, cancelledBy: '', restartedBy: '', startDate: sDate, endDate: eDate };
  });

  // Bugün tamamlanan prosesler üret (canlılık için)
  if (status === 'Aktif') {
    for (const p of procs) {
      if (p.status === 'Tamamlandı' && rnd() > 0.75) {
        p.endDate = new Date(now - ri(5, 300) * 60000).toISOString();
        p.producedQuantity = String(qty);
      }
    }
  }

  const due = new Date(created.getTime() + ri(0, 8) * DAY);
  orders.push({
    workOrderNumber: String(2609000 + i * 7 + ri(0, 5)),
    orderFormNumber: '',
    isReopenedFromShortfall: 'false',
    orderDate: created.toISOString().slice(0, 10),
    productCode: 'DEMO' + ri(10000, 99999) + ' ',
    productName: pname,
    singleShelfLocation: 'A' + ri(1, 20) + '-' + ri(1, 40),
    secondProductCode: '', secondShelfLocation: '', firstShelfLocation: '',
    thickness: thick, color: pick(COLORS),
    width: String(w), height: String(h),
    customerName: pick(CUSTOMERS),
    customerQuantity: String(qty),
    dueDate: status === 'Aktif' && rnd() > 0.5 ? due.toISOString().slice(0, 10) : '',
    additionalInfo: '',
    id: 'demo' + String(i).padStart(4, '0'),
    status,
    createdBy: pick(USERS),
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
    processes: procs,
    moldCodes: { single: { code: 'DEMO' + ri(10000, 99999), shelf: 'A' + ri(1, 20) } },
    printReady: true
  });
}

orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

const out = `// DEMO VERİ — tamamen sentetiktir, gerçek üretim verisi içermez.
window.DEMO_DATA = ${JSON.stringify({ workOrders: orders, processes: PROCS })};\n`;
writeFileSync(new URL('./js/demo-data.js', import.meta.url), out);
console.log('demo-data.js yazıldı:', orders.length, 'iş emri');
