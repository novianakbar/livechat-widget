export interface Message {
  id: string;
  content: string;
  sender: "customer" | "admin";
  timestamp: Date;
  type: "text" | "file" | "image";
  fileUrl?: string;
  fileName?: string;
  readAt?: Date;
}

export interface ChatSession {
  id: string;
  customerId: string;
  adminId?: string;
  status: "waiting" | "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  subject?: string;
  position?: string;
  ossUserId?: string;
  createdAt: Date;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  avatar?: string;
}

export interface WidgetConfig {
  apiUrl?: string;
  websocketUrl?: string;
  widgetTitle: string;
  welcomeMessage: string;
  primaryColor: string;
  position: "bottom-right" | "bottom-left";
  allowFileUpload: boolean;
  showTypingIndicator?: boolean;
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[];
  autoOpen?: boolean;
  showAgentInfo?: boolean;
}

export interface ChatState {
  isOpen: boolean;
  isConnected: boolean;
  isTyping: boolean;
  currentSession: ChatSession | null;
  customer: Customer | null;
  assignedAdmin: Admin | null;
  unreadCount: number;
}

export interface SocketEvents {
  "message:new": (message: Message) => void;
  "message:read": (messageId: string) => void;
  "typing:start": (userId: string) => void;
  "typing:stop": (userId: string) => void;
  "session:assigned": (admin: Admin) => void;
  "session:closed": () => void;
  "admin:online": (admin: Admin) => void;
  "admin:offline": (adminId: string) => void;
}
