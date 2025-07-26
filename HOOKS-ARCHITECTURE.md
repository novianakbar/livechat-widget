# Chat Widget Hooks Architecture

## Overview

Hook `useChatWidget` yang sebelumnya memiliki 500+ baris kode telah di-refactor menjadi beberapa hook yang lebih kecil dan mudah dimaintain. Setiap hook memiliki tanggung jawab yang spesifik sesuai dengan Single Responsibility Principle.

## Struktur Hook

### 1. `useWidgetState.ts`
**Tanggung jawab**: Mengelola state UI widget (open/close, unread count, typing, admin info)

```typescript
interface WidgetState {
  isOpen: boolean;
  unreadCount: number;
  isTyping: boolean;
  assignedAdmin: { name: string; isOnline: boolean } | null;
}
```

**Actions**: `toggleWidget`, `openWidget`, `closeWidget`, `incrementUnreadCount`, `setTyping`, dll.

### 2. `useChatSession.ts`
**Tanggung jawab**: Mengelola sesi chat (start, load, update session)

**Key functions**:
- `startChat()`: Memulai sesi chat baru
- `loadSession()`: Memuat sesi chat yang sudah ada
- `updateSession()`: Update data sesi

### 3. `useChatMessages.ts`
**Tanggung jawab**: Mengelola pesan dalam chat (add, send, upload file)

**Key functions**:
- `sendMessage()`: Mengirim pesan text
- `uploadFile()`: Upload file
- `addMessage()`: Menambah pesan ke state
- `addWelcomeMessage()`: Menambah pesan welcome

### 4. `useChatHistory.ts`
**Tanggung jawab**: Mengelola riwayat chat (load history, caching)

**Key functions**:
- `loadChatHistory()`: Load riwayat chat dari API
- `loadHistoryIfNeeded()`: Auto-load jika belum dimuat
- `resetChatHistory()`: Reset cache history

### 5. `useWebSocketConnection.ts`
**Tanggung jawab**: Mengelola status koneksi WebSocket (enable/disable)

**Key functions**:
- `enableConnection()`: Aktifkan koneksi WebSocket
- `disableConnection()`: Matikan koneksi WebSocket

### 6. `useWebSocket.ts`
**Tanggung jawab**: Mengelola koneksi WebSocket real-time (connect, message handling, reconnect)

**Key features**:
- Auto-reconnect dengan timeout
- Message handling (new_message, typing_indicator, session_update)
- Typing indicators
- Proper cleanup

### 7. `useChatWidgetNew.ts` (Main Hook)
**Tanggung jawab**: Komposisi semua hook dan providing interface yang sama seperti hook lama

**Menggunakan**:
- Semua hook di atas dengan dependency injection pattern
- Callback functions untuk communication antar hook
- Compatibility layer untuk mempertahankan API yang sama

## Keuntungan Arsitektur Baru

### 1. **Maintainability**
- Setiap hook memiliki tanggung jawab yang jelas
- Kode lebih mudah dibaca dan dipahami
- Debugging lebih mudah karena scope yang lebih kecil

### 2. **Testability**
- Setiap hook dapat ditest secara isolated
- Mock dependencies lebih mudah
- Unit test lebih focused

### 3. **Reusability**
- Hook-hook individual dapat digunakan di komponen lain
- Misalnya `useWebSocket` bisa digunakan untuk fitur lain yang butuh real-time

### 4. **Separation of Concerns**
- UI state terpisah dari business logic
- WebSocket logic terpisah dari message handling
- API calls terpisah dari state management

### 5. **Easier Debugging**
- Error handling per concern
- Clearer error messages
- Easier to track which part fails

## Migration Guide

### ✅ Migration Complete

Refactor telah selesai dan hook baru sudah aktif:

```typescript
// Hook utama sudah menggunakan arsitektur baru
import { useChatWidget } from './hooks/useChatWidget';

function ChatWidget() {
  const { chatState, messages, isLoading, error, actions } = useChatWidget();
  // Interface sama, implementasi sudah dioptimasi
}
```

### Rollback (jika diperlukan)

Jika ada masalah, file backup tersedia:
```bash
cd src/hooks
mv useChatWidget.ts useChatWidget-refactored.ts
mv useChatWidget.ts.backup useChatWidget.ts
```

### Menggunakan Hook Individual (Opsional)

Jika ingin menggunakan hook individual untuk kebutuhan spesifik:

```typescript
import { useWidgetState } from './hooks/useWidgetState';
import { useChatMessages } from './hooks/useChatMessages';

function MyComponent() {
  const { state, actions } = useWidgetState();
  const { messages, actions: messageActions } = useChatMessages();
  
  // Custom logic here
}
```

## File Structure

```
src/hooks/
├── useChatWidget.ts          # Hook utama (hasil refactor)
├── useChatWidget.ts.backup   # Hook lama (untuk backup)
├── useWidgetState.ts         # UI state management
├── useChatSession.ts         # Session management
├── useChatMessages.ts        # Message management
├── useChatHistory.ts         # History management
├── useWebSocketConnection.ts # Connection state
├── useWebSocket.ts           # WebSocket implementation (optimized)
└── useNotifications.ts       # Notification hooks (existing)
```

## Optimizations Applied

### 1. **WebSocket Performance**
- **Problem**: Infinite loop reconnections caused by dependency issues
- **Solution**: Used refs for callback functions to prevent stale closures
- **Result**: WebSocket effect now only runs when session, isOpen, or shouldMaintainConnection actually changes

### 2. **Dependency Management**
- **Problem**: Functions in dependency arrays causing unnecessary re-renders
- **Solution**: Moved callback logic inline and used refs for dynamic values
- **Result**: Minimal re-renders, stable performance

### 3. **Memory Management**
- **Problem**: Multiple WebSocket instances and memory leaks
- **Solution**: Proper cleanup with refs and state management
- **Result**: Single WebSocket instance per session, clean disconnections

## Best Practices

### 1. **Hook Dependencies**
- Gunakan `useCallback` untuk functions yang di-pass sebagai dependencies
- Avoid circular dependencies antar hook

### 2. **Error Handling**
- Setiap hook handle error di level mereka sendiri
- Propagate critical errors ke main hook

### 3. **State Updates**
- Use functional updates `setState(prev => ({ ...prev, newValue }))`
- Batch updates ketika mungkin

### 4. **Cleanup**
- Setiap hook bertanggung jawab cleanup resource mereka sendiri
- WebSocket cleanup di `useWebSocket`
- Timeout cleanup di setiap hook yang menggunakan

### 5. **TypeScript**
- Strict typing untuk semua interfaces
- Avoid `any` types
- Use proper generic types untuk reusability

## Testing Strategy

### Unit Tests per Hook
- `useWidgetState`: Test state transitions
- `useChatMessages`: Test message operations
- `useWebSocket`: Test connection logic (dengan mock WebSocket)
- `useChatSession`: Test API integration (dengan mock API)

### Integration Tests
- Test main hook dengan semua dependencies
- Test real WebSocket communication
- Test error scenarios

## Performance Considerations

### 1. **Memoization**
- Callbacks di-memoize dengan `useCallback`
- Expensive computations dengan `useMemo`

### 2. **Conditional Effects**
- WebSocket hanya connect ketika diperlukan
- History loading hanya ketika widget dibuka

### 3. **Cleanup**
- Proper cleanup untuk prevent memory leaks
- Clear timeouts dan intervals

Arsitektur baru ini memberikan foundation yang solid untuk pengembangan dan maintenance jangka panjang.
