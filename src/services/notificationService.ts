import { isNotificationSupported } from '../utils/functions';

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private hydrationInterval: number | null = null;
  private breathingInterval: number | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    if (!isNotificationSupported()) {
      console.log('Notifications are not supported');
      return;
    }

    this.permission = await Notification.requestPermission();
  }

  async sendNotification(title: string, options: NotificationOptions = {}) {
    if (!isNotificationSupported() || this.permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/assets/melody.webp',
        badge: '/assets/melody.webp',
        requireInteraction: true,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  scheduleReminders() {
    if (!isNotificationSupported() || this.permission !== 'granted') {
      console.log('Notifications are not supported or not permitted');
      return;
    }

    // Clear any existing intervals
    this.clearReminders();

    // Hydration reminder every 2 hours
    this.hydrationInterval = window.setInterval(() => {
      this.sendNotification("Stay Hydrated!", {
        body: "Don't forget to hydrate properly babiee.",
        tag: 'hydration-reminder'
      });
    }, 2 * 60 * 60 * 1000);

    // Breathing reminder every 4 hours
    this.breathingInterval = window.setInterval(() => {
      this.sendNotification("Time to Breathe", {
        body: "A breathing exercise might help babie.",
        tag: 'breathing-reminder'
      });
    }, 4 * 60 * 60 * 1000);
  }

  clearReminders() {
    if (this.hydrationInterval) {
      clearInterval(this.hydrationInterval);
      this.hydrationInterval = null;
    }
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }
  }
}

export const notificationService = NotificationService.getInstance(); 