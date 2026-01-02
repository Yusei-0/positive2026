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
  flagOutline,
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
    addIcons({
      shareSocialOutline,
      copyOutline,
      flagOutline,
      add,
      heartOutline,
      heart,
      refreshOutline,
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
    // Check if we have data cached
    const cachedPhrases = localStorage.getItem('cached_phrases');
    const cachedAuthors = localStorage.getItem('cached_authors');

    if (!cachedPhrases || !cachedAuthors) {
      // Fetch All Data
      console.log('Fetching fresh data...');
      const [phrasesResponse, authorsResponse] = await Promise.all([
        fetch(`${environment.apiur}phrases/esp`),
        fetch(`${environment.apiur}authors`),
      ]);

      if (phrasesResponse.ok && authorsResponse.ok) {
        const phrases = await phrasesResponse.json();
        const authors = await authorsResponse.json();

        // Normalize phrases array
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

    // 1. Try fetching from Supabase (Official Daily Quote)
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

    // 2. Fallback: Internal logic (previously "Local Caching Strategy")
    // If Supabase has no quote for today, we use our robust fallback logic
    // which eventually uses the external API or local phrases.
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

        // Resolve author
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

        // Save for today
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

  // --- Community Logic ---

  async toggleLike(quote: any) {
    if (!this.userProfile) {
      this.presentToast('Debes iniciar sesión para dar like');
      return;
    }

    const previousLiked = quote.liked;
    const previousLikes = quote.likes;

    // Optimistic UI update
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
      // Revert on error
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
        {
          text: 'Cancelar',
          role: 'cancel',
        },
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
              // Optionally hide the quote locally
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
    // Check auth
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

  // --- Image Generation Logic ---

  async generateImageBlob(elementId: string): Promise<Blob | null> {
    const original = document.getElementById(elementId);
    if (!original) return null;

    // 1. Create wrapper (The Canvas Context)
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '-9999px';
    wrapper.style.left = '-9999px';
    wrapper.style.width = '1080px';
    wrapper.style.height = '1080px';

    // Background: App Signature Gradient
    wrapper.style.background =
      'linear-gradient(135deg, #f0f7d1 0%, #c3cfe2 100%)';

    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.padding = '80px';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.fontFamily = "'Outfit', sans-serif";

    // 2. Create the Quote Card (Glassmorphism)
    const card = document.createElement('div');
    card.style.background = 'rgba(255, 255, 255, 0.85)';
    card.style.backdropFilter = 'blur(20px)';
    card.style.borderRadius = '40px';
    card.style.padding = '80px 60px';
    card.style.width = '100%';
    card.style.maxWidth = '850px';
    card.style.boxShadow =
      '0 30px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.justifyContent = 'center';
    card.style.textAlign = 'center';
    card.style.position = 'relative';

    // 3. Extract Content from Original Element
    // Specific selectors first to avoid ambiguity
    const textEl =
      original.querySelector('.com-text') ||
      original.querySelector('h1') ||
      original.querySelector('.quote-text');
    let noteText = textEl?.textContent?.trim() || '';
    // Clean up quotes if present in the capture
    noteText = noteText.replace(/^"|"$/g, '');

    const authorEl =
      original.querySelector('.com-author') ||
      original.querySelector('.quote-author') ||
      original.querySelector('p:not(.com-text)');
    let authorText = authorEl?.textContent?.trim() || 'Anónimo';
    // Clean up dash if present
    authorText = authorText.replace(/^—\s*/, '');

    // 4. Build Internal Structure

    // Quote Icon
    const quoteIcon = document.createElement('div');
    quoteIcon.innerHTML = '❝';
    quoteIcon.style.fontSize = '120px';
    quoteIcon.style.height = '80px';
    quoteIcon.style.lineHeight = '120px';
    quoteIcon.style.color = '#56ab2f'; // Primary Green
    quoteIcon.style.opacity = '0.3';
    quoteIcon.style.fontFamily = 'serif';
    quoteIcon.style.marginBottom = '20px';
    card.appendChild(quoteIcon);

    // Main Text
    const textNode = document.createElement('h1');
    textNode.innerText = noteText;
    textNode.style.fontSize = noteText.length > 100 ? '42px' : '56px';
    textNode.style.fontWeight = '700';
    textNode.style.color = '#2d3436';
    textNode.style.lineHeight = '1.3';
    textNode.style.margin = '0 0 30px 0';
    textNode.style.letterSpacing = '-1px';
    card.appendChild(textNode);

    // Separator
    const sep = document.createElement('div');
    sep.style.width = '60px';
    sep.style.height = '6px';
    sep.style.background = '#56ab2f';
    sep.style.borderRadius = '3px';
    sep.style.margin = '0 auto 30px auto';
    card.appendChild(sep);

    // Author
    const authorNode = document.createElement('p');
    authorNode.innerText = authorText;
    authorNode.style.fontSize = '32px';
    authorNode.style.fontWeight = '500';
    authorNode.style.color = '#636e72';
    authorNode.style.margin = '0';
    card.appendChild(authorNode);

    wrapper.appendChild(card);

    // 5. Add Brand Footer (Logo + Name)
    const footer = document.createElement('div');
    footer.style.marginTop = '60px';
    footer.style.display = 'flex';
    footer.style.flexDirection = 'row'; // Side by side
    footer.style.alignItems = 'center';
    footer.style.gap = '20px';

    // Logo Container
    const logoContainer = document.createElement('div');
    logoContainer.style.background = 'rgba(255, 255, 255, 0.9)'; // Slightly translucent white or solid
    logoContainer.style.backdropFilter = 'blur(10px)';
    logoContainer.style.borderRadius = '25px'; // Rounded corners (Squircleish)
    logoContainer.style.padding = '12px';
    logoContainer.style.display = 'flex';
    logoContainer.style.alignItems = 'center';
    logoContainer.style.justifyContent = 'center';
    logoContainer.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';

    // Logo Image
    const logoImg = new Image();
    logoImg.src = 'assets/logo.svg';
    logoImg.style.width = '90px';
    logoImg.style.height = '90px';
    logoImg.style.objectFit = 'contain';

    logoContainer.appendChild(logoImg);
    footer.appendChild(logoContainer);

    // App Name
    const brandName = document.createElement('span');
    brandName.innerText = 'Positive 2026';
    brandName.style.fontSize = '36px'; // Slightly larger text
    brandName.style.fontWeight = '700';
    brandName.style.color = '#2d3436';
    brandName.style.letterSpacing = '1px';
    brandName.style.textTransform = 'uppercase';
    brandName.style.opacity = '0.8';
    footer.appendChild(brandName);

    wrapper.appendChild(footer);

    document.body.appendChild(wrapper);

    // 6. Capture
    try {
      // Small delay to ensure image loads
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(wrapper, {
        scale: 2, // 2x scale for Retina sharpness (2160x2160 output)
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      document.body.removeChild(wrapper);
      return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    } catch (e) {
      document.body.removeChild(wrapper);
      console.error(e);
      return null;
    }
  }

  async shareImage(elementId: string = 'main-quote-card') {
    this.presentToast('Generando imagen...');
    try {
      const blob = await this.generateImageBlob(elementId);
      if (!blob) throw new Error('Blob generation failed');

      const file = new File([blob], 'positive.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Positive 2026',
          text: 'Mira esta frase ✨',
        });
      } else {
        this.downloadBlob(blob);
      }
    } catch (e) {
      console.error(e);
      this.presentToast('No se pudo compartir');
    }
  }

  async copyImage(elementId: string = 'main-quote-card') {
    this.presentToast('Copiando...');
    try {
      const blob = await this.generateImageBlob(elementId);
      if (!blob) throw new Error('Blob generation failed');
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        this.presentToast('Copiado al portapapeles');
      } else {
        this.presentToast('Navegador no soportado');
      }
    } catch (e) {
      this.presentToast('Error al copiar');
    }
  }

  downloadBlob(blob: Blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'positive_vibes.png';
    link.click();
    this.presentToast('Imagen descargada');
  }

  presentToast(message: string) {
    this.toastMessage = message;
    this.isToastOpen = true;
  }
}
