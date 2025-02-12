export function generateUUID(): string {
  return crypto.randomUUID()
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 
         'serviceWorker' in navigator && 
         'PushManager' in window;
}