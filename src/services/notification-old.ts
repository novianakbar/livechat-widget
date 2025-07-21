// Notification service untuk menangani berbagai jenis notifikasi
export class NotificationService {
  private notificationSound: HTMLAudioElement | null = null;
  private hasNotificationPermission = false;

  constructor() {
    this.initializeNotifications();
    this.createNotificationSound();
  }

  /**
   * Inisialisasi permission untuk notifikasi browser
   */
  private async initializeNotifications() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      this.hasNotificationPermission = permission === "granted";
    }
  }

  /**
   * Membuat suara notifikasi menggunakan Web Audio API
   */
  private createNotificationSound() {
    try {
      // Fallback: gunakan audio file jika ada
      this.notificationSound = new Audio();
      // Buat suara sederhana dengan data URL (beep sound)
      this.notificationSound.src = this.generateBeepSound();
      this.notificationSound.volume = 0.5;
      this.notificationSound.preload = "auto";
    } catch (error) {
      console.warn("Failed to create notification sound:", error);
    }
  }

  /**
   * Generate simple beep sound menggunakan data URL
   */
  private generateBeepSound(): string {
    // Simple beep sound data URL
    const beepSound =
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFApGn+LyvmAaAy2J3u/CciUHL4jO9NeKNwgYaLzu555NEAxWqeT0t2MdBzaR1/LNeSsFJ3fH8N2QQAoUXrTp66hVFA==";
    return beepSound;
  }

  /**
   * Mainkan suara notifikasi
   */
  playNotificationSound() {
    try {
      if (this.notificationSound) {
        // Reset audio ke awal dan mainkan
        this.notificationSound.currentTime = 0;
        this.notificationSound.play().catch((error) => {
          console.warn("Failed to play notification sound:", error);
        });
      }
    } catch (error) {
      console.warn("Error playing notification sound:", error);
    }
  }

  /**
   * Tampilkan notifikasi browser
   */
  showBrowserNotification(title: string, message: string, icon?: string) {
    if (!this.hasNotificationPermission || !("Notification" in window)) {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: message,
        icon: icon || "/vite.svg", // Default icon
        badge: icon || "/vite.svg",
        tag: "livechat-message", // Prevents multiple notifications
        requireInteraction: false,
        silent: false,
      });

      // Auto close setelah 5 detik
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click pada notifikasi
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.warn("Failed to show browser notification:", error);
    }
  }

  /**
   * Vibrate device jika didukung
   */
  vibrateDevice(pattern: number[] = [200, 100, 200]) {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn("Vibration failed:", error);
      }
    }
  }

  /**
   * Notifikasi lengkap dengan semua jenis feedback
   */
  notifyNewMessage(
    sender: string,
    message: string,
    options: {
      playSound?: boolean;
      showBrowser?: boolean;
      vibrate?: boolean;
      icon?: string;
    } = {}
  ) {
    const {
      playSound = true,
      showBrowser = true,
      vibrate = true,
      icon,
    } = options;

    // Play sound
    if (playSound) {
      this.playNotificationSound();
    }

    // Show browser notification
    if (showBrowser) {
      this.showBrowserNotification(
        `Pesan dari ${sender}`,
        message.length > 50 ? message.substring(0, 50) + "..." : message,
        icon
      );
    }

    // Vibrate device
    if (vibrate) {
      this.vibrateDevice();
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasNotificationPermission = permission === "granted";
      return this.hasNotificationPermission;
    } catch (error) {
      console.warn("Failed to request notification permission:", error);
      return false;
    }
  }

  /**
   * Check if notifications are supported and allowed
   */
  get isNotificationSupported(): boolean {
    return "Notification" in window && this.hasNotificationPermission;
  }

  /**
   * Check if audio is supported
   */
  get isAudioSupported(): boolean {
    return this.notificationSound !== null;
  }

  /**
   * Set volume untuk notifikasi suara
   */
  setVolume(volume: number) {
    if (this.notificationSound && volume >= 0 && volume <= 1) {
      this.notificationSound.volume = volume;
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
