import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonSpinner, ModalController } from '@ionic/angular/standalone';
import { SupabaseService } from 'src/app/services/supabase.service';
import { environment } from 'src/environments/environment';
import { UpdateRequiredModalComponent } from 'src/app/components/update-required-modal/update-required-modal.component';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, IonSpinner, CommonModule]
})
export class SplashPage implements OnInit {

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private modalController: ModalController
  ) { }

  async ngOnInit() {
    // 1. Check for updates first
    try {
      const { data } = await this.supabaseService.getConfig('latest_version');
      if (data && data.value) {
        const latestVersion = data.value;
        const currentVersion = environment.version;

        if (this.isUpdateRequired(currentVersion, latestVersion)) {
          await this.presentUpdateModal(latestVersion);
          return; // Stop execution if update is displayed (and mandatory)
        }
      }
    } catch (e) {
      console.error('Failed to check version', e);
      // Continue to app if check fails (fail open)
    }

    // 2. Check session
    this.checkAuth();
  }

  isUpdateRequired(current: string, latest: string): boolean {
    // Simple semver comparison (e.g. 0.2.0 vs 0.3.0)
    // Returns true if latest > current
    const v1 = current.split('.').map(Number);
    const v2 = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;

      if (num2 > num1) return true;
      if (num2 < num1) return false;
    }
    return false;
  }

  async presentUpdateModal(requiredVersion: string) {
    const modal = await this.modalController.create({
      component: UpdateRequiredModalComponent,
      componentProps: { requiredVersion },
      backdropDismiss: false, // Force user to interact
      cssClass: 'auto-height-modal'
    });

    await modal.present();

    // If we want to allow them to proceed after closing (for dev or optional updates):
    const { role } = await modal.onDidDismiss();
    // For now, if they dismiss, we proceed to auth check.
    this.checkAuth();
  }

  async checkAuth() {
     try {
      const { data } = await this.supabaseService.getUser();
      
      if (data?.user) {
        this.router.navigate(['/home'], { replaceUrl: true });
      } else {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    } catch (error) {
      console.error('Auth check failed', error);
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
