import { useState, useCallback } from "react";
import { chatAPI } from "../services/api";
import type { Message, ChatSession } from "../types/chat";

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);

  const addWelcomeMessage = useCallback(() => {
    const welcomeMessage: Message = {
      id: "welcome-" + Date.now(),
      content:
        "Chat telah dimulai. Silahkan mulai percakapan Anda. Admin kami akan segera membantu Anda.",
      sender: "admin",
      timestamp: new Date(),
      type: "text",
    };
    setMessages([welcomeMessage]);
  }, []);

  const setAllMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  const removeMessage = useCallback(
    (content: string, sender: "customer" | "admin") => {
      setMessages((prev) =>
        prev.filter((msg) => msg.content !== content || msg.sender !== sender)
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, session: ChatSession) => {
      setIsLoading(true);
      setError("");

      try {
        // Add message to local state immediately for better UX
        const customerMessage: Message = {
          id: Date.now().toString(),
          content,
          sender: "customer",
          timestamp: new Date(),
          type: "text",
        };

        addMessage(customerMessage);

        // Send via API only - backend will handle WebSocket broadcasting
        await chatAPI.sendMessage({
          session_id: session.id,
          message: content,
          message_type: "text",
        });
      } catch (err) {
        // Remove the message from local state if sending failed
        removeMessage(content, "customer");
        const errorMessage =
          err instanceof Error ? err.message : "Gagal mengirim pesan";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, removeMessage]
  );

  const uploadFile = useCallback(
    async (file: File, session: ChatSession) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await chatAPI.uploadFile(session.id, file);

        const fileMessage: Message = {
          id: Date.now().toString(),
          content: file.name,
          sender: "customer",
          timestamp: new Date(),
          type: "file",
          fileUrl: response.file_url,
          fileName: file.name,
        };

        addMessage(fileMessage);
        return fileMessage;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Gagal upload file";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError("");
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    messages,
    isLoading,
    error,
    actions: {
      addMessage,
      addWelcomeMessage,
      setAllMessages,
      sendMessage,
      uploadFile,
      clearMessages,
      clearError,
    },
  };
}
