# Format Pesan Chat Widget

## Overview
Widget sekarang mendukung **Markdown formatting** untuk menampilkan pesan dengan format yang lebih rich (bold, italic, list, code, dll).

## Format yang Didukung

### 1. **Line Breaks (Enter)**
```
Baris pertama
Baris kedua

Paragraf baru setelah baris kosong
```

### 2. **Bold Text**
```markdown
**Teks ini akan tebal**
__Atau menggunakan underscore__
```
Contoh: **Penting:** Dokumen harus lengkap

### 3. **Italic Text**
```markdown
*Teks ini akan miring*
_Atau menggunakan underscore_
```
Contoh: *Catatan*: Proses займет 3 hari kerja

### 4. **Numbered List (Numbering)**
```markdown
1. Langkah pertama
2. Langkah kedua
3. Langkah ketiga
```

Hasil:
1. Langkah pertama
2. Langkah kedua
3. Langkah ketiga

### 5. **Bullet List**
```markdown
- Item pertama
- Item kedua
- Item ketiga
```

Atau:
```markdown
* Item pertama
* Item kedua
* Item ketiga
```

### 6. **Kombinasi Bold & List**
```markdown
**Dokumen yang diperlukan:**
1. KTP
2. NPWP
3. Akta Perusahaan

**Catatan:** Semua dokumen harus asli
```

### 7. **Code / Inline Code**
```markdown
Gunakan command `npm install` untuk instalasi
```

### 8. **Code Block**
````markdown
```
npm install
npm run dev
```
````

### 9. **Headings**
```markdown
# Heading 1
## Heading 2
### Heading 3
```

### 10. **Blockquote**
```markdown
> Ini adalah catatan penting
> yang perlu diperhatikan
```

### 11. **Horizontal Line**
```markdown
---
```

## Contoh Pesan dari Backend/WebSocket

### Contoh 1: Panduan Step-by-Step
```json
{
  "id": "msg-123",
  "content": "Berikut langkah-langkah mengurus NIB:\n\n1. Login ke https://oss.go.id\n2. Pilih menu **NIB Baru**\n3. Isi formulir dengan lengkap\n4. Upload dokumen persyaratan\n5. Submit dan tunggu verifikasi\n\n**Dokumen yang diperlukan:**\n- KTP Direktur\n- NPWP Perusahaan\n- Akta Pendirian\n\n*Proses займет 1-3 hari kerja*",
  "sender": "admin",
  "type": "text",
  "timestamp": "2025-10-23T10:30:00Z"
}
```

### Contoh 2: Informasi dengan Emphasis
```json
{
  "id": "msg-124",
  "content": "**PENTING:** Permohonan Anda sedang diproses.\n\nStatus saat ini: *Menunggu Verifikasi Dokumen*\n\nSilakan cek email Anda secara berkala untuk update status.",
  "sender": "admin",
  "type": "text",
  "timestamp": "2025-10-23T10:35:00Z"
}
```

### Contoh 3: FAQ dengan Formatting
```json
{
  "id": "msg-125",
  "content": "### Pertanyaan: Berapa biaya pengurusan NIB?\n\n**Jawaban:** Pengurusan NIB melalui OSS adalah **GRATIS**.\n\nJika ada pihak yang meminta biaya, silakan laporkan ke:\n- Email: `pengaduan@oss.go.id`\n- Telp: **150**",
  "sender": "admin",
  "type": "text",
  "timestamp": "2025-10-23T10:40:00Z"
}
```

## Update Backend/WebSocket

### Backend Go (livechat-be & livechat-ws)

Pesan yang dikirim dari backend sudah otomatis support markdown jika menggunakan string dengan `\n` untuk line break:

```go
// Contoh di backend
message := models.ChatMessage{
    Content: "Berikut langkahnya:\n\n1. Login ke OSS\n2. Pilih menu NIB\n3. Isi formulir\n\n**Penting:** Siapkan dokumen",
    SenderType: "admin",
    Type: "text",
}
```

### WebSocket Message Format

Format WebSocket message tetap sama, hanya content-nya yang menggunakan markdown:

```json
{
  "type": "message",
  "payload": {
    "id": "msg-123",
    "sessionId": "session-456",
    "content": "**Halo!** Terima kasih telah menghubungi kami.\n\nAda yang bisa saya bantu?",
    "sender": "admin",
    "senderType": "admin",
    "type": "text",
    "timestamp": "2025-10-23T10:30:00Z"
  }
}
```

## Tips untuk Admin/Agent

1. **Gunakan line breaks** untuk readability yang lebih baik
2. **Bold** untuk menekankan hal penting
3. **Numbering** untuk step-by-step instructions
4. **Bullet points** untuk list items
5. **Italic** untuk catatan atau emphasis ringan

## Migration dari Format Lama

Jika Anda sudah punya pesan dengan format plain text, tidak perlu khawatir! Pesan plain text akan tetap ditampilkan dengan benar. Markdown adalah backward compatible.

**Plain text:**
```
Langkah 1: Login
Langkah 2: Pilih menu
```

Akan tetap ditampilkan normal, tapi lebih baik menggunakan:

**Dengan markdown:**
```markdown
1. Login
2. Pilih menu
```

## Testing

Untuk testing, Anda bisa mengirim pesan dengan format markdown dari admin panel atau WebSocket client, dan widget akan secara otomatis render dengan formatting yang benar.
