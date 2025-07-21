# Livechat OSS Widget

Widget chat customer untuk sistem bantuan OSS (Online Single Submission) perizinan berusaha. Widget ini dapat di-embed ke dalam website apapun untuk menyediakan dukungan chat real-time kepada pengguna.

## Fitur

- ✨ Widget chat yang mudah di-embed
- 💬 Chat real-time menggunakan WebSocket
- 📱 Responsive design untuk desktop dan mobile
- 📎 Support upload file dan gambar
- 🎨 Customizable appearance dan branding
- 🔔 Notifikasi unread messages
- ⌨️ Typing indicators
- 📝 Form registrasi customer otomatis
- 🎯 Khusus untuk bantuan OSS perizinan berusaha

## Instalasi dan Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

```bash
npm run dev
```

### 3. Build untuk Production

```bash
npm run build
```

File build akan ada di folder `dist/` dan siap untuk di-deploy.

## Cara Embed di Website

### Metode 1: Script Tag Langsung (Recommended)

Tambahkan script berikut ke dalam website Anda:

```html
<!-- Konfigurasi widget (opsional) -->
<script>
window.LivechatOSSConfig = {
  apiUrl: 'https://api-livechat-oss.yourdomain.com',
  websocketUrl: 'https://ws-livechat-oss.yourdomain.com',
  widgetTitle: 'Bantuan OSS',
  welcomeMessage: 'Selamat datang! Bagaimana kami bisa membantu perizinan berusaha Anda?',
  primaryColor: '#3B82F6',
  position: 'bottom-right', // atau 'bottom-left'
  allowFileUpload: true,
  maxFileSize: 10, // MB
  allowedFileTypes: ['image/*', '.pdf', '.doc', '.docx', '.txt']
};
</script>

<!-- Load widget script -->
<script src="https://cdn.yourdomain.com/livechat-oss-widget.umd.js"></script>
```

### Metode 2: Manual Initialization

```html
<!-- Konfigurasi -->
<script>
window.LivechatOSSConfig = { /* konfigurasi di atas */ };
</script>

<!-- Load script tanpa auto-init -->
<script src="https://cdn.yourdomain.com/livechat-oss-widget.umd.js" data-manual-init="true"></script>

<!-- Manual initialization -->
<script>
// Initialize kapan saja dibutuhkan
document.addEventListener('DOMContentLoaded', function() {
  window.initLivechatOSSWidget();
});
</script>
```

## Konfigurasi Widget

Widget dapat dikustomisasi dengan mengatur `window.LivechatOSSConfig`:

```javascript
window.LivechatOSSConfig = {
  // API Configuration
  apiUrl: 'http://localhost:8000',              // Backend API URL
  websocketUrl: 'http://localhost:8000',        // WebSocket URL
  
  // UI Configuration  
  widgetTitle: 'Bantuan OSS',                   // Title di header widget
  welcomeMessage: 'Selamat datang! ...',       // Pesan welcome
  primaryColor: '#3B82F6',                      // Warna primary (hex)
  position: 'bottom-right',                     // 'bottom-right' atau 'bottom-left'
  
  // Feature Configuration
  allowFileUpload: true,                        // Enable/disable upload file
  showTypingIndicator: true,                    // Show typing indicator
  maxFileSize: 10,                             // Max file size dalam MB
  allowedFileTypes: [                          // Tipe file yang diizinkan
    'image/*', 
    '.pdf', 
    '.doc', 
    '.docx', 
    '.txt'
  ]
};
```

## Integrasi Backend

Widget ini terintegrasi dengan:

- **livechat-be**: Backend API untuk chat management
- **livechat-admin**: Dashboard admin untuk handle chat

### API Endpoints yang Digunakan:

- `POST /api/customers` - Registrasi customer baru
- `POST /api/chat-sessions` - Mulai sesi chat baru  
- `GET /api/chat-sessions/:id` - Get detail sesi chat
- `POST /api/chat-sessions/:id/messages` - Kirim pesan text
- `POST /api/chat-sessions/:id/messages/file` - Upload file
- `PATCH /api/chat-sessions/:id/close` - Tutup sesi chat
- `GET /api/widget/config` - Get konfigurasi widget

### WebSocket Events:

- `message:new` - Pesan baru dari admin
- `message:read` - Pesan dibaca  
- `typing:start` - Admin mulai mengetik
- `typing:stop` - Admin berhenti mengetik
- `session:assigned` - Admin assigned ke sesi
- `session:closed` - Sesi ditutup admin

## Development

### Struktur Project

```
src/
├── components/
│   ├── ChatWidget.tsx      # Komponen utama widget
│   └── ChatWidget.css      # Styling widget
├── hooks/
│   └── useChatWidget.ts    # React hook untuk chat logic
├── services/
│   ├── api.ts             # API client
│   └── websocket.ts       # WebSocket service
├── types/
│   └── chat.ts            # TypeScript types
├── App.tsx                # App component
└── main.tsx               # Entry point & embedding logic
```

### Scripts

- `npm run dev` - Development server
- `npm run build` - Build untuk production
- `npm run preview` - Preview build production
- `npm run lint` - Check linting

### Teknologi

- **React 18** dengan TypeScript
- **Vite** untuk build tooling
- **Socket.IO Client** untuk WebSocket
- **Axios** untuk HTTP requests
- **Lucide React** untuk icons
- **CSS Modules** untuk styling

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## License

MIT License - lihat file LICENSE untuk detail.

## Support

Untuk bantuan teknis atau pertanyaan, silakan buka issue di repository ini.
