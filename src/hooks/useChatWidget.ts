import { useState, useEffect, useCallback, useRef } from "react";
import { chatAPI } from "../services/api";
import type { ChatHistoryItem } from "../services/api";
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
  chatHistory: ChatHistoryItem[];
  isLoadingHistory: boolean;
  historyLoaded: boolean; // Track if we've attempted to load history
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
    chatHistory: [],
    isLoadingHistory: false,
    historyLoaded: false,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [shouldMaintainConnection, setShouldMaintainConnection] =
    useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldMaintainConnectionRef = useRef(false);
  const isOpenRef = useRef(false);
  const currentSessionRef = useRef<ChatSession | null>(null);

  const mergedConfig = { ...defaultConfig, ...config };

  // Update refs whenever states change
  useEffect(() => {
    shouldMaintainConnectionRef.current = shouldMaintainConnection;
  }, [shouldMaintainConnection]);

  useEffect(() => {
    isOpenRef.current = chatState.isOpen;
  }, [chatState.isOpen]);

  useEffect(() => {
    currentSessionRef.current = chatState.currentSession;
  }, [chatState.currentSession]);

  // WebSocket connection
  useEffect(() => {
    // Clear any existing reconnect timeout when dependencies change
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (
      chatState.currentSession &&
      chatState.isOpen &&
      shouldMaintainConnection
    ) {
      const connectWebSocket = () => {
        // Check if we should still maintain connection before attempting to connect
        if (!shouldMaintainConnection || !chatState.isOpen) {
          return;
        }

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

          // Use refs to get current values instead of closure values
          const currentShouldMaintain = shouldMaintainConnectionRef.current;
          const currentIsOpen = isOpenRef.current;
          const currentSession = currentSessionRef.current;

          // Only attempt to reconnect if we should maintain connection and widget is open
          if (currentShouldMaintain && currentIsOpen && currentSession) {
            console.log("Attempting to reconnect widget WebSocket...");
            reconnectTimeoutRef.current = setTimeout(() => {
              // Double check again before actually reconnecting
              if (
                shouldMaintainConnectionRef.current &&
                isOpenRef.current &&
                currentSessionRef.current
              ) {
                connectWebSocket();
              } else {
                console.log("Reconnect cancelled - conditions changed");
              }
            }, 3000);
          } else {
            console.log(
              "Not reconnecting - connection should not be maintained or widget is closed",
              {
                currentShouldMaintain,
                currentIsOpen,
                hasSession: !!currentSession,
              }
            );
          }
        };

        setWs(websocket);
      };

      connectWebSocket();

      return () => {
        console.log("Cleaning up WebSocket connection");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        if (ws) {
          ws.close();
        }
      };
    } else {
      // Close existing connection if conditions are not met
      if (ws) {
        console.log("Closing WebSocket - conditions not met for connection");
        setShouldMaintainConnection(false);
        setIsConnected(false);
        ws.close();
        setWs(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chatState.currentSession?.id,
    chatState.isOpen,
    shouldMaintainConnection,
  ]);

  const startChat = useCallback(
    async (customer: Omit<Customer, "id" | "createdAt">) => {
      setIsLoading(true);
      setError("");

      try {
        // Step 1: Start chat with new API
        const startResponse = await chatAPI.startChat({
          topic: customer.subject || "Bantuan OSS Perizinan Berusaha",
          // Optional fields for logged-in users
          oss_user_id: customer.ossUserId,
          email: customer.email || undefined,
        });

        // Step 2: Set contact information
        if (startResponse.requires_contact) {
          await chatAPI.setContact({
            session_id: startResponse.session_id,
            contact_name: customer.name,
            contact_email: customer.email || "",
            contact_phone: customer.phone,
            company_name: customer.company,
            position: customer.position,
          });
        }

        // Create session object
        const session: ChatSession = {
          id: startResponse.session_id,
          customerId: startResponse.chat_user_id,
          status: "waiting",
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        };

        setChatState((prev) => ({
          ...prev,
          currentSession: session,
        }));

        // Aktifkan koneksi WebSocket saat session dimulai
        setShouldMaintainConnection(true);

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

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Step 1: Get session details
      const sessionDetails = await chatAPI.getSessionDetails(sessionId);

      // Create session object
      const session: ChatSession = {
        id: sessionDetails.id,
        customerId: sessionDetails.chat_user_id,
        status: sessionDetails.status as "waiting" | "active" | "closed",
        createdAt: new Date(sessionDetails.started_at),
        updatedAt: new Date(sessionDetails.updated_at),
        messages: [],
      };

      setChatState((prev) => ({
        ...prev,
        currentSession: session,
      }));

      // Aktifkan koneksi WebSocket saat session dimuat
      setShouldMaintainConnection(true);

      // Step 2: Get messages separately
      const messages = await chatAPI.getMessages(sessionId);

      // Convert API messages to widget messages
      const widgetMessages: Message[] = messages.map((msg) => ({
        id: msg.id,
        content: msg.message,
        sender: msg.sender_type === "customer" ? "customer" : "admin",
        timestamp: new Date(msg.created_at),
        type: msg.message_type as "text" | "file" | "image",
      }));

      setMessages(widgetMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sesi chat");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    console.log("toggleWidget called, current isOpen:", chatState.isOpen);
    setChatState((prev) => {
      const newIsOpen = !prev.isOpen;
      console.log("Setting isOpen to:", newIsOpen);

      // Kontrol koneksi WebSocket berdasarkan status widget
      if (newIsOpen && prev.currentSession) {
        // Widget dibuka dan ada session aktif - aktifkan WebSocket
        setShouldMaintainConnection(true);
      } else if (!newIsOpen) {
        // Widget ditutup - matikan WebSocket dan clear timeout
        setShouldMaintainConnection(false);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
          console.log("Cleared reconnect timeout - widget closed");
        }
      }

      // Reset unread count ketika widget dibuka
      if (newIsOpen) {
        return { ...prev, isOpen: newIsOpen, unreadCount: 0 };
      }
      return { ...prev, isOpen: newIsOpen };
    });
  }, [chatState.isOpen]);

  const closeWidget = useCallback(() => {
    setChatState((prev) => ({ ...prev, isOpen: false }));
    // Matikan koneksi WebSocket saat widget ditutup dan clear timeout
    setShouldMaintainConnection(false);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      console.log("Cleared reconnect timeout - widget closed explicitly");
    }
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

  // Fungsi untuk mengontrol koneksi WebSocket
  const enableWebSocketConnection = useCallback(() => {
    setShouldMaintainConnection(true);
  }, []);

  const disableWebSocketConnection = useCallback(() => {
    setShouldMaintainConnection(false);
    // Clear any pending reconnect timeout immediately
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      console.log("Cleared pending reconnect timeout");
    }
  }, []);

  // Reset chat history state (useful for refreshing or logout)
  const resetChatHistory = useCallback(() => {
    setChatState((prev) => ({
      ...prev,
      chatHistory: [],
      historyLoaded: false,
      isLoadingHistory: false,
    }));
  }, []);

  const loadChatHistory = useCallback(async () => {
    setChatState((prev) => ({ ...prev, isLoadingHistory: true }));
    try {
      const historyResponse = await chatAPI.getChatHistory();
      setChatState((prev) => ({
        ...prev,
        chatHistory: historyResponse.sessions,
        isLoadingHistory: false,
        historyLoaded: true,
      }));
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Mark as loaded even on error (including 404) to prevent infinite retries
      setChatState((prev) => ({
        ...prev,
        isLoadingHistory: false,
        historyLoaded: true,
        chatHistory: [], // Ensure empty array for 404 or other errors
      }));
    }
  }, []);

  // Clear current session and messages
  const clearSession = useCallback(() => {
    // Matikan koneksi WebSocket terlebih dahulu
    setShouldMaintainConnection(false);

    // Clear any pending reconnect timeout immediately
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      console.log("Cleared reconnect timeout - session cleared");
    }

    setChatState((prev) => ({
      ...prev,
      currentSession: null,
      isTyping: false,
      assignedAdmin: null,
    }));
    setMessages([]);

    // Close WebSocket if connected
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  }, [ws]);

  // Load chat history when widget opens for the first time
  useEffect(() => {
    if (
      chatState.isOpen &&
      !chatState.historyLoaded &&
      !chatState.isLoadingHistory
    ) {
      loadChatHistory();
    }
  }, [
    chatState.isOpen,
    chatState.historyLoaded,
    chatState.isLoadingHistory,
    loadChatHistory,
  ]);

  // Cleanup effect untuk mencegah memory leaks
  useEffect(() => {
    return () => {
      // Clear timeouts on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Close WebSocket connection on unmount
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  return {
    chatState,
    messages,
    isLoading,
    error,
    config: mergedConfig,
    actions: {
      startChat,
      loadSession,
      sendMessage,
      uploadFile,
      toggleWidget,
      closeWidget,
      startTyping,
      stopTyping,
      clearError,
      loadChatHistory,
      clearSession,
      resetChatHistory,
      enableWebSocketConnection,
      disableWebSocketConnection,
    },
  };
}
