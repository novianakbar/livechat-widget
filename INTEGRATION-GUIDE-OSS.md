# Panduan Integrasi LiveChat Widget OSS

## Tentang Widget

LiveChat Widget OSS adalah solusi chat support khusus untuk sistem Online Single Submission (OSS) Perizinan Berusaha. Widget ini memungkinkan pengguna website OSS untuk mendapatkan bantuan langsung dari admin terkait pertanyaan perizinan berusaha.

## Fitur Utama

- ✅ Form khusus untuk data perusahaan/usaha
- ✅ Pertanyaan cepat seputar OSS yang sering ditanyakan
- ✅ Integrasi dengan backend Go untuk real-time chat
- ✅ Upload dokumen untuk bantuan perizinan
- ✅ Responsif untuk desktop dan mobile
- ✅ Branding khusus OSS dengan warna dan logo yang sesuai

## Instalasi

### 1. Build Widget

```bash
npm install
npm run build
```

File hasil build akan ada di folder `dist/`.

### 2. Hosting Widget

Upload file dari folder `dist/` ke web server Anda atau CDN.

### 3. Integrasi ke Website OSS

Tambahkan script berikut di halaman website OSS Anda sebelum closing tag `</body>`:

```html
<!-- Tambahkan di dalam <head> -->
<link rel="stylesheet" href="https://your-domain.com/path-to-widget/style.css">

<!-- Tambahkan sebelum </body> -->
<div id="livechat-widget"></div>
<script src="https://your-domain.com/path-to-widget/widget.js"></script>
<script>
  // Inisialisasi widget
  const widget = new LiveChatWidget({
    apiUrl: 'http://localhost:8080/api', // URL backend Anda
    widgetTitle: 'Bantuan OSS Perizinan Berusaha',
    welcomeMessage: 'Dapatkan bantuan untuk pengurusan izin berusaha Anda',
    primaryColor: '#3B82F6', // Warna brand OSS
    position: 'bottom-right',
    allowFileUpload: true,
    autoOpen: false
  });
  
  // Mount widget ke DOM
  widget.mount('#livechat-widget');
</script>
```

## Konfigurasi

### Opsi Konfigurasi

```typescript
interface WidgetConfig {
  apiUrl?: string;              // URL backend API
  widgetTitle: string;          // Judul widget
  welcomeMessage: string;       // Pesan selamat datang
  primaryColor: string;         // Warna utama (hex)
  position: 'bottom-right' | 'bottom-left'; // Posisi widget
  allowFileUpload: boolean;     // Izinkan upload file
  autoOpen?: boolean;          // Buka otomatis saat load
  showAgentInfo?: boolean;     // Tampilkan info admin
}
```

### Contoh Konfigurasi Khusus OSS

```javascript
const ossConfig = {
  apiUrl: 'https://api-oss.yoursite.com/api',
  widgetTitle: 'Bantuan OSS Perizinan Berusaha',
  welcomeMessage: 'Selamat datang di layanan bantuan OSS. Tim kami siap membantu Anda dengan pengurusan perizinan berusaha.',
  primaryColor: '#1E40AF', // Biru OSS
  position: 'bottom-right',
  allowFileUpload: true,
  autoOpen: false,
  showAgentInfo: true
};
```

## Pertanyaan Cepat yang Tersedia

Widget ini dilengkapi dengan pertanyaan cepat yang umum ditanyakan seputar OSS:

1. "Bagaimana cara mengurus NIB (Nomor Induk Berusaha)?"
2. "Berapa lama proses penerbitan izin usaha?"
3. "Dokumen apa saja yang diperlukan untuk izin usaha?"
4. "Apakah ada biaya untuk mengurus perizinan?"
5. "Bagaimana cara cek status permohonan saya?"
6. "Apa beda NIB dengan izin usaha lainnya?"
7. "Bisa bantu saya dengan masalah login OSS?"
8. "Izin apa saja yang diperlukan untuk usaha perdagangan?"

## Integrasi dengan Backend

Widget ini terhubung dengan backend Go melalui API endpoints:

- `POST /api/public/chat/start` - Memulai sesi chat
- `POST /api/public/chat/message` - Mengirim pesan
- `GET /api/public/chat/session/{id}/messages` - Mengambil riwayat chat
- `POST /api/public/chat/upload` - Upload file

### Environment Variables

Buat file `.env` di root project widget:

```bash
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

## Customization CSS

Untuk menyesuaikan tampilan widget dengan desain website OSS:

```css
/* Override warna widget */
.chat-widget-header {
  background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%) !important;
}

.quick-question-btn:hover {
  background: #1E40AF !important;
}

/* Tambahkan logo OSS */
.oss-branding::before {
  content: '';
  background: url('/path/to/oss-logo.png') no-repeat;
  background-size: contain;
  width: 24px;
  height: 24px;
  display: inline-block;
  margin-right: 8px;
}
```

## Deployment Production

### 1. Build untuk Production

```bash
npm run build
```

### 2. Konfigurasi Server

Pastikan server backend berjalan dan dapat diakses dari domain widget.

### 3. CORS Configuration

Pastikan backend dikonfigurasi untuk menerima request dari domain website OSS:

```go
// Di main.go
app.Use(cors.New(cors.Config{
    AllowOrigins: "https://oss.yoursite.com,https://yoursite.com",
    AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
    AllowHeaders: "Origin,Content-Type,Accept,Authorization",
}))
```

### 4. SSL/HTTPS

Pastikan widget dan backend menggunakan HTTPS untuk keamanan data.

## Troubleshooting

### Widget Tidak Muncul

1. Pastikan file CSS dan JS sudah dimuat dengan benar
2. Cek console browser untuk error JavaScript
3. Pastikan element dengan ID yang sesuai tersedia

### Chat Tidak Terkirim

1. Cek koneksi ke backend API
2. Pastikan CORS dikonfigurasi dengan benar
3. Periksa format request dan response API

### File Upload Gagal

1. Pastikan backend mendukung multipart form data
2. Cek ukuran maksimal file yang diizinkan
3. Pastikan format file didukung

## Support

Untuk bantuan teknis lebih lanjut:
- Email: support@yoursite.com
- Dokumentasi API: `/docs/API_Documentation.md`
- Repository: https://github.com/yourrepo/livechat
