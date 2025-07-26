import { useState, useCallback } from "react";

export function useWebSocketConnection() {
  const [shouldMaintainConnection, setShouldMaintainConnection] =
    useState(false);

  const enableConnection = useCallback(() => {
    setShouldMaintainConnection(true);
  }, []);

  const disableConnection = useCallback(() => {
    setShouldMaintainConnection(false);
  }, []);

  const toggleConnection = useCallback((enabled: boolean) => {
    setShouldMaintainConnection(enabled);
  }, []);

  return {
    shouldMaintainConnection,
    actions: {
      enableConnection,
      disableConnection,
      toggleConnection,
    },
  };
}
