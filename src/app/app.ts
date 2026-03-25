import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: [':host { display: block; height: 100%; }'],
})
export class App {
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const swUpdate = inject(SwUpdate);
    if (!swUpdate.isEnabled) return;

    // Dès qu'une nouvelle version est disponible, recharger automatiquement
    swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        document.location.reload();
      }
    });
  }
}
