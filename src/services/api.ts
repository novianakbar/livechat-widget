const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface StartChatRequest {
  company_name: string;
  person_name: string;
  email: string;
  phone?: string;
  topic: string;
}

export interface StartChatResponse {
  session_id: string;
  status: string;
  message: string;
}

export interface SendMessageRequest {
  session_id: string;
  message: string;
  message_type?: 'text' | 'image' | 'file';
}

export interface SendMessageResponse {
  message_id: string;
  status: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender_type: 'customer' | 'agent' | 'system';
  message_type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
}

class ChatAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  async startChat(request: StartChatRequest): Promise<StartChatResponse> {
    const response = await this.request<{ data: StartChatResponse }>('/public/chat/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.data;
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await this.request<{ data: SendMessageResponse }>('/public/chat/message', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.data;
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await this.request<{ data: ChatMessage[] }>(
      `/public/chat/session/${sessionId}/messages`
    );

    return response.data;
  }

  async uploadFile(sessionId: string, file: File): Promise<{ file_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    const response = await fetch(`${API_BASE_URL}/public/chat/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Upload failed');
    }

    return data.data;
  }
}

export const chatAPI = new ChatAPI();
