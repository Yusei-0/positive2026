import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { SupabaseService } from 'src/app/services/supabase.service';

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
    private supabaseService: SupabaseService
  ) { }

  async ngOnInit() {
    // Check session
    // We can add a small timeout if we want the logo to be visible for at least a moment
    // const minTime = new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const { data } = await this.supabaseService.getUser();
      
      // await minTime; // Optional: wait for minimum time
      
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
