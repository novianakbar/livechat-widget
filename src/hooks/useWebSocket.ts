import { useState, useEffect, useRef, useCallback } from "react";
import type { Message, ChatSession } from "../types/chat";
import { notificationService } from "../services/notification";

interface UseWebSocketProps {
  currentSession: ChatSession | null;
  isOpen: boolean;
  shouldMaintainConnection: boolean;
  assignedAdmin: { name: string; isOnline: boolean } | null;
  onNewMessage: (message: Message) => void;
  onTypingChange: (isTyping: boolean) => void;
  onSessionUpdate: (session: ChatSession) => void;
  onUnreadCountChange: (increment: number) => void;
}

export function useWebSocket({
  currentSession,
  isOpen,
  shouldMaintainConnection,
  assignedAdmin,
  onNewMessage,
  onTypingChange,
  onSessionUpdate,
  onUnreadCountChange,
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs untuk akses state terbaru dalam closure - PENTING untuk mencegah stale closure
  const currentSessionRef = useRef(currentSession);
  const isOpenRef = useRef(isOpen);
  const shouldMaintainConnectionRef = useRef(shouldMaintainConnection);
  const assignedAdminRef = useRef(assignedAdmin);
  
  // Refs untuk callback functions - mencegah dependency changes
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingChangeRef = useRef(onTypingChange);
  const onSessionUpdateRef = useRef(onSessionUpdate);
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);

  // Update refs ketika props berubah - ini mencegah stale closure
  useEffect(() => {
    currentSessionRef.current = currentSession;
    isOpenRef.current = isOpen;
    shouldMaintainConnectionRef.current = shouldMaintainConnection;
    assignedAdminRef.current = assignedAdmin;
    onNewMessageRef.current = onNewMessage;
    onTypingChangeRef.current = onTypingChange;
    onSessionUpdateRef.current = onSessionUpdate;
    onUnreadCountChangeRef.current = onUnreadCountChange;
  }, [currentSession, isOpen, shouldMaintainConnection, assignedAdmin, onNewMessage, onTypingChange, onSessionUpdate, onUnreadCountChange]);

  // Cleanup function yang konsisten
  const cleanup = useCallback(() => {
    console.log("Cleaning up WebSocket...");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null; // Set to null first to prevent any other operations
      ws.close();
    }

    setIsConnected(false);
  }, []);

  // Main effect untuk mengelola koneksi - OPTIMIZED
  useEffect(() => {
    // Clear pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const sessionId = currentSession?.id;
    const shouldConnect = currentSession && isOpen && shouldMaintainConnection;

    if (shouldConnect) {
      // Hanya connect jika belum ada koneksi atau session berubah
      const currentWs = wsRef.current;
      const isCurrentSessionSame =
        currentWs && currentWs.url.includes(sessionId || "");

      if (
        !isCurrentSessionSame ||
        !currentWs ||
        currentWs.readyState === WebSocket.CLOSED
      ) {
        console.log("Starting WebSocket connection for session:", sessionId);
        
        // Inline connection logic untuk menghindari dependency issue
        const session = currentSession;
        
        // Cleanup existing connection sebelum membuat yang baru
        if (wsRef.current) {
          console.log("Closing existing WebSocket before creating new one");
          wsRef.current.close();
          wsRef.current = null;
        }

        const userId = session.customerId || "customer";
        const userType = "customer";
        const wsUrl = `${
          import.meta.env.VITE_WS_URL || "ws://localhost:8081"
        }/ws/${sessionId}/${userId}/${userType}`;

        console.log("Creating new WebSocket connection:", wsUrl);
        const websocket = new WebSocket(wsUrl);
        wsRef.current = websocket;

        websocket.onopen = () => {
          console.log("WebSocket connected successfully");
          setIsConnected(true);

          // Join session
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
            console.log("WebSocket message received:", wsMessage.type);

            switch (wsMessage.type) {
              case "joined_session":
                console.log("Successfully joined session");
                break;

              case "new_message":
                if (wsMessage.data.session_id === currentSessionRef.current?.id) {
                  if (wsMessage.data.sender_type === "agent" || wsMessage.data.sender_type === "ai") {
                    const newMessage: Message = {
                      id: wsMessage.data.message_id || `ws-${Date.now()}`,
                      content: wsMessage.data.message,
                      sender: "admin",
                      timestamp: new Date(wsMessage.data.timestamp || new Date()),
                      type: "text",
                    };

                    onNewMessageRef.current(newMessage);

                    // Handle notifications
                    if (!isOpenRef.current) {
                      onUnreadCountChangeRef.current(1);
                      notificationService.notifyNewMessage(
                        assignedAdminRef.current?.name || "Admin OSS",
                        wsMessage.data.message,
                        {
                          playSound: true,
                          showBrowser: true,
                          vibrate: true,
                          soundType: "info",
                        }
                      );
                    } else {
                      notificationService.playNotificationSound(1);
                    }
                  }
                }
                break;

              case "typing_indicator":
                if (
                  wsMessage.data.session_id === currentSessionRef.current?.id &&
                  (wsMessage.data.sender_type === "agent" || wsMessage.data.sender_type === "ai")
                ) {
                  onTypingChangeRef.current(wsMessage.data.is_typing || false);
                }
                break;

              case "session_update":
                if (
                  wsMessage.data.session_id === currentSessionRef.current?.id &&
                  currentSessionRef.current
                ) {
                  onSessionUpdateRef.current({
                    ...currentSessionRef.current,
                    status: wsMessage.data.status,
                  });
                }
                break;
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        websocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };

        websocket.onclose = (event) => {
          console.log(
            "WebSocket closed, code:",
            event.code,
            "reason:",
            event.reason
          );
          setIsConnected(false);

          // Clear reference hanya jika ini adalah websocket yang aktif
          if (wsRef.current === websocket) {
            wsRef.current = null;
          }

          // Check if we should reconnect menggunakan current refs
          const shouldStillConnect = shouldMaintainConnectionRef.current;
          const isStillOpen = isOpenRef.current;
          const hasSession = !!currentSessionRef.current;

          if (
            shouldStillConnect &&
            isStillOpen &&
            hasSession &&
            event.code !== 1000
          ) {
            console.log("Scheduling WebSocket reconnect in 3 seconds...");
            reconnectTimeoutRef.current = setTimeout(() => {
              // Double-check conditions sebelum reconnect
              if (
                shouldMaintainConnectionRef.current &&
                isOpenRef.current &&
                currentSessionRef.current &&
                !wsRef.current // Pastikan tidak ada koneksi aktif
              ) {
                console.log("Attempting to reconnect...");
                // Trigger re-run effect untuk reconnect
                const reconnectEvent = new CustomEvent('ws-reconnect');
                window.dispatchEvent(reconnectEvent);
              } else {
                console.log(
                  "Reconnect cancelled - conditions changed or connection exists"
                );
              }
            }, 3000);
          } else {
            console.log("Not scheduling reconnect", {
              shouldStillConnect,
              isStillOpen,
              hasSession,
              code: event.code,
            });
          }
        };
      } else {
        console.log("WebSocket already connected for current session");
      }
    } else {
      // Cleanup jika kondisi tidak terpenuhi
      console.log("Cleaning up WebSocket - conditions not met");
      
      // Inline cleanup untuk menghindari dependency issue
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.close();
      }

      setIsConnected(false);
    }

    // Cleanup pada unmount atau session change
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [currentSession, isOpen, shouldMaintainConnection]); // Minimal dependencies - callbacks menggunakan refs

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    const ws = wsRef.current;
    const session = currentSessionRef.current;

    if (ws && ws.readyState === WebSocket.OPEN && session) {
      ws.send(
        JSON.stringify({
          type: isTyping ? "typing_start" : "typing_stop",
          session_id: session.id,
          data: { is_typing: isTyping },
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, []);

  const startTyping = useCallback(() => {
    sendTypingIndicator(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);
  }, [sendTypingIndicator]);

  const stopTyping = useCallback(() => {
    sendTypingIndicator(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [sendTypingIndicator]);

  // Cleanup effect pada unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ws: wsRef.current,
    isConnected,
    startTyping,
    stopTyping,
    cleanup,
  };
}
