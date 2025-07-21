// Notification service untuk menangani berbagai jenis notifikasi
// Implementasi berdasarkan browser-beep library menggunakan Web Audio API

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class NotificationService {
  private hasNotificationPermission = false;
  private audioContext: AudioContext | null = null;

  // Constants from browser-beep
  private readonly FREQUENCY = 800; // Slightly higher than original 440Hz for notification
  private readonly INTERVAL = 250;
  private readonly RAMP_VALUE = 0.00001;
  private readonly RAMP_DURATION = 0.15; // Shorter duration for notification

  constructor() {
    this.initializeNotifications();
    this.initializeAudioContext();
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
   * Inisialisasi Audio Context untuk Web Audio API
   */
  private initializeAudioContext() {
    try {
      // Support for webkit browsers
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      if (window.AudioContext) {
        this.audioContext = new AudioContext();
      }
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
    }
  }

  /**
   * Resume AudioContext jika suspended (required by browsers untuk user interaction)
   */
  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn("Failed to resume audio context:", error);
      }
    }
  }

  /**
   * Play single beep menggunakan Web Audio API (berdasarkan browser-beep)
   */
  private playBeep(frequency?: number): void {
    if (!this.audioContext) return;

    try {
      const currentTime = this.audioContext.currentTime;
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect the nodes: oscillator -> gain -> destination
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure gain envelope (volume ramp down for smooth ending)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        this.RAMP_VALUE,
        currentTime + this.RAMP_DURATION
      );

      // Cleanup when oscillator ends
      oscillator.onended = () => {
        try {
          gainNode.disconnect(this.audioContext!.destination);
          oscillator.disconnect(gainNode);
        } catch {
          // Already disconnected, ignore error
        }
      };

      // Configure oscillator
      oscillator.type = "sine";
      oscillator.frequency.value = frequency || this.FREQUENCY;

      // Start and stop the oscillator
      oscillator.start(currentTime);
      oscillator.stop(currentTime + this.RAMP_DURATION);
    } catch (error) {
      console.warn("Error creating beep sound:", error);
    }
  }

  /**
   * Mainkan suara notifikasi dengan multiple beeps
   */
  async playNotificationSound(times: number = 1): Promise<void> {
    if (!this.audioContext) return;

    try {
      await this.resumeAudioContext();

      // Play multiple beeps with interval (like browser-beep)
      const playLoop = (i: number) => {
        this.playBeep();
        if (++i < times) {
          setTimeout(() => playLoop(i), this.INTERVAL);
        }
      };

      playLoop(0);
    } catch (error) {
      console.warn("Error playing notification sound:", error);
    }
  }

  /**
   * Mainkan suara beep dengan variasi frekuensi
   */
  async playBeepVariation(
    type: "success" | "warning" | "error" | "info" = "info"
  ): Promise<void> {
    if (!this.audioContext) return;

    try {
      await this.resumeAudioContext();

      const variations = {
        success: [
          { freq: 800, delay: 0 },
          { freq: 1000, delay: 150 },
        ], // High-low success sound
        warning: [{ freq: 600, delay: 0 }], // Medium frequency warning
        error: [
          { freq: 400, delay: 0 },
          { freq: 400, delay: 200 },
        ], // Low frequency double beep
        info: [{ freq: 800, delay: 0 }], // Single high beep for info
      };

      const sequence = variations[type];

      sequence.forEach(({ freq, delay }) => {
        setTimeout(() => {
          this.playBeep(freq);
        }, delay);
      });
    } catch (error) {
      console.warn("Error playing beep variation:", error);
    }
  }

  /**
   * Tampilkan notifikasi browser
   */
  showBrowserNotification(title: string, message: string, icon?: string): void {
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
  vibrateDevice(pattern: number[] = [200, 100, 200]): void {
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
  async notifyNewMessage(
    sender: string,
    message: string,
    options: {
      playSound?: boolean;
      showBrowser?: boolean;
      vibrate?: boolean;
      icon?: string;
      soundType?: "success" | "warning" | "error" | "info";
    } = {}
  ): Promise<void> {
    const {
      playSound = true,
      showBrowser = true,
      vibrate = true,
      icon,
      soundType = "info",
    } = options;

    // Play sound
    if (playSound) {
      await this.playBeepVariation(soundType);
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
    return this.audioContext !== null;
  }

  /**
   * Destroy service dan cleanup resources
   */
  destroy(): void {
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (error) {
        console.warn("Error closing audio context:", error);
      }
    }
    this.audioContext = null;
  }
}

// Singleton instance
export const notificationService = new NotificationService();
