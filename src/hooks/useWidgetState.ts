import { useState, useCallback } from "react";

export interface WidgetState {
  isOpen: boolean;
  unreadCount: number;
  isTyping: boolean;
  assignedAdmin: {
    name: string;
    isOnline: boolean;
  } | null;
}

const initialState: WidgetState = {
  isOpen: false,
  unreadCount: 0,
  isTyping: false,
  assignedAdmin: null,
};

export function useWidgetState() {
  const [state, setState] = useState<WidgetState>(initialState);

  const toggleWidget = useCallback(() => {
    setState((prev) => {
      const newIsOpen = !prev.isOpen;
      // Reset unread count ketika widget dibuka
      return {
        ...prev,
        isOpen: newIsOpen,
        unreadCount: newIsOpen ? 0 : prev.unreadCount,
      };
    });
  }, []);

  const openWidget = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      unreadCount: 0,
    }));
  }, []);

  const closeWidget = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const incrementUnreadCount = useCallback((increment: number = 1) => {
    setState((prev) => ({
      ...prev,
      unreadCount: prev.unreadCount + increment,
    }));
  }, []);

  const resetUnreadCount = useCallback(() => {
    setState((prev) => ({
      ...prev,
      unreadCount: 0,
    }));
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    setState((prev) => ({
      ...prev,
      isTyping,
    }));
  }, []);

  const setAssignedAdmin = useCallback(
    (admin: { name: string; isOnline: boolean } | null) => {
      setState((prev) => ({
        ...prev,
        assignedAdmin: admin,
      }));
    },
    []
  );

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    actions: {
      toggleWidget,
      openWidget,
      closeWidget,
      incrementUnreadCount,
      resetUnreadCount,
      setTyping,
      setAssignedAdmin,
      resetState,
    },
  };
}
