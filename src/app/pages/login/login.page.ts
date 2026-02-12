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
  IonInput,
  IonButton,
  IonToast,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  personOutline,
  checkmarkCircleOutline,
  mailOutline,
  keyOutline,
} from 'ionicons/icons';
import { AppLogoComponent } from '../../components/app-logo/app-logo.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonToast,
    IonSpinner,
    AppLogoComponent,
  ],
})
export class LoginPage {
  email = '';
  otp = '';
  username = ''; // New field for step 3
  step = 1; // 1: Email, 2: OTP, 3: Username
  loading = false;

  toastMessage = '';
  isToastOpen = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    addIcons({ mailOutline, keyOutline, personOutline });
  }

  async sendCode() {
    if (!this.email) {
      this.presentToast('Por favor ingresa un email válido');
      return;
    }

    this.loading = true;
    try {
      const { error } = await this.supabaseService.signInWithOtp(this.email);
      if (error) throw error;

      this.step = 2;
      this.presentToast('¡Código enviado! Revisa tu email.');
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('rate limit') || e.status === 429) {
        this.presentToast('Demasiados intentos. Por favor espera unos minutos.');
      } else {
        this.presentToast('Error al enviar código: ' + e.message);
      }
    } finally {
      this.loading = false;
    }
  }

  async verifyCode() {
    if (!this.otp || this.otp.length < 8) {
      this.presentToast('Ingresa el código de 8 dígitos');
      return;
    }

    this.loading = true;
    try {
      const { data, error } = await this.supabaseService.verifyOtp(
        this.email,
        this.otp
      );
      if (error) throw error;

      if (data.session) {
        // ALWAYS go to setup profile to confirm/change username
        this.router.navigate(['/setup-profile']);
      }
    } catch (e: any) {
      console.error(e);
      this.presentToast('Código inválido o expirado.');
    } finally {
      this.loading = false;
    }
  }

  presentToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }
}
