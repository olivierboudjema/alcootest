import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, CategoryScale, LinearScale, PointElement, LineElement, LineController, Title, Tooltip, Legend, Filler } from 'chart.js';
import { SupabaseService } from '../../services/supabase.service';
import { CalculService } from '../../services/calcul.service';
import { StorageService } from '../../services/storage.service';
import { EtatService } from '../../services/etat.service';
import { RoastService } from '../../services/roast.service';
import { ConsommationAlcool, UserProfile, AlcoholeDataPoint } from '../../models/types';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col overflow-hidden"
         style="height: 100dvh">

      <!-- Header : flex 1 (~10%) -->
      <div class="px-4 py-1 flex items-center" style="flex: 1; min-height: 0; padding-top: env(safe-area-inset-top)">
        <div class="max-w-md mx-auto w-full">
          <div class="bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur px-2 py-1.5 rounded-lg border border-blue-500/20">
            <div class="flex items-center gap-2 text-xs justify-between">
              <h1 class="font-bold text-white text-sm">{{ currentSoireeName() }}</h1>
              <b><span class="text-gray-300">{{ activeUsername() }}</span></b>
              <div class="flex items-center gap-1">
                <select [(ngModel)]="userProfile.sexe" (change)="onProfileChange()"
                  class="px-1 py-0.5 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none text-xs">
                  <option value="H">H</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div class="flex items-center gap-1">
                <input [(ngModel)]="userProfile.age" (change)="onProfileChange()" type="number"
                  class="w-10 px-1 py-0.5 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none text-xs" />
                <span class="text-gray-400">ans</span>
              </div>
              <div class="flex items-center gap-1">
                <input [(ngModel)]="userProfile.poids" (change)="onProfileChange()" type="number"
                  class="w-10 px-1 py-0.5 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none text-xs" />
                <span class="text-gray-400">kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphique : flex 4 (~40%) -->
      <div class="px-4 pb-2" style="flex: 4; min-height: 0">
        <div class="max-w-md mx-auto h-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur p-3 rounded-lg border border-blue-500/20 flex flex-col">
          <div class="text-center flex-shrink-0 mb-1">
            <div class="text-2xl font-bold text-green-400">{{ currentTaux() }}g/L</div>
          </div>
          <div class="flex-1 min-h-0 relative">
            <canvas id="alcoholChart" #chartCanvas class="w-full h-full"></canvas>
            @if (showReturnToNow()) {
              <button (click)="returnToNow()"
                class="absolute top-1 right-1 bg-blue-500/80 hover:bg-blue-400 text-white text-xs px-2 py-1 rounded-full backdrop-blur transition">
                ⏱ Maintenant
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Image + état : flex 4 (~40%) -->
      <div class="px-4 pb-2" style="flex: 4; min-height: 0">
        <div class="max-w-md mx-auto h-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur p-3 rounded-lg border border-blue-500/20 text-white flex flex-col">
          <p class="text-xs text-blue-200 mb-1 tracking-wide flex-shrink-0">Ressenti à {{ timeDisplay() }} : {{ statusLabel() }}</p>
          <img [src]="imageUrl()" alt="État d'alcool"
            class="flex-1 min-h-0 w-full object-contain rounded-lg" />
          <p class="text-sm italic text-yellow-300 flex-shrink-0 mt-1">{{ etatDetaille() }}</p>
        </div>
      </div>

      <!-- Footer : flex 1 (~10%) -->
      <div class="px-4 flex items-center" style="flex: 1; min-height: 0; padding-bottom: env(safe-area-inset-bottom)">
        <div class="max-w-md mx-auto w-full">
          <div class="bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur p-2 rounded-lg border border-blue-500/20 flex gap-2">
            <button (click)="goToAddDrink()"
              class="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2 rounded-lg font-bold text-sm hover:shadow-lg transition">
              ➕ Ajouter un verre
            </button>
            <button (click)="endSoiree()"
              class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-sm transition">
              💾 Sauver la soirée
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;
  private realtimeChannel: any = null;
  private supabase = inject(SupabaseService);
  private calcul = inject(CalculService);
  private storage = inject(StorageService);
  private etat = inject(EtatService);
  private roast = inject(RoastService);
  private router = inject(Router);

  private platformId = inject(PLATFORM_ID);
  private roastLoaded = false;

  // Signaux
  currentSoireeName = signal('');
  activeUsername = signal('');
  currentTaux = signal('0.00');
  statusDescription = signal('');
  emoji = signal('😇');
  statusText = signal('');
  etatDetaille = signal('');
  imageUrl = signal('/assets/etat/0.0.jpg');
  selectedTimeMinutes = signal<number | null>(null);
  timeDisplay = signal('');
  statusLabel = signal('');
  showReturnToNow = signal(false);

  drinks: ConsommationAlcool[] = [];
  private dataPoints: AlcoholeDataPoint[] = [];
  private currentTimeFromFirstDrink = 0;
  private isUserSelecting = false;
  private lastUserSelectionTime: number | null = null;

  // Propriété ordinaire pour le profil utilisateur (à utiliser avec ngModel)
  userProfile: UserProfile = {
    age: 25,
    poids: 70,
    sexe: 'H',
    manage_avant: false,
  };

  soireeId = signal<number | null>(null);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Register Chart.js components
    Chart.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Title, Tooltip, Legend, Filler);

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    this.initializeDashboard();
    // Mettre à jour toutes les 5 secondes
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateChartData());
  }

  private async initializeDashboard() {
    try {
      const soireeIdStr = this.storage.getCurrentSoiree();
      const username = this.storage.getUsername();
      const profile = this.storage.getUserProfile();

      if (!soireeIdStr || !username) {
        this.router.navigate(['/']);
        return;
      }

      const soireeId = Number(soireeIdStr);
      this.soireeId.set(soireeId);
      this.activeUsername.set(username);
      this.userProfile = profile || this.userProfile;

      const soiree = await this.supabase.getSoiree(soireeIdStr);
      this.currentSoireeName.set(soiree.name);

      // Charger les consommations de cette soirée
      await this.loadDrinks();

      // S'abonner aux mises à jour en temps réel
      this.realtimeChannel = this.supabase.subscribeToDrinks(soireeId, async () => {
        await this.loadDrinks();
      });

      // Initialiser le graphique
      setTimeout(() => {
        this.initChart();
        this.updateChartData();
        // Sur iOS PWA, le layout peut ne pas être stabilisé au premier chargement
        // On force un resize après que le viewport soit finalisé
        setTimeout(() => {
          this.chart?.resize();
          this.updateChartData();
        }, 300);
      }, 100);
    } catch (error) {
      console.error('Erreur initialisation:', error);
      this.router.navigate(['/']);
    }
  }

  private async loadDrinks() {
    try {
      const soireeId = this.soireeId();
      if (soireeId !== null) {
        this.drinks = await this.supabase.getDrinksBySoiree(soireeId);
        this.updateChartData();
        this.refreshRoast();
      }
    } catch (error) {
      console.error('Erreur chargement consommations:', error);
    }
  }

  private async refreshRoast() {
    const taux = parseFloat(this.currentTaux());
    const phrase = await this.roast.generateRoast(
      this.activeUsername(),
      this.currentSoireeName(),
      this.drinks,
      taux
    );
    this.etatDetaille.set(phrase);
    this.roastLoaded = true;
  }

  goToAddDrink() {
    this.router.navigate(['/add-drink']);
  }

  private initChart() {
    const canvas = document.getElementById('alcoholChart') as HTMLCanvasElement;
    if (!canvas || this.chart) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Plugin barre rouge — défini ici pour capturer `this` correctement à chaque création
    const component = this;

    const datePlugin = {
      id: `dateLabel_${Math.random()}`,
      afterDatasetsDraw(chart: any) {
        if (component.drinks.length === 0) return;
        const firstDrink = component.drinks.reduce((earliest: any, d: any) =>
          d.heure_consomation < earliest.heure_consomation ? d : earliest
        );
        const d = firstDrink.heure_consomation;
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString().slice(-2);
        const label = `${day}/${month}/${year}`;

        chart.ctx.save();
        chart.ctx.font = '10px sans-serif';
        chart.ctx.fillStyle = 'rgba(180, 180, 180, 0.7)';
        chart.ctx.textAlign = 'left';
        chart.ctx.textBaseline = 'top';
        chart.ctx.fillText(label, chart.chartArea.left + 4, chart.chartArea.top + 4);
        chart.ctx.restore();
      }
    };

    const drinksPlugin = {
      id: `drinks_${Math.random()}`,
      afterDatasetsDraw(chart: any) {
        if (component.drinks.length === 0 || component.dataPoints.length === 0) return;

        const firstDrinkMs = component.drinks.reduce((e: any, d: any) =>
          d.heure_consomation < e.heure_consomation ? d : e
        ).heure_consomation.getTime();

        const xScale = chart.scales['x'];
        const yScale = chart.scales['y'];
        const ctx = chart.ctx;

        const emojiMap: Record<string, string> = {
          vin: '🍷', champagne: '🍷', biere: '🍺',
          cocktail: '🍹', 'spiritueux pur': '🥃', shot: '🔥',
        };
        // Dernier emoji par index (si plusieurs verres au même instant)
        const emojiByIndex: Record<number, { emoji: string }> = {};
        for (const drink of component.drinks) {
          const timeH = (drink.heure_consomation.getTime() - firstDrinkMs) / 3600000;
          let idx = 0, minDiff = Math.abs(component.dataPoints[0].time - timeH);
          for (let i = 1; i < component.dataPoints.length; i++) {
            const diff = Math.abs(component.dataPoints[i].time - timeH);
            if (diff < minDiff) { minDiff = diff; idx = i; }
          }
          emojiByIndex[idx] = { emoji: emojiMap[drink.type] ?? '🍶' };
        }

        ctx.save();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const [idxStr, { emoji }] of Object.entries(emojiByIndex)) {
          const idx = Number(idxStr);
          const xPos = xScale.getPixelForValue(idx);
          const taux = component.dataPoints[idx]?.taux ?? 0;
          const yPos = yScale.getPixelForValue(taux);
          ctx.fillText(emoji, xPos, yPos - 14);
        }
        ctx.restore();
      }
    };

    const redLinePlugin = {
      id: `redLine_${Math.random()}`, // id unique pour éviter les conflits de re-registration globale
      afterDatasetsDraw(chart: any) {
        if (component.selectedTimeMinutes() === null) return;
        if (component.dataPoints.length === 0) return;

        const selectedTime = component.selectedTimeMinutes()!;

        // Trouver l'index du point le plus proche
        let selectedIndex = 0;
        let minDiff = Math.abs(component.dataPoints[0].time - selectedTime);
        for (let i = 1; i < component.dataPoints.length; i++) {
          const diff = Math.abs(component.dataPoints[i].time - selectedTime);
          if (diff < minDiff) { minDiff = diff; selectedIndex = i; }
        }

        const xScale = chart.scales['x'];
        const yScale = chart.scales['y'];
        const xPos = xScale.getPixelForValue(selectedIndex);

        chart.ctx.save();
        chart.ctx.strokeStyle = '#ff4444';
        chart.ctx.lineWidth = 2;
        chart.ctx.setLineDash([4, 3]);
        chart.ctx.beginPath();
        chart.ctx.moveTo(xPos, yScale.top);
        chart.ctx.lineTo(xPos, yScale.bottom);
        chart.ctx.stroke();
        chart.ctx.restore();
      }
    };

    // Create initial empty chart
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Taux d\'alcoolémie (g/L)',
          data: [],
          borderColor: '#00ff00',
          borderWidth: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00ff00',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        scales: {
          x: {
            type: 'category',
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#999',
              font: { size: 10 },
              maxRotation: 45,
              minRotation: 0,
            },
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#999',
              font: { size: 10 },
              callback: (value) => `${value}`,
            },
            min: 0,
            max: 2,
          },
        },
      },
      plugins: [datePlugin, drinksPlugin, redLinePlugin], // plugins locaux à cette instance, pas globaux
    };

    try {
      this.chart = new Chart(canvas, config);

      // Add wheel event for zoom
      canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));

      // Add click event to select time
      canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    } catch (error) {
      console.error('Erreur création chart:', error);
      return;
    }

    // Update with initial data
    this.updateChartData();
  }

  private updateChart() {
    if (!this.chart) {
      this.initChart();
      return;
    }
    this.updateChartData();
  }

  private handleCanvasWheel(event: WheelEvent) {
    if (!this.chart) return;
    event.preventDefault();

    const scale = event.deltaY > 0 ? 0.9 : 1.1;
    const yScale = (this.chart.options.scales!['y'] as any);
    const newMax = yScale.max * scale;

    yScale.max = Math.min(Math.max(newMax, 1), 5);
    this.chart.update('none');
  }

  private handleCanvasClick(event: MouseEvent) {
    if (!this.chart) return;

    this.isUserSelecting = true;
    this.lastUserSelectionTime = Date.now();

    const canvasPosition = {
      x: event.offsetX,
      y: event.offsetY,
    };

    const xScale = this.chart.scales['x'];
    const canvasWidth = this.chart.chartArea.width;
    const canvasLeft = this.chart.chartArea.left;

    // Normaliser la position X du clic
    const relativeX = canvasPosition.x - canvasLeft;
    const pointIndex = Math.round((relativeX / canvasWidth) * (this.dataPoints.length - 1));

    if (pointIndex >= 0 && pointIndex < this.dataPoints.length) {
      const selectedPoint = this.dataPoints[pointIndex];
      this.selectedTimeMinutes.set(selectedPoint.time);

      // Utiliser directement la valeur du point au lieu de recalculer
      this.currentTaux.set(selectedPoint.taux.toFixed(2));
      this.imageUrl.set(this.etat.getImageByTaux(selectedPoint.taux));
      const etatAlcool = this.etat.getEtatByTaux(selectedPoint.taux);
      if (!this.roastLoaded) this.etatDetaille.set(etatAlcool.status);
      this.statusLabel.set(etatAlcool.status);
      this.emoji.set(this.calcul.getEmoji(selectedPoint.taux));
      this.statusDescription.set(this.calcul.getStatusDescription(selectedPoint.taux));

      const firstDrinkMs = this.drinks.reduce((e: any, d: any) =>
        d.heure_consomation < e.heure_consomation ? d : e
      ).heure_consomation.getTime();
      const clockDate = new Date(firstDrinkMs + selectedPoint.time * 3600 * 1000);
      this.timeDisplay.set(`${clockDate.getHours().toString().padStart(2, '0')}:${clockDate.getMinutes().toString().padStart(2, '0')}`);

      // Mettre à jour le bouton "Maintenant" immédiatement
      const nowInHours = this.currentTimeFromFirstDrink / 60;
      const graphStartTime = this.dataPoints.length > 0 ? this.dataPoints[0].time : -1;
      const graphEndTime = this.dataPoints.length > 0 ? this.dataPoints[this.dataPoints.length - 1].time : 0;
      this.showReturnToNow.set(nowInHours >= graphStartTime && nowInHours <= graphEndTime);

      // Redessiner le graphique pour afficher la ligne rouge
      if (this.chart) {
        this.chart.update('none');
      }
    }
  }

  private updateChartData() {
    if (!this.chart) return;

    // Calculer le taux actuel en utilisant le premier verre réel (le plus ancien)
    let timeFromFirstDrink = 0;
    if (this.drinks.length > 0) {
      const earliestDrink = this.drinks.reduce((earliest, drink) =>
        drink.heure_consomation < earliest.heure_consomation ? drink : earliest
      );
      timeFromFirstDrink = (Date.now() - earliestDrink.heure_consomation.getTime()) / (1000 * 60);
    }

    this.currentTimeFromFirstDrink = timeFromFirstDrink;

    const dataPoints = this.calcul.generateGraphData(
      this.drinks,
      this.userProfile,
      24
    );

    // Ajouter 1h de données vides avant le premier verre
    const paddingPoints: AlcoholeDataPoint[] = [];
    for (let i = 12; i >= 1; i--) {
      paddingPoints.push({ time: -(i * 5) / 60, taux: 0 });
    }
    this.dataPoints = [...paddingPoints, ...dataPoints];

    // Auto-scale Y selon le pic réel (seulement si l'utilisateur n'a pas zoomé manuellement)
    if (!this.isUserSelecting && this.chart) {
      const maxTaux = Math.max(...dataPoints.map(p => p.taux), 0);
      const yMax = Math.max(Math.ceil(maxTaux * 10 + 1) / 10, 1);
      (this.chart.options.scales!['y'] as any).max = yMax;
    }

    // Auto-retour à maintenant après 5 minutes d'inactivité
    if (this.isUserSelecting && this.lastUserSelectionTime !== null) {
      if (Date.now() - this.lastUserSelectionTime >= 60 * 1000) {
        this.isUserSelecting = false;
        this.lastUserSelectionTime = null;
      }
    }

    // Barre rouge : afficher uniquement si "maintenant" est dans l'intervalle [graph début, taux=0]
    const nowInHours = timeFromFirstDrink / 60;
    const graphStartTime = this.dataPoints.length > 0 ? this.dataPoints[0].time : -1;
    const graphEndTime = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].time : 0;
    const nowIsInGraph = nowInHours >= graphStartTime && nowInHours <= graphEndTime;

    if (!this.isUserSelecting) {
      if (nowIsInGraph) {
        this.selectedTimeMinutes.set(nowInHours);
      } else {
        this.selectedTimeMinutes.set(null);
      }
    }

    this.showReturnToNow.set(this.isUserSelecting && nowIsInGraph);

    // Utiliser les données du point sélectionné si présent, sinon utiliser le temps actuel
    let displayTaux = 0;
    if (this.selectedTimeMinutes() !== null && dataPoints.length > 0) {
      // Trouver le point correspondant au temps sélectionné
      const selectedTime = this.selectedTimeMinutes()!;
      let closestPoint = dataPoints[0];
      let minDiff = Math.abs(dataPoints[0].time - selectedTime);

      for (const point of dataPoints) {
        const diff = Math.abs(point.time - selectedTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = point;
        }
      }

      displayTaux = closestPoint.taux;
    } else {
      // Utiliser le taux actuel
      displayTaux = this.calcul.calculateAlcoholLevel(
        this.drinks,
        this.userProfile,
        timeFromFirstDrink
      );
    }

    this.currentTaux.set(displayTaux.toFixed(2));
    this.statusDescription.set(
      this.calcul.getStatusDescription(displayTaux)
    );
    this.emoji.set(this.calcul.getEmoji(displayTaux));

    // Afficher l'état "fin" si la soirée est terminée (on est après la fin du graphe)
    const soireeTerminee = !this.isUserSelecting && !nowIsInGraph && nowInHours > graphEndTime;
    if (soireeTerminee) {
      this.imageUrl.set(this.etat.getImageFin());
      const etatFin = this.etat.getEtatFin();
      if (!this.roastLoaded) this.etatDetaille.set(etatFin.status);
      this.statusLabel.set(etatFin.status);
    } else {
      this.imageUrl.set(this.etat.getImageByTaux(displayTaux));
      const etatAlcool = this.etat.getEtatByTaux(displayTaux);
      if (!this.roastLoaded) this.etatDetaille.set(etatAlcool.status);
      this.statusLabel.set(etatAlcool.status);
    }

    // Labels en heure réelle (heure du premier verre + offset)
    const firstDrinkMs = this.drinks.length > 0
      ? this.drinks.reduce((earliest, d) =>
        d.heure_consomation < earliest.heure_consomation ? d : earliest
      ).heure_consomation.getTime()
      : Date.now();

    if (this.selectedTimeMinutes() !== null) {
      const d = new Date(firstDrinkMs + this.selectedTimeMinutes()! * 3600 * 1000);
      this.timeDisplay.set(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    } else {
      const now = new Date();
      this.timeDisplay.set(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }

    const labels = this.dataPoints.map((p: AlcoholeDataPoint) => {
      const d = new Date(firstDrinkMs + p.time * 3600 * 1000);
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${h}h${m}`;
    });

    // Update chart data
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = this.dataPoints.map((p: AlcoholeDataPoint) => p.taux);

    // Debug: voir le contenu et le calcul
    console.debug('Dashboard graphique', {
      drinks: this.drinks,
      timeFromFirstDrink,
      displayTaux,
      dataPoints: dataPoints.slice(0, 5), // premiers 5 points seulement
      userProfile: this.userProfile,
    });

    // Update gradient
    const canvas = this.chart.canvas;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#00ff00'); // Vert
      gradient.addColorStop(0.25, '#ffff00'); // Jaune
      gradient.addColorStop(0.5, '#ff9900'); // Orange
      gradient.addColorStop(0.75, '#ff0000'); // Rouge
      gradient.addColorStop(1, '#8b00ff'); // Violet

      this.chart.data.datasets[0].borderColor = gradient;
    }

    this.chart.update('none'); // Update without animation for performance
  }

  returnToNow() {
    this.isUserSelecting = false;
    this.lastUserSelectionTime = null;
    this.updateChartData();
  }

  onProfileChange() {
    this.storage.setUserProfile(this.userProfile);
    const username = this.storage.getUsername();
    if (username) {
      this.supabase.updateProfile(username, {
        age: this.userProfile.age,
        poids: this.userProfile.poids,
        sexe: this.userProfile.sexe,
      }).catch(e => console.warn('Impossible de sauver le profil:', e));
    }
    this.updateChartData();
  }

  endSoiree() {
    this.storage.clearAll();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
