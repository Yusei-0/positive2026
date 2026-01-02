import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonButtons,
  IonToast,
  IonFab,
  IonFabButton,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonSkeletonText,
  AlertController,
  ModalController,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { CreateQuoteModalComponent } from '../components/create-quote-modal/create-quote-modal.component';
import { addIcons } from 'ionicons';
import {
  refreshOutline,
  heartOutline,
  shareSocialOutline,
  logoWhatsapp,
  downloadOutline,
  copyOutline,
  heart,
  add,
  flagOutline
} from 'ionicons/icons';
import html2canvas from 'html2canvas';
import { environment } from 'src/environments/environment';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { FeedService } from '../services/feed.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonToast,
    IonFab,
    IonFabButton,
    IonList,
    IonItem,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonLabel,
    IonAvatar,
    IonSkeletonText,
  ],
})
export class HomePage implements OnInit {
  // Main Daily Quote State
  quote: string = '';
  author: string = '';
  loading: boolean = true;

  // Main Like State
  mainLiked: boolean = false;
  mainLikes: number = 342; // Mock start count

  // Community State
  communityQuotes: any[] = [];
  communityLoading: boolean = true;
  communityError: boolean = false;
  
  // Pagination State
  currentPage = 0;
  dailySeed: string = '';
  hasMoreQuotes = true;

  error: boolean = false;
  isToastOpen = false;
  toastMessage = '';

  userProfile: any = null;

  constructor(
    private alertController: AlertController,
    private modalController: ModalController,
    private supabaseService: SupabaseService,
    private router: Router,
    private feedService: FeedService
  ) {
    addIcons({ heartOutline, heart, copyOutline, shareSocialOutline, add, refreshOutline, flagOutline });
    this.dailySeed = this.feedService.getDailySeed();
  }

  async ngOnInit() {
    await this.loadUserProfile();
    await this.loadDailyQuote();
    await this.loadCommunityFeed();
  }

  // ... rest of the file logic will be appended here if I rewrite, but replacing is safer for large files.
  // I will use replace_file_content to fix the top part first.
