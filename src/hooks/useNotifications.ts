import { useEffect, useRef, useState } from "react";
import { notificationService } from "../services/notification";

interface NotificationSettings {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  vibrationEnabled: boolean;
  soundType: "success" | "warning" | "error" | "info";
}

const defaultSettings: NotificationSettings = {
  soundEnabled: true,
  browserNotificationsEnabled: true,
  vibrationEnabled: true,
  soundType: "info",
};

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // Load settings dari localStorage
    const saved = localStorage.getItem("livechat-notification-settings");
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  });

  const [hasPermission, setHasPermission] = useState(false);
  const isInitializedRef = useRef(false);

  // Initialize notifications saat pertama kali load
  useEffect(() => {
    const initNotifications = async () => {
      if (!isInitializedRef.current) {
        const permission =
          await notificationService.requestNotificationPermission();
        setHasPermission(permission);
        isInitializedRef.current = true;
      }
    };

    initNotifications();
  }, []);

  // Save settings ke localStorage saat berubah
  useEffect(() => {
    localStorage.setItem(
      "livechat-notification-settings",
      JSON.stringify(settings)
    );
  }, [settings]);

  /**
   * Notify untuk pesan baru
   */
  const notifyNewMessage = (
    sender: string,
    message: string,
    isWidgetOpen: boolean
  ) => {
    // Jika widget terbuka dan visible, tidak perlu notifikasi browser
    const shouldShowBrowser =
      !isWidgetOpen && settings.browserNotificationsEnabled && hasPermission;

    notificationService.notifyNewMessage(sender, message, {
      playSound: settings.soundEnabled,
      showBrowser: shouldShowBrowser,
      vibrate: settings.vibrationEnabled && !isWidgetOpen, // Hanya vibrate jika widget tertutup
      soundType: settings.soundType,
    });
  };

  /**
   * Request permission untuk notifikasi
   */
  const requestPermission = async () => {
    const permission =
      await notificationService.requestNotificationPermission();
    setHasPermission(permission);
    return permission;
  };

  /**
   * Update notification settings
   */
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  /**
   * Test notification
   */
  const testNotification = () => {
    notificationService.notifyNewMessage(
      "Admin OSS",
      "Ini adalah tes notifikasi dari LiveChat OSS",
      {
        playSound: settings.soundEnabled,
        showBrowser: settings.browserNotificationsEnabled && hasPermission,
        vibrate: settings.vibrationEnabled,
        soundType: settings.soundType,
      }
    );
  };

  return {
    settings,
    hasPermission,
    notifyNewMessage,
    requestPermission,
    updateSettings,
    testNotification,
    isAudioSupported: notificationService.isAudioSupported,
    isNotificationSupported: notificationService.isNotificationSupported,
  };
}
