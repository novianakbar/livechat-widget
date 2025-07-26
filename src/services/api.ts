const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// New API interfaces based on OSS API documentation
export interface StartChatRequest {
  browser_uuid?: string; // For anonymous users
  oss_user_id?: string; // For logged-in users
  email?: string; // For logged-in users
  topic: string; // Required: chat topic
  priority?: "low" | "normal" | "high" | "urgent";
  user_agent?: string; // Optional: browser user agent
}

export interface StartChatResponse {
  session_id: string;
  chat_user_id: string;
  requires_contact: boolean;
}

export interface SetContactRequest {
  session_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  position?: string;
  company_name?: string;
}

export interface SetContactResponse {
  contact_id: string;
  message: string;
}

export interface ChatHistoryItem {
  session_id: string;
  topic: string;
  status: string;
  priority: string;
  started_at: string;
  ended_at: string | null;
  agent?: {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    department_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  contact?: {
    id: string;
    session_id: string;
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
    position?: string;
    company_name?: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  messages?: Array<{
    id: string;
    session_id: string;
    sender_id: string | null;
    sender_type: "customer" | "agent" | "system";
    message: string;
    message_type: "text" | "image" | "file" | "system";
    attachments: unknown | null;
    read_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>;
  last_message?: {
    id: string;
    session_id: string;
    sender_id: string | null;
    sender_type: "customer" | "agent" | "system";
    message: string;
    message_type: "text" | "image" | "file" | "system";
    attachments: unknown | null;
    read_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export interface ChatHistoryResponse {
  sessions: ChatHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionDetailsResponse {
  id: string;
  chat_user_id: string;
  chat_user: {
    id: string;
    browser_uuid: string;
    oss_user_id: string | null;
    email: string | null;
    is_anonymous: boolean;
    ip_address: string;
    user_agent: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  agent_id: string;
  agent: {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    department_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  department_id: string | null;
  topic: string;
  status: string;
  priority: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SendMessageRequest {
  session_id: string;
  message: string;
  message_type?: "text" | "image" | "file";
}

export interface SendMessageResponse {
  message_id: string;
  status: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender_type: "customer" | "agent" | "system";
  message_type: "text" | "image" | "file" | "system";
  created_at: string;
}

class ChatAPI {
  private browserUUID: string;

  constructor() {
    // Generate or get existing browser UUID for anonymous users
    this.browserUUID = this.getBrowserUUID();
  }

  private getBrowserUUID(): string {
    let uuid = localStorage.getItem("livechat_browser_uuid");
    if (!uuid) {
      uuid = this.generateUUID();
      localStorage.setItem("livechat_browser_uuid", uuid);
    }
    return uuid;
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  }

  // New OSS Chat API methods
  async startChat(
    request: Omit<StartChatRequest, "browser_uuid"> & { browser_uuid?: string }
  ): Promise<StartChatResponse> {
    const requestData: StartChatRequest = {
      browser_uuid: this.browserUUID,
      user_agent: navigator.userAgent,
      priority: "normal",
      ...request,
    };

    const response = await this.request<{ data: StartChatResponse }>(
      "/chat/start",
      {
        method: "POST",
        body: JSON.stringify(requestData),
      }
    );

    return response.data;
  }

  async setContact(request: SetContactRequest): Promise<SetContactResponse> {
    const response = await this.request<{ data: SetContactResponse }>(
      "/chat/contact",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    return response.data;
  }

  async linkOSSUser(ossUserId: string, email: string): Promise<void> {
    await this.request("/chat/link-user", {
      method: "POST",
      body: JSON.stringify({
        browser_uuid: this.browserUUID,
        oss_user_id: ossUserId,
        email: email,
      }),
    });
  }

  async getChatHistory(
    ossUserId?: string,
    limit = 20,
    offset = 0
  ): Promise<ChatHistoryResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (ossUserId) {
      params.append("oss_user_id", ossUserId);
    } else {
      params.append("browser_uuid", this.browserUUID);
    }

    const response = await this.request<{
      success: boolean;
      message: string;
      data: ChatHistoryResponse;
    }>(`/chat/history?${params}`);
    return response.data;
  }

  async getSessionDetails(sessionId: string): Promise<SessionDetailsResponse> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: SessionDetailsResponse;
    }>(`/chat/session/${sessionId}`);

    return response.data;
  }

  // Legacy methods for backward compatibility
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await this.request<{ data: SendMessageResponse }>(
      "/public/chat/message",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    return response.data;
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await this.request<{ data: ChatMessage[] }>(
      `/public/chat/session/${sessionId}/messages`
    );

    return response.data;
  }

  async uploadFile(
    sessionId: string,
    file: File
  ): Promise<{ file_url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);

    const response = await fetch(`${API_BASE_URL}/public/chat/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Upload failed");
    }

    return data.data;
  }

  // Getter for browser UUID (for external use)
  getBrowserId(): string {
    return this.browserUUID;
  }
}

export const chatAPI = new ChatAPI();
