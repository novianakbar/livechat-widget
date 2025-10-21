import { useEffect, useCallback } from "react";
import type {
  WidgetConfig,
  Customer,
  ChatSession,
  Message,
} from "../types/chat";
import type { ChatHistoryItem } from "../services/api";
import { useWidgetState } from "./useWidgetState";
import { useChatSession } from "./useChatSession";
import { useChatMessages } from "./useChatMessages";
import { useChatHistory } from "./useChatHistory";
import { useWebSocketConnection } from "./useWebSocketConnection";
import { useWebSocket } from "./useWebSocket";

const defaultConfig: WidgetConfig = {
  primaryColor: "#3B82F6",
  widgetTitle: "Bantuan",
  welcomeMessage: "Selamat datang di layanan bantuan",
  position: "bottom-right",
  autoOpen: false,
  showAgentInfo: true,
  allowFileUpload: true,
  showInitialHint: true,
  initialHintMessage: "Butuh bantuan? Chat dengan kami!",
  initialHintDuration: 7000, // tampilkan selama 7 detik
};

export interface ChatWidgetState {
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
  historyLoaded: boolean;
}

export function useChatWidget(config?: Partial<WidgetConfig>) {
  const mergedConfig = { ...defaultConfig, ...config };

  // Gunakan hook-hook yang lebih kecil
  const { state: widgetState, actions: widgetActions } = useWidgetState();
  const {
    currentSession,
    isLoading: sessionLoading,
    error: sessionError,
    actions: sessionActions,
  } = useChatSession();
  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    actions: messageActions,
  } = useChatMessages();
  const {
    chatHistory,
    isLoadingHistory,
    historyLoaded,
    actions: historyActions,
  } = useChatHistory();
  const { shouldMaintainConnection, actions: connectionActions } =
    useWebSocketConnection();

  // WebSocket dengan callbacks
  const handleNewMessage = useCallback(
    (message: Message) => {
      messageActions.addMessage(message);
    },
    [messageActions]
  );

  const handleTypingChange = useCallback(
    (isTyping: boolean) => {
      widgetActions.setTyping(isTyping);
    },
    [widgetActions]
  );

  const handleSessionUpdate = useCallback(
    (session: ChatSession) => {
      sessionActions.updateSession(session);
    },
    [sessionActions]
  );

  const handleUnreadCountChange = useCallback(
    (increment: number) => {
      widgetActions.incrementUnreadCount(increment);
    },
    [widgetActions]
  );

  const {
    startTyping,
    stopTyping,
    cleanup: cleanupWebSocket,
  } = useWebSocket({
    currentSession,
    isOpen: widgetState.isOpen,
    shouldMaintainConnection,
    assignedAdmin: widgetState.assignedAdmin,
    onNewMessage: handleNewMessage,
    onTypingChange: handleTypingChange,
    onSessionUpdate: handleSessionUpdate,
    onUnreadCountChange: handleUnreadCountChange,
  });

  // Computed values
  const isLoading = sessionLoading || messagesLoading;
  const error = sessionError || messagesError;

  // Load chat history when widget opens for the first time
  useEffect(() => {
    if (widgetState.isOpen && !historyLoaded && !isLoadingHistory) {
      historyActions.loadHistoryIfNeeded();
    }
  }, [widgetState.isOpen, historyLoaded, isLoadingHistory, historyActions]);

  // WebSocket connection management
  useEffect(() => {
    if (widgetState.isOpen && currentSession) {
      connectionActions.enableConnection();
    } else {
      connectionActions.disableConnection();
    }
  }, [widgetState.isOpen, currentSession, connectionActions]);

  // Actions untuk komponen
  const startChat = useCallback(
    async (customer: Omit<Customer, "id" | "createdAt">) => {
      const session = await sessionActions.startChat(customer);
      messageActions.addWelcomeMessage();
      return session;
    },
    [sessionActions, messageActions]
  );

  const loadSession = useCallback(
    async (sessionId: string) => {
      const { session, messages: sessionMessages } =
        await sessionActions.loadSession(sessionId);
      messageActions.setAllMessages(sessionMessages);
      return session;
    },
    [sessionActions, messageActions]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentSession) return;
      return messageActions.sendMessage(content, currentSession);
    },
    [currentSession, messageActions]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!currentSession) return;
      return messageActions.uploadFile(file, currentSession);
    },
    [currentSession, messageActions]
  );

  const toggleWidget = useCallback(() => {
    widgetActions.toggleWidget();
  }, [widgetActions]);

  const closeWidget = useCallback(() => {
    widgetActions.closeWidget();
    connectionActions.disableConnection();
  }, [widgetActions, connectionActions]);

  const clearError = useCallback(() => {
    sessionActions.clearError();
    messageActions.clearError();
  }, [sessionActions, messageActions]);

  const clearSession = useCallback(() => {
    sessionActions.clearSession();
    messageActions.clearMessages();
    connectionActions.disableConnection();
    cleanupWebSocket();
  }, [sessionActions, messageActions, connectionActions, cleanupWebSocket]);

  // Compatibility layer untuk state yang dikembalikan
  const chatState: ChatWidgetState = {
    isOpen: widgetState.isOpen,
    currentSession,
    unreadCount: widgetState.unreadCount,
    isTyping: widgetState.isTyping,
    assignedAdmin: widgetState.assignedAdmin,
    chatHistory,
    isLoadingHistory,
    historyLoaded,
  };

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
      loadChatHistory: historyActions.refreshChatHistory,
      clearSession,
      resetChatHistory: historyActions.resetChatHistory,
      enableWebSocketConnection: connectionActions.enableConnection,
      disableWebSocketConnection: connectionActions.disableConnection,
    },
  };
}
