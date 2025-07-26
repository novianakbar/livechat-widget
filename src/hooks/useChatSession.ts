import { useState, useCallback } from "react";
import { chatAPI } from "../services/api";
import type { Customer, ChatSession, Message } from "../types/chat";

export function useChatSession() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const startChat = useCallback(
    async (customer: Omit<Customer, "id" | "createdAt">) => {
      setIsLoading(true);
      setError("");

      try {
        // Step 1: Start chat with new API
        const startResponse = await chatAPI.startChat({
          topic: customer.subject || "Bantuan OSS Perizinan Berusaha",
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

        setCurrentSession(session);
        return session;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Gagal memulai chat";
        setError(errorMessage);
        throw new Error(errorMessage);
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

      setCurrentSession(session);

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

      return { session, messages: widgetMessages };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal memuat sesi chat";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setError("");
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const updateSession = useCallback((session: ChatSession) => {
    setCurrentSession(session);
  }, []);

  return {
    currentSession,
    isLoading,
    error,
    actions: {
      startChat,
      loadSession,
      clearSession,
      clearError,
      updateSession,
    },
  };
}
