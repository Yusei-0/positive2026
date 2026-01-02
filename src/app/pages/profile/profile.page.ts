import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonToast,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonSkeletonText,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  createOutline,
  checkmarkOutline,
  closeOutline,
  trashOutline,
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonToast,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonSkeletonText,
  ],
})
export class ProfilePage implements OnInit {
  userProfile: any = null;
  userQuotes: any[] = [];
  loading = true;
  quotesLoading = true;
  editingUsername = false;
  newUsername = '';

  isToastOpen = false;
  toastMessage = '';

  get totalLikes(): number {
    return this.userQuotes.reduce(
      (sum, quote) => sum + (quote.likes_count || 0),
      0
    );
  }

  get totalReports(): number {
    return this.userQuotes.reduce(
      (sum, quote) => sum + (quote.reported_count || 0),
      0
    );
  }

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      logOutOutline,
      createOutline,
      closeOutline,
      checkmarkOutline,
      trashOutline,
    });
  }

  async deleteQuote(quote: any) {
    const alert = await this.alertController.create({
      header: 'Eliminar Frase',
      message:
        '¿Estás seguro de que quieres eliminar esta frase? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              const { error } = await this.supabaseService.deleteQuote(
                quote.id
              );
              if (error) throw error;

              // Remove locally
              this.userQuotes = this.userQuotes.filter(
                (q) => q.id !== quote.id
              );
              this.presentToast('Frase eliminada correctamente');
            } catch (e) {
              console.error('Delete error', e);
              this.presentToast('Error al eliminar la frase');
            }
          },
        },
      ],
    });

    await alert.present();
  }
  async ngOnInit() {
    await this.loadProfile();
    await this.loadUserQuotes();
  }

  async loadProfile() {
    this.loading = true;
    try {
      const {
        data: { user },
      } = await this.supabaseService.getUser();
      if (user) {
        const { data } = await this.supabaseService.getProfile(user.id);
        this.userProfile = data;
        this.newUsername = data?.username || '';
      }
    } catch (e) {
      console.error('Profile load error', e);
    } finally {
      this.loading = false;
    }
  }

  async loadUserQuotes() {
    this.quotesLoading = true;
    try {
      const {
        data: { user },
      } = await this.supabaseService.getUser();
      if (user) {
        const { data, error } = await this.supabaseService.getUserQuotes(
          user.id
        );

        if (error) throw error;
        this.userQuotes = data || [];
      }
    } catch (e) {
      console.error('Quotes load error', e);
    } finally {
      this.quotesLoading = false;
    }
  }

  startEditUsername() {
    this.editingUsername = true;
  }

  cancelEditUsername() {
    this.editingUsername = false;
    this.newUsername = this.userProfile?.username || '';
  }

  async saveUsername() {
    if (!this.newUsername.trim()) {
      this.presentToast('El nombre de usuario no puede estar vacío');
      return;
    }

    try {
      const {
        data: { user },
      } = await this.supabaseService.getUser();
      if (!user) return;

      const { error } = await this.supabaseService.updateProfile({
        id: user.id,
        username: this.newUsername.trim(),
      });

      if (error) throw error;

      this.userProfile.username = this.newUsername.trim();
      this.editingUsername = false;
      this.presentToast('Nombre de usuario actualizado ✨');
    } catch (e: any) {
      console.error(e);
      this.presentToast('Error al actualizar el nombre de usuario');
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          role: 'confirm',
          handler: async () => {
            try {
              await this.supabaseService.signOut();
              this.router.navigate(['/login']);
            } catch (e) {
              console.error('Logout error', e);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  presentToast(message: string) {
    this.toastMessage = message;
    this.isToastOpen = true;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
