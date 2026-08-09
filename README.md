# 📜 Davetiye Yönetim Sistemi

Dijital düğün/nikah davetiyesi **şablonlarını oluşturma, düzenleme, listeleme ve HTML çıktı olarak üretme** sistemi. Tamamı **tek başına çalışan, sunucusuz (offline)** HTML/JS dosyalarından oluşur. Bu depo, ilk sürüm (Phase 1) işlevidir.

> Ürün = **HTML şablon**. JSON, verileri saklayan yardımcı formattır.

---

## 🚀 Hızlı Başlangıç

### Seçenek 1 — `baslat.bat` (önerilen, Windows)

1. Proje klasöründe `baslat.bat`a çift tıkla.
2. Tarayıcıda **Ana Liste (index)** otomatik açılır.

Sırasıyla şu sunuculardan birini dener (hangisi varsa):
- `node server.js` (tam özellikli — kaydetme/üretme desteklenir) ▶ **önerilen**
- `npx serve` (dosyaları sunar; **kaydetme devre dışı**)
- `python -m http.server` (dosyaları sunar; **kaydetme devre dışı**)

> 💡 **Node.js kuruluysa** (`node --version`) sistem tam kapasite çalışır. Kurulum: <https://nodejs.org>
> Default port: **3000** — `http://localhost:3000`

### Seçenek 2 — Elle

```bash
node server.js 3000
# veya: npx serve . --listen 3000 --no-clipboard
```

---

## 🖥 Arayüz

### 🏠 Ana Liste — `index.html`
Açılış sayfası. `data/` klasöründeki tüm davetiyeleri kart olarak listeler:
- **✏️ Düzenle** → editörü o davetiyenin verisiyle açar (`?op=OP-…`)
- **👁 Önizle** → davetiyeyi yeni sekmede tam ekran görüntüler
- **📄 JSON** → davetiyenin veri dosyasını gösterir
- **🚀** → `cikti/` klasörüne HTML davetiyesi üretir
- **🗑** → veriyi siler
- Arama kutusu (çift adı, OP no, etkinlik türü, oluşturan)

### ✏️ Editör — `davetiye_editor.html`
Tüm form alanları (kapak, başlık, çift bilgileri, tarih/program, mekan, SSS, RSVP, galeri, müzik, fontlar, slider arka planları). Sağda **canlı önizleme** (`davetiye_preview.html` iframe).
- 🏠 → ana listeye döner
- **💾 data/ Kaydet** → veriyi `data/OP-….json` olarak kaydeder
- **🚀 cikti/ HTML** → şablon + veriyi gömüp `cikti/` klasörüne tek dosya HTML üretir
- **📥 İçe Aktar** → `import/` klasöründeki JSON/HTML dosyalarını yükler
- **URL parametreleri:** `?op=OP-…` ile veri yükler, `?import=1` ile içe aktarma barını açar, `?yeni=1` ile boş/örnek başlatır

### 👁 Önizleme — `davetiye_preview.html`
Davetiyenin kendisi. Tek başına `?op=OP-…` ile açılıp **`data/` klasöründen veriyi çeker**, tam ekran oynatır.

---

## 📁 Klasör Yapısı

```
davetiye-sistemi/
├── index.html                 # Ana liste (katalog)
├── davetiye_editor.html       # Davetiye editörü
├── davetiye_preview.html      # Davetiye şablonu / önizleme
├── server.js                  # Node sunucusu (statik + API)
├── baslat.bat                 # Windows tek-tık başlatıcı
├── data/                      # 📂 Davetiye verileri (JSON, dolu)
│   └── OP-260706-1004.json    # Örnek davetiye verisi
├── cikti/                     # 🖼 Üretilen HTML davetiyeler (git'ten hariç)
├── import/                    # 📥 İçe aktarma klasörü (JSON/HTML koy)
└── _yedek/                    # Güvenli yedek kopya (git'ten hariç)
```

| Klasör / Dosya | Görevi |
|---|---|
| `data/` | Her davetiyenin tam JSON verisi. Yeni kayıt otomatik OP no alır (`OP-YYMMDD-XXXX`). |
| `cikti/` | Üretilen tek dosya HTML davetiyeler. Müşteriye/kitaba verilen ürün. |
| `import/` | Eski/mevcut davetiyeleri buraya koyup editörden **İçe Aktar** ile yükleme. |
| `_yedek/` | Sistemin çalışan halinin kopyası + geri yükleme talimatı. |

---

## 🌐 Sunucu API'si (`server.js`)

| Endpoint | Yöntem | Açıklama |
|---|---|---|
| `/` | GET | `index.html` |
| `/list?dir=data&meta=1` | GET | Belirtilen klasördeki dosyaları listeler; `meta=1` kartlar için özet meta üretir |
| `/save` | POST | `{name:"data/OP-…json", content:"…"}` — belirtilen klasöre yazar |
| `/delete` | POST | `{name:"data/OP-…json"}` — dosyayı siler |
| `/gen?op=OP-…` | GET | `cikti/` klasörüne HTML davetiyesi üretir |

İzinli klasörler: kök, `data/`, `cikti/`, `import/`, `_yedek/`. Windows yasaklı karakterlere ve yükleme (`..`) içeren adlara karşı korumalıdır.

---

## 🧩 Notlar

- **Fontlar:** Başlık, gövde ve Arapça yazı tipleri (Marcellus, Raleway, Amiri vb.) Google Fonts ile yüklenir; JSON'da tutulur.
- **Görsel/video/müzik:** Dosya seçimleri **base64** olarak veriye gömülür → üretilen HTML tamamen taşınabilir tek dosya olur.
- **İlk adım sonrası (Phase 2/3):** Davetiyelerin bir kitaba (yayın/arşiv) yüklenmesi planlanmış geliştirmelerdir.

---

## 🔗 Canlı Siteden GitHub'a Kaydetme

GitHub Pages statik olduğu için `/save` çalışmaz. Bunun yerine sistem **GitHub Contents API**'sini kullanır:

1. Editörde **🔗 GitHub** düğmesine bas.
2. Bir **kişisel erişim (PAT) token'ı** oluştur: `github.com/settings/tokens` → **repo** yetkisi ver.
3. Token'ı yapıştır → **Bağlan** (yalnızca tarayıcının localStorage'ında saklanır, repo'ya yazılmaz).
4. Artık **💾 data/ Kaydet** butonu dosyayı doğrudan `import/` klasörüne commit eder; **🚀 cikti/ HTML** da aynı şekilde repo'ya gider.
5. Ana liste (`index.html`) GitHub bağlıysa dosyaları canlı GitHub'dan listeler; bağlı değilse `list_fallback.json`'u kullanır.

> 🔒 Güvenlik: PAT token'ı yalnızca tarayıcında gizli tutulur ve yalnızca senin oturumunda çalışır. Bir başkası sayfayı açsa dahi token'ı görmez.

### Medya (video / görsel / müzik)

- Dosyalar **base64** olarak davetiye verisine gömülür; böylece üretilen HTML tek dosya olarak taşınabilir kalır.
- Tek dosya GitHub API limiti **100 MB**'tır (base64'e çevrilince ~75 MB video sığar).
- Repo önerilen boyut **~1 GB** (5 GB sert limit). Büyük videolarda repo şişer; büyük arşiv için yerel akış + ayrı repo önerilir.

---

## 🔁 Git

```bash
git add -A
git commit -m "değişiklik özeti"
git push origin main
```