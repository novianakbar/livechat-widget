/* eslint-disable @typescript-eslint/no-explicit-any */
import io from 'socket.io-client';
import type { Message, Admin } from '../types/chat';

export class WebSocketService {
  private socket: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(customerId: string, sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, {
          auth: {
            customerId,
            sessionId,
            userType: 'customer',
          },
          transports: ['websocket'],
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason: any) => {
          console.log('WebSocket disconnected:', reason);
          this.handleReconnect();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // Send message
  sendMessage(sessionId: string, content: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:send', {
        sessionId,
        content,
        sender: 'customer',
        timestamp: new Date(),
      });
    }
  }

  // Send typing indicator
  startTyping(sessionId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing:start', { sessionId });
    }
  }

  stopTyping(sessionId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing:stop', { sessionId });
    }
  }

  // Mark message as read
  markAsRead(sessionId: string, messageId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:read', { sessionId, messageId });
    }
  }

  // Event listeners
  onMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  onTypingStart(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('typing:start', callback);
    }
  }

  onTypingStop(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('typing:stop', callback);
    }
  }

  onAdminAssigned(callback: (admin: Admin) => void): void {
    if (this.socket) {
      this.socket.on('session:assigned', callback);
    }
  }

  onSessionClosed(callback: () => void): void {
    if (this.socket) {
      this.socket.on('session:closed', callback);
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
