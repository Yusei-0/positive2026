import { Component, OnInit } from '@angular/core';
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
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { personOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-setup-profile',
  templateUrl: './setup-profile.page.html',
  styleUrls: ['./setup-profile.page.scss'],
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
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon,
  ],
})
export class SetupProfilePage implements OnInit {
  username = '';
  loading = false;
  errorMsg = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    addIcons({ personOutline, checkmarkCircleOutline });
  }

  async ngOnInit() {
    this.loading = true;
    try {
      const {
        data: { user },
      } = await this.supabaseService.getUser();
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      const { data: profile } = await this.supabaseService.getProfile(user.id);
      if (profile && profile.username) {
        this.username = profile.username;
      }
    } catch (e) {
      console.error('Error loading profile', e);
    } finally {
      this.loading = false;
    }
  }

  async saveUsername() {
    if (!this.username || this.username.length < 3) {
      this.errorMsg = 'El usuario debe tener mínimo 3 letras';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    try {
      const {
        data: { user },
      } = await this.supabaseService.getUser();
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      // Update profile
      const { error } = await this.supabaseService.updateProfile({
        id: user.id,
        username: this.username,
        // we can add avatar_url here later
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Success, go home
      this.router.navigate(['/home'], { replaceUrl: true });
    } catch (e: any) {
      console.error(e);
      this.errorMsg = 'Error al guardar: ' + e.message;
    } finally {
      this.loading = false;
    }
  }
}
