import { useState, useEffect, useCallback, useRef } from "react";
import { chatAPI } from "../services/api";
import { notificationService } from "../services/notification";
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
  widgetTitle: "Bantuan",
  welcomeMessage: "Selamat datang di layanan bantuan",
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
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mergedConfig = { ...defaultConfig, ...config };

  // WebSocket connection
  useEffect(() => {
    if (chatState.currentSession) {
      const connectWebSocket = () => {
        // Ganti URL ke livechat-ws
        const sessionId = chatState.currentSession!.id;
        const userId = chatState.currentSession!.customerId || "customer";
        const userType = "customer";
        const wsUrl = `${
          import.meta.env.VITE_WS_URL || "ws://localhost:8081"
        }/ws/${sessionId}/${userId}/${userType}`;
        const websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          setIsConnected(true);
          // Join the session as customer
          websocket.send(
            JSON.stringify({
              type: "join_session",
              session_id: sessionId,
              data: { user_id: userId, user_type: userType },
              timestamp: new Date().toISOString(),
            })
          );
        };

        websocket.onmessage = (event) => {
          try {
            const wsMessage = JSON.parse(event.data);
            console.log("Widget WebSocket message:", wsMessage);

            switch (wsMessage.type) {
              case "joined_session":
                console.log("Successfully joined session:", wsMessage.data);
                break;

              case "new_message":
                if (
                  wsMessage.data.session_id === chatState.currentSession?.id
                ) {
                  // Only add agent messages (customer messages are added locally)
                  if (wsMessage.data.sender_type === "agent") {
                    const newMessage: Message = {
                      id: wsMessage.data.message_id || `ws-${Date.now()}`,
                      content: wsMessage.data.message,
                      sender: "admin",
                      timestamp: new Date(
                        wsMessage.data.timestamp || new Date()
                      ),
                      type: "text",
                    };

                    setMessages((prev) => {
                      const exists = prev.some(
                        (msg) => msg.id === newMessage.id
                      );
                      if (exists) return prev;
                      return [...prev, newMessage];
                    });

                    // Increment unread count if widget is closed
                    if (!chatState.isOpen) {
                      setChatState((prev) => ({
                        ...prev,
                        unreadCount: prev.unreadCount + 1,
                      }));

                      // Trigger notification untuk pesan dari admin
                      notificationService.notifyNewMessage(
                        chatState.assignedAdmin?.name || "Admin OSS",
                        wsMessage.data.message,
                        {
                          playSound: true,
                          showBrowser: true,
                          vibrate: true,
                          soundType: "info",
                        }
                      );
                    } else {
                      // Jika widget terbuka, hanya mainkan suara
                      notificationService.playNotificationSound(1);
                    }
                  }
                }
                break;

              case "typing_indicator":
                if (
                  wsMessage.data.session_id === chatState.currentSession?.id &&
                  wsMessage.data.sender_type === "agent"
                ) {
                  setChatState((prev) => ({
                    ...prev,
                    isTyping: wsMessage.data.is_typing || false,
                  }));
                }
                break;

              case "session_update":
                if (
                  wsMessage.data.session_id === chatState.currentSession?.id
                ) {
                  setChatState((prev) => ({
                    ...prev,
                    currentSession: prev.currentSession
                      ? {
                          ...prev.currentSession,
                          status: wsMessage.data.status,
                        }
                      : null,
                  }));
                }
                break;
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        websocket.onerror = (error) => {
          console.error("Widget WebSocket error:", error);
          setIsConnected(false);
        };

        websocket.onclose = () => {
          console.log("Widget WebSocket closed");
          setIsConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            console.log("Attempting to reconnect widget WebSocket...");
            connectWebSocket();
          }, 3000);
        };

        setWs(websocket);
      };

      connectWebSocket();

      return () => {
        if (ws) {
          console.log("Closing widget WebSocket connection");
          ws.close();
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatState.currentSession?.id]);

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
          content:
            "Chat telah dimulai. Silahkan mulai percakapan Anda. Admin kami akan segera membantu Anda.",
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
        // Add message to local state immediately for better UX
        const customerMessage: Message = {
          id: Date.now().toString(),
          content,
          sender: "customer",
          timestamp: new Date(),
          type: "text",
        };

        setMessages((prev) => [...prev, customerMessage]);

        // Send via API only - backend will handle WebSocket broadcasting
        await chatAPI.sendMessage({
          session_id: chatState.currentSession.id,
          message: content,
          message_type: "text",
        });

        // Note: We don't send via WebSocket here because the backend will broadcast
        // the message automatically when we call the API
      } catch (err) {
        // Remove the message from local state if sending failed
        setMessages((prev) =>
          prev.filter(
            (msg) => msg.content !== content || msg.sender !== "customer"
          )
        );
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
    setChatState((prev) => {
      const newIsOpen = !prev.isOpen;
      // Reset unread count ketika widget dibuka
      if (newIsOpen) {
        return { ...prev, isOpen: newIsOpen, unreadCount: 0 };
      }
      return { ...prev, isOpen: newIsOpen };
    });
  }, []);

  const closeWidget = useCallback(() => {
    setChatState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const startTyping = useCallback(() => {
    if (ws && isConnected && chatState.currentSession) {
      ws.send(
        JSON.stringify({
          type: "typing_start",
          session_id: chatState.currentSession.id,
          data: { is_typing: true },
          timestamp: new Date().toISOString(),
        })
      );

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (ws && isConnected && chatState.currentSession) {
          ws.send(
            JSON.stringify({
              type: "typing_stop",
              session_id: chatState.currentSession.id,
              data: { is_typing: false },
              timestamp: new Date().toISOString(),
            })
          );
        }
      }, 1000);
    }
  }, [ws, isConnected, chatState.currentSession]);

  const stopTyping = useCallback(() => {
    if (ws && isConnected && chatState.currentSession) {
      ws.send(
        JSON.stringify({
          type: "typing_stop",
          session_id: chatState.currentSession.id,
          data: { is_typing: false },
          timestamp: new Date().toISOString(),
        })
      );
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [ws, isConnected, chatState.currentSession]);

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
