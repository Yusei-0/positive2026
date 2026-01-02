import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  template: `
    <div class="logo-container" [style.width]="size" [style.height]="size">
      <img src="assets/logo.svg" alt="Positive 2026 Logo" />
    </div>
  `,
  styles: [
    `
      .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 20%; /* Squircle-ish */
        padding: 10%;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        backdrop-filter: blur(5px);

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule],
})
export class AppLogoComponent {
  @Input() size: string = '80px';
}
