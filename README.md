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

## Her Ağdan Erişim (Fabrika Dışı — PC'niz Kapalıyken)

Uygulama HTTPS üzerinde yayınlandığı için, iç ağdaki `http://192.168.1.200:3001` adresine tarayıcılar
erişime izin vermez. Çözüm: üretim sunucusu makinesine (192.168.1.200 — hep açık olan makine)
**ücretsiz ngrok tüneli** kurmak. Tünel sunucu makinesinde çalıştığı sürece **sizin PC'nizin açık
olmasına gerek yoktur**; telefon mobil veriyle bile bağlanır.

1. **ngrok'u ücretsiz hesapla alın**: https://dashboard.ngrok.com/signup
2. Ücretsiz hesabınıza tanımlı **statik domaine** sahip olunrsunuz (ör. `sizin-adiniz.ngrok-free.app`).
3. Üretim sunucusu makinesine (192.168.1.200) ngrok'u indirin: https://ngrok.com/download
4. Authtoken'ı bir kez girin: `ngrok config add-authtoken TOKENINIZ`
5. Tüneli başlatın: `ngrok http --url=sizin-adiniz.ngrok-free.app 3001`
   (Windows'ta otomatik başlatma için bu komutu bir `.bat` dosyasına koyup "Başlangıç" klasörüne ekleyin.)
6. Telefonda uygulamayı açın → **Ayarlar → Sunucu Adresi** → `https://sizin-adiniz.ngrok-free.app` → **Kaydet & Bağlan**.

Uygulama ngrok için gerekli başlığı (`ngrok-skip-browser-warning`) otomatik ekler; WebSocket (wss) desteği hazırdır.
Bu kurulum test edilmiştir: HTTPS tünel üzerinden REST + WebSocket canlı bağlantı doğrulandı.

⚠️ **Güvenlik uyarısı**: Sisteminizde sunucu tarafı oturum doğrulaması yoktur (giriş ekranı yalnızca
tarayıcı tarafındadır). Tünel açıkken üretim verisi bu statik adres üzerinden internete açık olur.
Adresi paylaşmayın; tüneli ihtiyaç olmadığı dönemde kapatın. Daha katı çözüm isterseniz: Tailscale/ZeroTier
(kapalı VPN ağı, sadece üye cihazlar) veya Cloudflare Tunnel + alan adı + erişim politikası.

**Fabrika Wi-Fi içindeyseniz tünel gerekmez** — LAN adresi (`http://192.168.1.200:3001`) veya LAN
sürümü daha hızlıdır. Uygulama iki adres arasında Ayarlar'dan tek dokunuşla geçer.

## Geliştirme Notları

- Bağımlılık yok; saf HTML/CSS/JS. `server.js` tek dosyalık statik sunucu.
- Veri kaynakları: `GET /api/work-orders?limit=999999` (yedek), `GET /api/processes`, WebSocket
  (`ws://sunucu:3001`, mesajlar: `INITIAL_DATA`, `DATA_UPDATE`, `CLIENT_COUNT_UPDATE`, `NOTIFICATION`).
- KPI hesapları mevcut dashboard ile aynı mantıktadır (m² = en/1000 × boy/1000 × adet; termin ≤ 3 gün).
- İkonlar şirket logosundan üretilmiştir (`make-icons.ps1`), demo veri tamamen sentetiktir (`gen-demo.mjs`).
