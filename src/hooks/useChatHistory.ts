import { useState, useCallback } from "react";
import { chatAPI } from "../services/api";
import type { ChatHistoryItem } from "../services/api";

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loadChatHistory = useCallback(async () => {
    if (isLoadingHistory || historyLoaded) return;

    setIsLoadingHistory(true);
    try {
      const historyResponse = await chatAPI.getChatHistory();
      setChatHistory(historyResponse.sessions);
      setHistoryLoaded(true);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Mark as loaded even on error (including 404) to prevent infinite retries
      setChatHistory([]);
      setHistoryLoaded(true);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory, historyLoaded]);

  // Fungsi refresh yang force reload tanpa memeriksa historyLoaded
  const refreshChatHistory = useCallback(async () => {
    if (isLoadingHistory) return;

    setIsLoadingHistory(true);
    try {
      const historyResponse = await chatAPI.getChatHistory();
      setChatHistory(historyResponse.sessions);
      setHistoryLoaded(true);
    } catch (error) {
      console.error("Failed to refresh chat history:", error);
      // Don't clear on refresh error, keep existing data
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory]);

  const resetChatHistory = useCallback(() => {
    setChatHistory([]);
    setHistoryLoaded(false);
    setIsLoadingHistory(false);
  }, []);

  const addToHistory = useCallback((historyItem: ChatHistoryItem) => {
    setChatHistory((prev) => [historyItem, ...prev]);
  }, []);

  // Auto-load history when first accessed
  const loadHistoryIfNeeded = useCallback(() => {
    if (!historyLoaded && !isLoadingHistory) {
      loadChatHistory();
    }
  }, [historyLoaded, isLoadingHistory, loadChatHistory]);

  return {
    chatHistory,
    isLoadingHistory,
    historyLoaded,
    actions: {
      loadChatHistory,
      refreshChatHistory,
      loadHistoryIfNeeded,
      resetChatHistory,
      addToHistory,
    },
  };
}
