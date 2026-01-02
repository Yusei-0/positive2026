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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refreshOutline,
  heartOutline,
  shareSocialOutline,
  logoWhatsapp,
  downloadOutline,
  copyOutline,
} from 'ionicons/icons';
import html2canvas from 'html2canvas';
import { environment } from 'src/environments/environment';

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
  ],
})
export class HomePage implements OnInit {
  quote: string = '';
  author: string = '';
  loading: boolean = true;
  error: boolean = false;
  isToastOpen = false;
  toastMessage = '';

  constructor() {
    addIcons({ heartOutline, copyOutline, shareSocialOutline });
  }

  async ngOnInit() {
    this.loading = true;
    try {
      await this.ensureDataAvailable();
      this.loadDailyQuote();
    } catch (e) {
      console.error('Initialization error', e);
      // Fallback if everything fails
      this.useFallbackQuote();
    } finally {
      this.loading = false;
    }
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

  loadDailyQuote() {
    const today = new Date().toISOString().split('T')[0];
    const storedDaily = localStorage.getItem('daily_quote_obj');

    if (storedDaily) {
      const parsed = JSON.parse(storedDaily);
      if (parsed.date === today) {
        this.quote = parsed.quote;
        this.author = parsed.author;
        return;
      }
    }

    // Select new quote from cache
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
      {
        content: 'El éxito no es definitivo, el fracaso no es fatal.',
        author: 'Winston Churchill',
      },
    ];
    const random =
      fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
    this.quote = random.content;
    this.author = random.author;
  }

  // --- Image Generation Logic ---

  async generateImageBlob(): Promise<Blob | null> {
    const captureElement = document.getElementById('capture-container');
    if (!captureElement) return null;

    // html2canvas config
    const canvas = await html2canvas(captureElement, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: null,
      scale: 2,
      ignoreElements: (el) => el.classList.contains('exclude-from-capture'),
    });

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  async shareImage() {
    this.presentToast('Generando imagen para compartir...');
    try {
      const blob = await this.generateImageBlob();
      if (!blob) throw new Error('Blob generation failed');

      const file = new File([blob], 'positive_vibes.png', {
        type: 'image/png',
      });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Positive 2026',
          text: 'Mi frase del día ✨',
        });
      } else {
        this.downloadBlob(blob);
      }
    } catch (e) {
      console.error('Share failed', e);
      this.presentToast('No se pudo compartir');
    }
  }

  async copyImage() {
    this.presentToast('Copiando imagen...');
    try {
      const blob = await this.generateImageBlob();
      if (!blob) throw new Error('Blob generation failed');

      // Modern clipboard API for images
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        this.presentToast('Imagen copiada al portapapeles');
      } else {
        this.presentToast('Tu navegador no soporta copiar imagenes');
      }
    } catch (e) {
      console.error('Copy failed', e);
      this.presentToast('Error al copiar imagen');
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
