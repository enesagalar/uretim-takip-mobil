# Ekol Glass — Üretim Takip Mobil

Üretim takip sisteminin (**http://192.168.1.200:3001**) mobil uyumlu, kurumsal görünümlü PWA sürümü.
Telefonunuzdan ana ekrandan açıp **anlık** üretim durumunu izleyebilirsiniz.

## Özellikler

- **Canlı veri**: WebSocket ile sunucudaki her değişiklik saniyeler içinde yansır (üstteki CANLI göstergesi). WebSocket yoksa otomatik yedek periyodik yenileme devreye girer.
- **Özet**: Bugün üretim (adet/m²), bugün açılan iş emirleri, aktif iş emri yükü, fire oranı, son 7 gün grafiği, termin yaklaşanlar, proses durum panosu.
- **İş Emirleri**: Arama (no / ürün / müşteri / ürün kodu), durum filtreleri, proses ilerleme çubukları, "sıradaki proses" bilgisi.
- **İş Emri Detay**: Tüm künye bilgileri + proses akış zaman çizelgesi (kim, ne zaman, kaç adet, fire).
- **Prosesler**: Her proses için bekleyen / devam eden / bugün tamamlanan sayıları; ilgili iş emri listeleri.
- **Ayarlar**: Sunucu adresi, canlı güncelleme, tema (açık/koyu/sistem), demo kipi, ana ekrana ekleme rehberi.
- Aşağı çekerek yenileme, koyu tema, iPhone güvenli alan desteği, çevrimdışı açılma (service worker).

## Kurulum — Fabrika Wi-Fi içi (ÖNERİLEN)

Uygulama doğrudan üretim sunucusundan (`http://…:3001`) veri çeker. HTTPS bir siteden
tarayıcılar `http://` iç ağ adreslerine erişime izin vermez. Bu yüzden **telefonla aynı Wi-Fi'dayken
uygulamanın LAN sürümünü** kullanın:

1. Ağdaki herhangi bir (tercihen açık kalan) Windows bilgisayara bu klasörü kopyalayın — ya da sunucu makinesine.
2. `baslat.bat` dosyasına çift tıklayın (Node.js gerekir: https://nodejs.org).
3. Konsolda yazan adresi (örn. `http://192.168.1.6:8080`) telefondan açın.
4. **Ana ekrana ekleyin** (iOS: Safari → Paylaş → Ana Ekrana Ekle · Android: Chrome → ⋮ → Ana ekrana ekle).

> Not: Node kurmak istemezseniz klasörü üretim sunucusunun (192.168.1.200) statik dosya klasörüne
> kopyalayıp `http://192.168.1.200:3001/mobil/` olarak da açabilirsiniz.

## Kurulum — İnternetten erişim (GitHub Pages)

Hazır adres: **https://enesagalar.github.io/uretim-takip-mobil/**

Bu adres HTTPS olduğu için tarayıcı, `http://192.168.1.200:3001` gibi iç ağ HTTP adreslerine erişimi
engeller (güvenlik kuralı). Bu sürümü gerçek veriyle kullanmak için iki yol vardır:

1. **Telefon fabrika Wi-Fi'ındaysa**: Ayarlar → Bağlantı kısmından sunucu adresini `http://…` girseniz
   bile tarayıcı engeller. Bu durumda yukarıdaki LAN sürümünü kullanın.
2. **Dışarıdan erişim**: Sunucuyu güvenli bir tünel (ör. Cloudflare Tunnel) veya VPN ile HTTPS üzerinden
   yayınlayıp adresi Ayarlar'a yazmak gerekir.
   ⚠️ **Dikkat**: Sistemde sunucu tarafı oturum doğrulaması yok; tünel açmak üretim verisini
   internete exposed eder. Sadece güvenilir bir tünel/VPN çözümüyle ve bilinçli olarak yapın.

Demo verilerle denemek için: Ayarlar → Veri → Demo Kipi.

## Geliştirme Notları

- Bağımlılık yok; saf HTML/CSS/JS. `server.js` tek dosyalık statik sunucu.
- Veri kaynakları: `GET /api/work-orders?limit=999999` (yedek), `GET /api/processes`, WebSocket
  (`ws://sunucu:3001`, mesajlar: `INITIAL_DATA`, `DATA_UPDATE`, `CLIENT_COUNT_UPDATE`, `NOTIFICATION`).
- KPI hesapları mevcut dashboard ile aynı mantıktadır (m² = en/1000 × boy/1000 × adet; termin ≤ 3 gün).
- İkonlar şirket logosundan üretilmiştir (`make-icons.ps1`), demo veri tamamen sentetiktir (`gen-demo.mjs`).
