# Panduan Lengkap Integrasi Sistem Livechat OSS

Dokumen ini menjelaskan cara mengintegrasikan dan menjalankan ketiga komponen sistem livechat untuk bantuan OSS perizinan berusaha:

1. **livechat-be** - Backend API dan WebSocket server
2. **livechat-admin** - Dashboard admin untuk handle chat
3. **livechat-widget** - Widget customer untuk embed di website

## 🏗️ Arsitektur Sistem

```
Website OSS ←→ livechat-widget ←→ livechat-be ←→ livechat-admin
     ↑              ↑                  ↑              ↑
  Customer      Widget UI         API/WebSocket    Admin UI
```

## 📋 Persyaratan Sistem

- Node.js 18+
- PostgreSQL 14+
- Redis (untuk session dan caching)
- Nginx (untuk production deployment)

## 🚀 Setup dan Instalasi

### 1. Setup livechat-be (Backend)

```bash
cd livechat-be

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi database dan Redis

# Setup database
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# Run development
npm run dev
```

Environment variables untuk `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/livechat_oss"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
PORT=8000
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf,application/msword,text/plain"
```

### 2. Setup livechat-admin (Admin Dashboard)

```bash
cd livechat-admin

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local

# Run development
npm run dev
```

Environment variables untuk `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 3. Setup livechat-widget (Customer Widget)

```bash
cd livechat-widget

# Install dependencies
npm install

# Run development
npm run dev

# Build for production
npm run build
```

## 🔧 Konfigurasi Integrasi

### Database Schema (livechat-be)

Sistem menggunakan tabel utama:
- `admins` - Data admin dan authentication
- `customers` - Data customer yang chat
- `chat_sessions` - Sesi chat antara customer dan admin
- `messages` - Pesan dalam chat
- `files` - Metadata file yang diupload

### API Endpoints

Backend menyediakan API endpoints:

**Authentication:**
- `POST /api/auth/login` - Login admin
- `POST /api/auth/logout` - Logout admin
- `GET /api/auth/me` - Get current admin info

**Chat Management:**
- `GET /api/chat-sessions` - List chat sessions
- `GET /api/chat-sessions/:id` - Get chat session detail
- `PATCH /api/chat-sessions/:id/assign` - Assign session to admin
- `PATCH /api/chat-sessions/:id/close` - Close chat session

**Customer & Messages:**
- `POST /api/customers` - Register new customer
- `POST /api/chat-sessions` - Start new chat session
- `POST /api/chat-sessions/:id/messages` - Send text message
- `POST /api/chat-sessions/:id/messages/file` - Upload file message

**Widget Configuration:**
- `GET /api/widget/config` - Get widget configuration

### WebSocket Events

Real-time communication menggunakan Socket.IO:

**Customer Events:**
- `message:send` - Customer kirim pesan
- `typing:start` - Customer mulai mengetik  
- `typing:stop` - Customer berhenti mengetik

**Admin Events:**
- `message:send` - Admin kirim pesan
- `session:assign` - Admin assign ke session
- `session:close` - Admin tutup session
- `typing:start` - Admin mulai mengetik
- `typing:stop` - Admin berhenti mengetik

**Broadcast Events:**
- `message:new` - Pesan baru untuk semua peserta
- `session:assigned` - Session di-assign ke admin
- `session:closed` - Session ditutup
- `admin:online` - Admin online
- `admin:offline` - Admin offline

## 🌐 Embedding Widget di Website

### Metode 1: Script Tag Langsung

Tambahkan ke halaman website OSS:

```html
<!-- Konfigurasi widget -->
<script>
window.LivechatOSSConfig = {
  apiUrl: 'https://your-api-domain.com',
  websocketUrl: 'https://your-api-domain.com',
  widgetTitle: 'Bantuan OSS Perizinan',
  welcomeMessage: 'Selamat datang! Bagaimana kami bisa membantu perizinan berusaha Anda?',
  primaryColor: '#3B82F6',
  position: 'bottom-right',
  allowFileUpload: true,
  maxFileSize: 10,
  allowedFileTypes: ['image/*', '.pdf', '.doc', '.docx', '.txt']
};
</script>

<!-- Load widget -->
<script src="https://your-cdn.com/livechat-oss-widget.umd.js"></script>
```

### Metode 2: Manual Init

```html
<script>
window.LivechatOSSConfig = { /* config */ };
</script>
<script src="https://your-cdn.com/livechat-oss-widget.umd.js" data-manual-init="true"></script>
<script>
// Initialize sesuai kebutuhan
window.initLivechatOSSWidget();
</script>
```

## 🚀 Production Deployment

### 1. Build semua komponen

```bash
# Backend
cd livechat-be
npm run build

# Admin
cd livechat-admin  
npm run build

# Widget
cd livechat-widget
npm run build
```

### 2. Setup Nginx Configuration

```nginx
# /etc/nginx/sites-available/livechat-oss
server {
    listen 80;
    server_name api-livechat-oss.yourdomain.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name admin-livechat-oss.yourdomain.com;
    
    # Admin Dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name cdn-livechat-oss.yourdomain.com;
    
    # Widget CDN
    root /var/www/livechat-widget/dist;
    
    location / {
        try_files $uri $uri/ =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }
}
```

### 3. Setup PM2 untuk Process Management

```bash
# Install PM2
npm install -g pm2

# Start backend
cd livechat-be
pm2 start npm --name "livechat-be" -- run start

# Start admin
cd livechat-admin
pm2 start npm --name "livechat-admin" -- run start

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Setup SSL dengan Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificates
sudo certbot --nginx -d api-livechat-oss.yourdomain.com
sudo certbot --nginx -d admin-livechat-oss.yourdomain.com  
sudo certbot --nginx -d cdn-livechat-oss.yourdomain.com
```

## 🔍 Testing dan Debugging

### 1. Testing Backend API

```bash
# Test customer registration
curl -X POST http://localhost:8000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"08123456789"}'

# Test admin login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \  
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 2. Testing WebSocket Connection

```javascript
// Browser console
const socket = io('http://localhost:8000');
socket.on('connect', () => console.log('Connected!'));
socket.emit('join_room', { sessionId: 'test-session' });
```

### 3. Testing Widget Integration

Buka `http://localhost:5173/public/demo.html` untuk demo widget.

## 📊 Monitoring dan Analytics

### 1. Log Monitoring

Backend menggunakan Winston untuk logging:
- Request/Response logs
- Error logs  
- Chat activity logs
- File upload logs

### 2. Database Monitoring

Monitor performa database:
```sql
-- Active chat sessions
SELECT COUNT(*) FROM chat_sessions WHERE status = 'active';

-- Messages per day
SELECT DATE(created_at), COUNT(*) 
FROM messages 
WHERE created_at >= NOW() - INTERVAL 7 DAY
GROUP BY DATE(created_at);

-- Average response time
SELECT AVG(TIMESTAMPDIFF(SECOND, customer_msg.created_at, admin_msg.created_at)) as avg_response_time
FROM messages customer_msg
JOIN messages admin_msg ON admin_msg.session_id = customer_msg.session_id
WHERE customer_msg.sender = 'customer' 
AND admin_msg.sender = 'admin'
AND admin_msg.created_at > customer_msg.created_at;
```

## 🔧 Maintenance dan Updates

### 1. Backup Database

```bash
# Automated backup script
pg_dump livechat_oss > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Update Components

```bash
# Update backend
cd livechat-be
git pull origin main
npm install
npm run build
pm2 restart livechat-be

# Update admin
cd livechat-admin
git pull origin main
npm install  
npm run build
pm2 restart livechat-admin

# Update widget
cd livechat-widget
git pull origin main
npm install
npm run build
# Copy dist files to CDN server
```

## 🆘 Troubleshooting

### Common Issues

**1. WebSocket Connection Failed**
- Check CORS configuration
- Verify firewall settings
- Test with different browser

**2. Widget Not Loading**
- Check script URL accessibility
- Verify content-type headers
- Check for JavaScript console errors

**3. Database Connection Issues**
- Verify PostgreSQL service status
- Check connection string
- Test database connectivity

**4. File Upload Problems**
- Check file size limits
- Verify upload directory permissions
- Check allowed file types configuration

## 📞 Support dan Kontak

Untuk bantuan teknis atau pertanyaan integrasi:
- Buka issue di repository GitHub
- Email: tech-support@your-domain.com  
- Documentation: https://docs.livechat-oss.yourdomain.com

---

## 🔄 Ringkasan Integrasi

1. **Setup Backend** dengan database dan Redis
2. **Setup Admin Dashboard** dengan konfigurasi API endpoint
3. **Build Widget** untuk production  
4. **Deploy semua komponen** dengan Nginx reverse proxy
5. **Embed widget** di website OSS dengan konfigurasi yang sesuai
6. **Test** semua funktionalitas end-to-end
7. **Monitor** dan maintain sistem secara berkala

Sistem akan memberikan dukungan chat real-time yang terintegrasi penuh untuk membantu pengguna dengan perizinan berusaha OSS.
