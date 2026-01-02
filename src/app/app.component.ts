import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private notificationService: NotificationService) {
    this.initNotifications();
  }

  async initNotifications() {
    await this.notificationService.scheduleDailyQuote();
  }
}
