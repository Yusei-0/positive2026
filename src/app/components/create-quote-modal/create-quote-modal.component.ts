import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonIcon,
  ModalController,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, pencilOutline } from 'ionicons/icons';

@Component({
  selector: 'app-create-quote-modal',
  templateUrl: './create-quote-modal.component.html',
  styleUrls: ['./create-quote-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonIcon,
    IonButtons,
  ],
})
export class CreateQuoteModalComponent {
  content = '';
  loading = false;
  readonly maxLength = 200;

  constructor(private modalController: ModalController) {
    addIcons({ closeOutline, pencilOutline });
  }

  close() {
    this.modalController.dismiss(null, 'cancel');
  }

  submit() {
    if (!this.content.trim() || this.content.length > this.maxLength) return;
    this.modalController.dismiss(this.content, 'confirm');
  }
}
