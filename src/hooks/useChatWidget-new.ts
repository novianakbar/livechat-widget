import { useState, useEffect, useCallback } from "react";
import { chatAPI } from "../services/api";
import type {
  Message,
  ChatSession,
  Customer,
  WidgetConfig,
} from "../types/chat";

export interface ChatState {
  isOpen: boolean;
  currentSession: ChatSession | null;
  unreadCount: number;
  isTyping: boolean;
  assignedAdmin: {
    name: string;
    isOnline: boolean;
  } | null;
}

const defaultConfig: WidgetConfig = {
  primaryColor: "#3B82F6",
  widgetTitle: "Bantuan OSS",
  welcomeMessage: "Selamat datang di layanan bantuan OSS Perizinan Berusaha",
  position: "bottom-right",
  autoOpen: false,
  showAgentInfo: true,
  allowFileUpload: true,
};

export function useChatWidget(config?: Partial<WidgetConfig>) {
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    currentSession: null,
    unreadCount: 0,
    isTyping: false,
    assignedAdmin: null,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const mergedConfig = { ...defaultConfig, ...config };

  // WebSocket for real-time updates (placeholder)
  useEffect(() => {
    if (chatState.currentSession) {
      // TODO: Implement WebSocket connection
      console.log(
        "WebSocket would connect here for session:",
        chatState.currentSession.id
      );
    }
  }, [chatState.currentSession]);

  const startChat = useCallback(
    async (customer: Omit<Customer, "id" | "createdAt">) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await chatAPI.startChat({
          company_name: customer.company || "",
          person_name: customer.name,
          email: customer.email || "",
          phone: customer.phone || "",
          topic: customer.subject || "Bantuan OSS Perizinan Berusaha",
        });

        // Create a mock session object since the backend returns different format
        const session: ChatSession = {
          id: response.session_id,
          customerId: "", // Will be set by backend
          status: "waiting",
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        };

        setChatState((prev) => ({
          ...prev,
          currentSession: session,
        }));

        // Add welcome message
        const welcomeMessage: Message = {
          id: "welcome-" + Date.now(),
          content: "Chat telah dimulai. Admin kami akan segera membantu Anda.",
          sender: "admin",
          timestamp: new Date(),
          type: "text",
        };

        setMessages([welcomeMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memulai chat");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chatState.currentSession) return;

      setIsLoading(true);
      try {
        await chatAPI.sendMessage({
          session_id: chatState.currentSession.id,
          message: content,
          message_type: "text",
        });

        // Add message to local state
        const newMessage: Message = {
          id: Date.now().toString(),
          content,
          sender: "customer",
          timestamp: new Date(),
          type: "text",
        };

        setMessages((prev) => [...prev, newMessage]);

        // Simulate admin response after delay (for demo)
        setTimeout(() => {
          const adminResponse: Message = {
            id: Date.now().toString() + "_admin",
            content:
              "Terima kasih atas pertanyaan Anda. Admin kami akan segera merespons.",
            sender: "admin",
            timestamp: new Date(),
            type: "text",
          };
          setMessages((prev) => [...prev, adminResponse]);
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengirim pesan");
      } finally {
        setIsLoading(false);
      }
    },
    [chatState.currentSession]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!chatState.currentSession) return;

      setIsLoading(true);
      try {
        const response = await chatAPI.uploadFile(
          chatState.currentSession.id,
          file
        );

        const fileMessage: Message = {
          id: Date.now().toString(),
          content: file.name,
          sender: "customer",
          timestamp: new Date(),
          type: "file",
          fileUrl: response.file_url,
          fileName: file.name,
        };

        setMessages((prev) => [...prev, fileMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal upload file");
      } finally {
        setIsLoading(false);
      }
    },
    [chatState.currentSession]
  );

  const toggleWidget = useCallback(() => {
    setChatState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const closeWidget = useCallback(() => {
    setChatState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const startTyping = useCallback(() => {
    // This would typically send a typing indicator to the server
    console.log("Customer is typing...");
  }, []);

  const stopTyping = useCallback(() => {
    // This would typically clear the typing indicator
    console.log("Customer stopped typing");
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    chatState,
    messages,
    isLoading,
    error,
    config: mergedConfig,
    actions: {
      startChat,
      sendMessage,
      uploadFile,
      toggleWidget,
      closeWidget,
      startTyping,
      stopTyping,
      clearError,
    },
  };
}
