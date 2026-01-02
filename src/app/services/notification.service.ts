import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor() {}

  async requestPermissions() {
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  }

  async scheduleDailyQuote() {
    // Check if permission is granted
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions denied');
      return;
    }

    // Check if already scheduled to avoid duplicates
    const pending = await LocalNotifications.getPending();
    const isScheduled = pending.notifications.some((n) => n.id === 1);

    if (isScheduled) {
      console.log('Daily quote notification already scheduled');
      return;
    }

    // Schedule for 9:00 AM every day
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Frase del Día ✨',
          body: '¡Entra ahora para descubrir tu dosis diaria de inspiración!',
          id: 1,
          schedule: {
            on: {
              hour: 9,
              minute: 0,
            },
            allowWhileIdle: true,
          },
          sound: 'beep.wav',
          attachments: [],
          actionTypeId: '',
          extra: null,
        },
      ],
    });

    console.log('Daily quote notification scheduled for 9:00 AM');
  }
}
