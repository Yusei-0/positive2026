import { Component, OnInit } from '@angular/core';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonToast,
  IonFab,
  IonFabButton,
  IonSkeletonText,
  AlertController,
  ModalController,
  LoadingController,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { CreateQuoteModalComponent } from '../components/create-quote-modal/create-quote-modal.component';
import { addIcons } from 'ionicons';
import {
  refreshOutline,
  heartOutline,
  heart,
  add,
  flagOutline,
  shareSocialOutline,
} from 'ionicons/icons';
import { FeedService } from '../services/feed.service';
import { environment } from 'src/environments/environment';
import { SupabaseService } from '../services/supabase.service';
import { Share } from '@capacitor/share';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [

    IonContent,
    IonButton,
    IonIcon,
    IonToast,
    IonFab,
    IonFabButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
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
    private loadingController: LoadingController,
    private supabaseService: SupabaseService,
    private router: Router  ,
    private feedService: FeedService
  ) {
    addIcons({
      add,
      flagOutline,
      heartOutline,
      heart,
      refreshOutline,
      shareSocialOutline,
    });
    this.dailySeed = this.feedService.getDailySeed();
  }

  async ngOnInit() {
    this.loading = true;
    try {
      await this.loadDailyQuote();
      await this.loadUserProfile();
      this.loadCommunityFeed();
    } catch (e) {
      console.error('Initialization error', e);
      this.useFallbackQuote();
    } finally {
      this.loading = false;
    }
  }

  async loadUserProfile() {
    try {
      const {
        data: { user },
      } = await this.supabaseService.getUser();
      if (user) {
        const { data } = await this.supabaseService.getProfile(user.id);
        this.userProfile = data;
      }
    } catch (e) {
      console.error('Profile load error', e);
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  async loadCommunityFeed(event?: any) {
    if (this.currentPage === 0) {
      this.communityLoading = true;
    }

    try {
      const {
        data: { user },
      } = await this.supabaseService.getUser();
      const userId = user?.id || 'anon';

      const { data, error } = await this.feedService.getSmartFeed(
        userId,
        this.currentPage,
        20,
        this.dailySeed
      );

      if (error) throw error;

      const newQuotes = (data || []).map((q: any) => ({
        id: q.id,
        content: q.quote,
        author: q.username || 'Anónimo',
        likes: q.likes_count || 0,
        liked: q.user_liked || false,
        createdAt: this.formatDate(q.created_at),
        profileColor: this.getAvatarColor(q.username || 'A'),
      }));

      if (this.currentPage === 0) {
        this.communityQuotes = newQuotes;
      } else {
        this.communityQuotes = [...this.communityQuotes, ...newQuotes];
      }

      if (newQuotes.length < 20) {
        this.hasMoreQuotes = false;
      }
    } catch (e) {
      console.error('Feed error', e);
      this.communityError = true;
    } finally {
      this.communityLoading = false;
      if (event) {
        event.target.complete();
      }
    }
  }

  loadMore(event: any) {
    if (!this.hasMoreQuotes) {
      event.target.complete();
      return;
    }
    this.currentPage++;
    this.loadCommunityFeed(event);
  }

  refreshFeed(event: any) {
    this.currentPage = 0;
    this.hasMoreQuotes = true;
    this.dailySeed = this.feedService.getShuffleSeed();
    this.loadCommunityFeed(event);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  getAvatarColor(name: string) {
    const colors = [
      '#ff9a9e',
      '#fad0c4',
      '#a18cd1',
      '#fbc2eb',
      '#84fab0',
      '#8fd3f4',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  async ensureDataAvailable() {
    const cachedPhrases = localStorage.getItem('cached_phrases');
    const cachedAuthors = localStorage.getItem('cached_authors');

    if (!cachedPhrases || !cachedAuthors) {
      console.log('Fetching fresh data...');
      const [phrasesResponse, authorsResponse] = await Promise.all([
        fetch(`${environment.apiur}phrases/esp`),
        fetch(`${environment.apiur}authors`),
      ]);

      if (phrasesResponse.ok && authorsResponse.ok) {
        const phrases = await phrasesResponse.json();
        const authors = await authorsResponse.json();

        let cleanPhrases = [];
        if (Array.isArray(phrases)) cleanPhrases = phrases;
        else if (phrases.results) cleanPhrases = phrases.results;

        localStorage.setItem('cached_phrases', JSON.stringify(cleanPhrases));
        localStorage.setItem('cached_authors', JSON.stringify(authors));
      } else {
        throw new Error('API Error');
      }
    }
  }

  async loadDailyQuote() {
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await this.supabaseService.getDailyQuote(today);
      if (data) {
        this.quote = data.quote;
        this.author = data.author || 'Anónimo';
        console.log('Quote from Supabase');
        return;
      }
      if (error) console.warn('Supabase daily quote error:', error.message);
    } catch (err) {
      console.warn('Supabase fetch failed', err);
    }

    console.log('Using Fallback Strategy for Daily Quote');
    await this.ensureDataAvailable();

    const storedDaily = localStorage.getItem('daily_quote_obj');
    if (storedDaily) {
      const parsed = JSON.parse(storedDaily);
      if (parsed.date === today) {
        this.quote = parsed.quote;
        this.author = parsed.author;
        return;
      }
    }
    this.selectRandomFromCache(today);
  }

  selectRandomFromCache(todayStr: string) {
    const phrasesStr = localStorage.getItem('cached_phrases');
    const authorsStr = localStorage.getItem('cached_authors');

    if (phrasesStr && authorsStr) {
      const phrases = JSON.parse(phrasesStr);
      const authors = JSON.parse(authorsStr);

      if (phrases.length > 0) {
        const randomPhrase =
          phrases[Math.floor(Math.random() * phrases.length)];
        let authorName = 'Anónimo';
        if (randomPhrase.author_id) {
          const found = authors.find(
            (a: any) => a.id == randomPhrase.author_id
          );
          if (found) authorName = found.name;
        } else if (randomPhrase.author) {
          authorName = randomPhrase.author;
        }
        const text =
          randomPhrase.text ||
          randomPhrase.phrase ||
          randomPhrase.content ||
          randomPhrase.cita;
        this.quote = text;
        this.author = authorName;
        localStorage.setItem(
          'daily_quote_obj',
          JSON.stringify({
            date: todayStr,
            quote: this.quote,
            author: this.author,
          })
        );
        return;
      }
    }
    this.useFallbackQuote();
  }

  useFallbackQuote() {
    const fallbackOptions = [
      {
        content:
          'La única forma de hacer un gran trabajo es amar lo que haces.',
        author: 'Steve Jobs',
      },
      {
        content: 'Cree que puedes y ya estarás a medio camino.',
        author: 'Theodore Roosevelt',
      },
    ];
    const random =
      fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
    this.quote = random.content;
    this.author = random.author;
  }

  toggleMainLike() {
    this.mainLiked = !this.mainLiked;
    this.mainLikes += this.mainLiked ? 1 : -1;
  }

  async toggleLike(quote: any) {
    if (!this.userProfile) {
      this.presentToast('Debes iniciar sesión para dar like');
      return;
    }
    const previousLiked = quote.liked;
    const previousLikes = quote.likes;
    quote.liked = !quote.liked;
    quote.likes += quote.liked ? 1 : -1;

    try {
      const {
        data: { user },
      } = await this.supabaseService.getUser();
      if (!user) throw new Error('No user');
      if (quote.liked) {
        const { error } = await this.supabaseService.likeQuote(
          quote.id,
          user.id
        );
        if (error) throw error;
      } else {
        const { error } = await this.supabaseService.unlikeQuote(
          quote.id,
          user.id
        );
        if (error) throw error;
      }
    } catch (e) {
      console.error('Like error', e);
      quote.liked = previousLiked;
      quote.likes = previousLikes;
      this.presentToast('Error al dar like');
    }
  }

  async reportQuote(quote: any) {
    if (!this.userProfile) {
      this.presentToast('Debes iniciar sesión para reportar');
      return;
    }
    const alert = await this.alertController.create({
      header: 'Reportar Contenido',
      message:
        '¿Estás seguro de que quieres reportar esta frase como inapropiada?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Reportar',
          role: 'destructive',
          handler: async () => {
            try {
              const { error } = await this.supabaseService.reportQuote(
                quote.id,
                this.userProfile.id
              );
              if (error) throw error;
              this.presentToast('Gracias. Revisaremos el contenido reportado.');
              this.communityQuotes = this.communityQuotes.filter(
                (q) => q.id !== quote.id
              );
            } catch (e) {
              console.error('Report error', e);
              this.presentToast(
                'Error al enviar el reporte. Inténtalo de nuevo.'
              );
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async addQuote() {
    if (!this.userProfile) {
      this.presentToast('Debes iniciar sesión para publicar');
      return;
    }
    const modal = await this.modalController.create({
      component: CreateQuoteModalComponent,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      cssClass: 'custom-modal',
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this.presentToast('Publicando...');
      try {
        const {
          data: { user },
        } = await this.supabaseService.getUser();
        if (!user) throw new Error('No user');
        const { error } = await this.supabaseService.createQuote(data, user.id);
        if (error) throw error;
        this.presentToast('¡Frase publicada con éxito! ✨');
        this.loadCommunityFeed();
      } catch (e) {
        console.error(e);
        this.presentToast('Error al publicar. Inténtalo de nuevo.');
      }
    }
  }

  /* async downloadImage(elementId: string) {
      // Removed functionality
  } */

  /* downloadBlob(blob: Blob) {
     // Removed functionality
  } */

  async shareQuote(
    quoteContent: string = this.quote,
    quoteAuthor: string = this.author
  ) {
    const text = `"${quoteContent}" — ${quoteAuthor}\n\nDescubre más en Positive 2026 ✨`;

    try {
      await Share.share({
        title: 'Positive 2026',
        text: text,
        dialogTitle: 'Compartir frase',
      });
    } catch (e) {
      console.error('Share failed', e);
      // Fallback para web si Share API no está disponible (aunque Capacitor lo maneja bien)
      if (navigator.share) {
        navigator
          .share({
            title: 'Positive 2026',
            text: text,
          })
          .catch((err) => console.error('Web share failed', err));
      } else {
        // Fallback final: Copiar al portapapeles (usando API web simple)
        this.copyToClipboard(text);
      }
    }
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.presentToast('Frase copiada al portapapeles');
    } catch (err) {
      console.error('Clipboard failed', err);
      this.presentToast('No se pudo compartir');
    }
  }



  presentToast(message: string) {
    this.toastMessage = message;
    this.isToastOpen = true;
  }
}
