import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { rocketOutline } from 'ionicons/icons';

@Component({
  selector: 'app-update-required-modal',
  templateUrl: './update-required-modal.component.html',
  styleUrls: ['./update-required-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon]
})
export class UpdateRequiredModalComponent {
  @Input() requiredVersion: string = '';

  constructor(private modalController: ModalController) {
    addIcons({ rocketOutline });
  }

  updateApp() {
    // This will be implemented later with the store URL
    console.log('Update clicked');
    // For now we might want to just dismiss to let them test, or keep it open if it's mandatory
    // The user said "later we put where to download", so for now maybe just close?
    // But usually mandatory updates block. I'll make it log and DO NOTHING to simulate blocking.
    // If the user wants to close it for testing, they can ask.
    // Actually, to avoid getting stuck during dev, I will allow dismiss for now but log a warning.
    this.modalController.dismiss();
  }
}
