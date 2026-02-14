import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root',
})
export class LocalNotificationService {
  private readonly DAILY_NOTIFICATION_ID = 1001;

  constructor() {}

  async requestPermissions(): Promise<boolean> {
    try {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    } catch (e) {
      console.warn('LocalNotifications permission request failed (web?)', e);
      return false;
    }
  }

  async scheduleDailyReminder(hour: number = 9, minute: number = 0) {
    try {
      // 1. Cancel existing to avoid duplicates
      await this.cancelReminders();

      // 2. Schedule
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Positive 2026 ✨',
            body: 'Tu frase del día te espera. ¡Descúbrela!',
            id: this.DAILY_NOTIFICATION_ID,
            schedule: {
              on: {
                hour: hour,
                minute: minute,
              },
              allowWhileIdle: true,
            },
            sound: 'beep.wav',
            actionTypeId: '',
            extra: null,
          },
        ],
      });
      console.log(`Notification scheduled for ${hour}:${minute}`);
    } catch (e) {
      console.error('Failed to schedule notification', e);
    }
  }

  async cancelReminders() {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: this.DAILY_NOTIFICATION_ID }],
      });
    } catch (e) {
      console.warn('Failed to cancel notifications', e);
    }
  }

  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { display } = await LocalNotifications.checkPermissions();
      return display === 'granted';
    } catch (e) {
      return false;
    }
  }
}
