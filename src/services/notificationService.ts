class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

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
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
  }

  async sendNotification(title: string, options: NotificationOptions = {}) {
    if (this.permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/assets/melody.webp',
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
    // Hydration reminder every 2 hours
    setInterval(() => {
      this.sendNotification("Stay Hydrated!", {
        body: "Don't forget to hydrate properly babiee.",
        tag: 'hydration-reminder'
      });
    }, 2 * 60 * 60 * 1000);

    // Breathing reminder every 4 hours
    setInterval(() => {
      this.sendNotification("Time to Breathe", {
        body: "A breathing exercise might help babie.",
        tag: 'breathing-reminder'
      });
    }, 4 * 60 * 60 * 1000);
  }
}

export const notificationService = NotificationService.getInstance(); 