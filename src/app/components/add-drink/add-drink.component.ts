import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { StorageService } from '../../services/storage.service';
import { Alcool, ConsommationAlcool } from '../../models/types';

interface DrinkCategory {
  key: string;
  label: string;
  emoji: string;
  types: Alcool['type'][];
}

@Component({
  selector: 'app-add-drink',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col overflow-hidden"
         style="height: 100dvh; padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: env(safe-area-inset-bottom)">

      <!-- Header fixe -->
      <div class="flex-shrink-0 px-4 pb-3">
        <div class="max-w-md mx-auto flex items-center gap-3">
          <button (click)="cancel()"
            class="text-white p-1.5 hover:bg-white/10 rounded-lg transition flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-white">Verres de la soirée</h1>
        </div>
      </div>

      <!-- Contenu scrollable -->
      <div class="flex-1 min-h-0 overflow-y-auto px-4" style="-webkit-overflow-scrolling: touch" id="addDrinkScroll">

        <!-- 4 boutons catégorie -->
        <div class="max-w-md mx-auto mb-2 grid grid-cols-4 gap-2">
          @for (cat of categories; track cat.key) {
            <button
              (click)="toggleCategory(cat.key)"
              class="p-2 rounded-xl border text-white flex flex-col items-center gap-1 transition-all"
              [ngClass]="openCategory() === cat.key
                ? 'bg-yellow-400/20 border-yellow-400 ring-2 ring-yellow-400'
                : 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-blue-500/20 hover:from-blue-600/50 hover:to-purple-600/50'"
            >
              <span class="text-3xl">{{ cat.emoji }}</span>
              <span class="font-bold text-sm">{{ cat.label }}</span>
              <span class="text-xs text-gray-400">{{ (drinksByCategory[cat.key] || []).length }}</span>
            </button>
          }
        </div>

        <!-- Bouton verre personnalisé -->
        @if (newDrink() === null && editingDrink() === null) {
          <div class="max-w-md mx-auto mb-4">
            <button (click)="toggleCustomForm()"
              class="w-full py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2"
              [ngClass]="showCustomForm()
                ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400 text-purple-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'">
              🎨 Verre personnalisé
            </button>
          </div>
        }

        <!-- Formulaire verre personnalisé -->
        @if (showCustomForm() && newDrink() === null && editingDrink() === null) {
          <div class="max-w-md mx-auto mb-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/30 p-4 space-y-3 text-white">

            <div class="text-sm font-semibold text-purple-300 mb-1">Définir un verre</div>

            <!-- Nom -->
            <div>
              <label class="text-xs text-gray-400 block mb-1">Nom</label>
              <input [(ngModel)]="customNom" type="text" placeholder="Ex: Mojito maison"
                (blur)="onInputBlur()"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400" />
            </div>

            <!-- Type -->
            <div>
              <label class="text-xs text-gray-400 block mb-1">Catégorie</label>
              <select [(ngModel)]="customType"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400">
                <option value="cocktail">🍹 Cocktail</option>
                <option value="vin">🍷 Vin</option>
                <option value="champagne">🍷 Champagne</option>
                <option value="biere">🍺 Bière</option>
                <option value="shot">🔥 Shot</option>
              </select>
            </div>

            <!-- Degré + Quantité -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-400 block mb-1">Degré d'alcool (%)</label>
                <input [(ngModel)]="customDegre" type="number" min="0" max="100" step="0.5"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label class="text-xs text-gray-400 block mb-1">Quantité (cL)</label>
                <input [(ngModel)]="customQuantiteCl" type="number" min="1" max="200" step="1"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400" />
              </div>
            </div>

            <button (click)="startCustomDrink()" [disabled]="!customNom.trim()"
              class="w-full bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white py-2.5 rounded-lg font-bold text-sm transition">
              → Choisir l'heure
            </button>
          </div>
        }

        <!-- Accordéon: catalogue de la catégorie ouverte -->
        @if (openCategory() !== null && newDrink() === null && editingDrink() === null) {
          <div class="max-w-md mx-auto mb-4 rounded-xl border border-blue-500/20 overflow-hidden">
            <div class="overflow-y-auto max-h-52">
              @for (drink of drinksByCategory[openCategory()!] || []; track drink.id) {
                <button
                  (click)="startAddDrink(drink)"
                  class="w-full p-4 text-left text-white bg-slate-800 hover:bg-slate-700 transition border-b border-slate-700 last:border-b-0 flex items-center justify-between gap-3"
                >
                  <div class="flex-1">
                    <div class="font-semibold">{{ drink.nom }}</div>
                    <div class="text-xs text-gray-400 mt-0.5">{{ drink.degre }}° · {{ drink.quantite / 10 }} cL</div>
                  </div>
                  <span class="text-yellow-400 font-bold">→</span>
                </button>
              }
              @if ((drinksByCategory[openCategory()!] || []).length === 0) {
                <div class="p-6 text-center text-gray-500 bg-slate-800">Aucun verre dans cette catégorie</div>
              }
            </div>
          </div>
        }

        <!-- Panneau time picker (ajout ou modification) -->
        @if (newDrink() !== null || editingDrink() !== null) {
          <div class="max-w-md mx-auto mb-4 space-y-3">

            <!-- Info du verre concerné -->
            <div class="bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-4 rounded-xl border border-blue-500/20 text-white flex items-center gap-3">
              @if (newDrink() !== null) {
                <span class="text-3xl">{{ getEmojiForType(newDrink()!.type) }}</span>
                <div class="flex-1">
                  <div class="font-bold text-lg">{{ newDrink()!.nom }}</div>
                  <div class="text-sm text-gray-300">{{ newDrink()!.degre }}° · {{ newDrink()!.quantite / 10 }} cL</div>
                </div>
              } @else {
                <span class="text-3xl">{{ getEmojiForType(editingDrink()!.type) }}</span>
                <div class="flex-1">
                  <div class="font-bold text-lg">{{ editingDrink()!.nom }}</div>
                  <div class="text-sm text-gray-300">{{ editingDrink()!.degre }}° · {{ editingDrink()!.quantite / 10 }} cL</div>
                </div>
              }
              <button (click)="clearPicker()"
                class="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition text-lg">✕</button>
            </div>

            <!-- Sélecteur de jour + heure -->
            <div class="bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-4 rounded-xl border border-blue-500/20 text-white">

              <!-- Jour -->
              <div class="text-sm font-semibold text-gray-300 mb-2">Quel jour ?</div>
              <div class="flex items-center justify-between mb-4 gap-2">
                <button (click)="prevDay()"
                  class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-xl font-bold">‹</button>
                <span class="text-base font-semibold text-white flex-1 text-center">{{ selectedDayLabel() }}</span>
                <button (click)="nextDay()" [disabled]="!canGoNextDay()"
                  class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-xl font-bold disabled:opacity-30">›</button>
              </div>

              <!-- Heure -->
              <div class="text-sm font-semibold text-gray-300 mb-2">À quelle heure ?</div>
              <div class="text-center mb-4">
                <span class="text-5xl font-bold text-yellow-400 tabular-nums">{{ selectedTimeDisplay() }}</span>
              </div>
              <div class="px-1">
                <input type="range" min="0" max="1439" [value]="sliderValue()"
                  (input)="onSliderChange($event)" step="5" class="w-full cursor-pointer"
                  style="accent-color: #facc15;" />
                <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0h00</span>
                  <span>23h59</span>
                </div>
              </div>
            </div>

            <!-- Bouton confirmer -->
            <button (click)="confirmPicker()" [disabled]="isLoading()"
              class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-60">
              @if (isLoading()) {
                En cours...
              } @else if (editingDrink() !== null) {
                ✓ Modifier l'heure
              } @else {
                ✓ Ajouter ce verre
              }
            </button>

          </div>
        }

        <!-- ─── Liste des verres déjà consommés ─── -->
        <div class="max-w-md mx-auto mt-4 mb-2">
          <h2 class="text-white font-semibold text-sm mb-3 px-1">
            Verres déjà bus ({{ consumedDrinks().length }})
          </h2>

          @if (consumedDrinks().length === 0) {
            <div class="text-center text-gray-500 text-sm py-6 bg-slate-800/50 rounded-xl border border-slate-700">
              Aucun verre pour l'instant
            </div>
          }

          <div class="space-y-2">
            @for (drink of consumedDrinks(); track drink.soiree_alcool_id) {
              <div class="bg-slate-800 rounded-xl border border-slate-700 p-3 flex items-center gap-3 text-white">
                <span class="text-2xl">{{ getEmojiForType(drink.type) }}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm truncate">{{ drink.nom }}</div>
                  <div class="text-xs text-gray-400">{{ formatTime(drink.heure_consomation) }}</div>
                </div>
                <button (click)="startEditDrink(drink)"
                  class="px-3 py-1.5 rounded-lg bg-blue-600/40 hover:bg-blue-600/70 text-blue-300 text-xs font-semibold transition">Changer</button>
                <button (click)="deleteDrink(drink)"
                  class="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/60 text-red-400 text-xs font-semibold transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- Footer fixe : bouton Valider -->
      <div class="flex-shrink-0 px-4 pt-2 mb-5">
        <div class="max-w-md mx-auto">
          <button (click)="cancel()"
            class="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 rounded-xl font-bold text-lg">
            ✓ Valider
          </button>
        </div>
      </div>

    </div>
  `,
})
export class AddDrinkComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private storage = inject(StorageService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly categories: DrinkCategory[] = [
    { key: 'vin', label: 'Vin', emoji: '🍷', types: ['vin', 'champagne'] },
    { key: 'biere', label: 'Bière', emoji: '🍺', types: ['biere'] },
    { key: 'cocktail', label: 'Cocktails', emoji: '🍹', types: ['cocktail', 'spiritueux pur'] },
    { key: 'shot', label: 'Shots', emoji: '🔥', types: ['shot'] },
  ];

  drinksByCategory: Record<string, Alcool[]> = {};
  consumedDrinks = signal<ConsommationAlcool[]>([]);

  openCategory = signal<string | null>(null);
  newDrink = signal<Alcool | null>(null);
  editingDrink = signal<ConsommationAlcool | null>(null);
  isLoading = signal(false);

  // Formulaire verre personnalisé
  showCustomForm = signal(false);
  customNom = '';
  customType: Alcool['type'] = 'cocktail';
  customDegre = 40;
  customQuantiteCl = 4;

  // Jour sélectionné (minuit local) et minutes depuis minuit (0–1439)
  selectedDay = signal<Date>(this.todayMidnight());
  sliderValue = signal(0);

  selectedTimeDisplay = computed(() => {
    const h = Math.floor(this.sliderValue() / 60).toString().padStart(2, '0');
    const m = (this.sliderValue() % 60).toString().padStart(2, '0');
    return `${h}h${m}`;
  });

  selectedDayLabel = computed(() => {
    const day = this.selectedDay();
    const today = this.todayMidnight();
    const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    return day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  });

  canGoNextDay = computed(() => {
    return this.selectedDay().getTime() < this.todayMidnight().getTime();
  });

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const soireeIdStr = this.storage.getCurrentSoiree();
    if (!soireeIdStr) { this.router.navigate(['/']); return; }

    try {
      const [alcools, consumed] = await Promise.all([
        this.supabase.getAllDrinks(),
        this.supabase.getDrinksBySoiree(Number(soireeIdStr)),
      ]);

      for (const cat of this.categories) {
        this.drinksByCategory[cat.key] = alcools.filter(a =>
          (cat.types as string[]).includes(a.type)
        );
      }

      this.consumedDrinks.set(
        [...consumed].sort((a, b) => a.heure_consomation.getTime() - b.heure_consomation.getTime())
      );
    } catch (err) {
      console.error('Erreur chargement add-drink:', err);
      this.router.navigate(['/']);
    }
  }

  // ─── Catalogue ───────────────────────────────────────────────

  toggleCategory(key: string) {
    this.clearPicker();
    this.showCustomForm.set(false);
    this.openCategory.set(this.openCategory() === key ? null : key);
  }

  startAddDrink(drink: Alcool) {
    this.editingDrink.set(null);
    this.newDrink.set(drink);
    this.selectedDay.set(this.todayMidnight());
    this.sliderValue.set(this.nowMinutes());
    this.openCategory.set(null);
    this.showCustomForm.set(false);
  }

  // ─── Verre personnalisé ───────────────────────────────────────

  toggleCustomForm() {
    const next = !this.showCustomForm();
    this.clearPicker();
    this.openCategory.set(null);
    this.showCustomForm.set(next);
  }

  startCustomDrink() {
    if (!this.customNom.trim()) return;
    const drink: Alcool = {
      id: -1, // sentinel : pas encore en DB
      nom: this.customNom.trim(),
      type: this.customType,
      degre: this.customDegre,
      quantite: this.customQuantiteCl * 10, // cL → mL
    };
    this.newDrink.set(drink);
    this.selectedDay.set(this.todayMidnight());
    this.sliderValue.set(this.nowMinutes());
    this.showCustomForm.set(false);
  }

  // ─── Liste des verres consommés ───────────────────────────────

  startEditDrink(drink: ConsommationAlcool) {
    this.newDrink.set(null);
    this.openCategory.set(null);
    this.showCustomForm.set(false);
    const d = drink.heure_consomation;
    this.selectedDay.set(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    this.sliderValue.set(d.getHours() * 60 + d.getMinutes());
    this.editingDrink.set(drink);
    document.getElementById('addDrinkScroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteDrink(drink: ConsommationAlcool) {
    try {
      await this.supabase.deleteDrink(drink.soiree_alcool_id);
      this.consumedDrinks.update(list => list.filter(d => d.soiree_alcool_id !== drink.soiree_alcool_id));
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression');
    }
  }

  // ─── Day/Time picker ─────────────────────────────────────────

  prevDay() {
    const d = this.selectedDay();
    this.selectedDay.set(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  }

  nextDay() {
    if (!this.canGoNextDay()) return;
    const d = this.selectedDay();
    this.selectedDay.set(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  }

  clearPicker() {
    this.newDrink.set(null);
    this.editingDrink.set(null);
  }

  onSliderChange(event: Event) {
    this.sliderValue.set(Number((event.target as HTMLInputElement).value));
  }

  async confirmPicker() {
    if (this.isLoading()) return;
    const day = this.selectedDay();
    const heure = new Date(day.getFullYear(), day.getMonth(), day.getDate(),
      Math.floor(this.sliderValue() / 60), this.sliderValue() % 60);
    const soireeIdStr = this.storage.getCurrentSoiree();

    this.isLoading.set(true);
    try {
      if (this.editingDrink() !== null) {
        const editing = this.editingDrink()!;
        await this.supabase.updateDrinkTime(editing.soiree_alcool_id, heure);
        this.consumedDrinks.update(list =>
          list
            .map(d => d.soiree_alcool_id === editing.soiree_alcool_id
              ? { ...d, heure_consomation: heure, heure_consommation: heure }
              : d
            )
            .sort((a, b) => a.heure_consomation.getTime() - b.heure_consomation.getTime())
        );
        this.clearPicker();
      } else if (this.newDrink() !== null && soireeIdStr) {
        let drink = this.newDrink()!;

        // Verre personnalisé : l'insérer d'abord dans le catalogue
        if (drink.id === -1) {
          drink = await this.supabase.createCustomDrink(
            drink.nom, drink.type, drink.degre, drink.quantite
          );
        }

        await this.supabase.addDrink(drink.id, Number(soireeIdStr), heure);
        const updated = await this.supabase.getDrinksBySoiree(Number(soireeIdStr));
        this.consumedDrinks.set(
          [...updated].sort((a, b) => a.heure_consomation.getTime() - b.heure_consomation.getTime())
        );
        this.clearPicker();
      }
    } catch (err) {
      console.error('Erreur confirmation:', err);
      alert('Erreur lors de l\'opération');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────

  cancel() {
    this.router.navigate(['/dashboard']);
  }

  formatTime(date: Date): string {
    const today = this.todayMidnight();
    const drinkDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today.getTime() - drinkDay.getTime()) / 86400000);
    const time = `${date.getHours().toString().padStart(2, '0')}h${date.getMinutes().toString().padStart(2, '0')}`;
    if (diffDays === 0) return time;
    if (diffDays === 1) return `Hier ${time}`;
    return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${time}`;
  }

  getEmojiForType(type: string): string {
    const map: Record<string, string> = {
      champagne: '🍷', vin: '🍷', cocktail: '🍹',
      'spiritueux pur': '🥃', biere: '🍺', shot: '🔥',
    };
    return map[type] ?? '🍶';
  }

  onInputBlur() {
    // iOS : après fermeture du clavier, le viewport reste décalé vers le haut
    setTimeout(() => {
      window.scrollTo({ top: 0 });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 150);
  }

  private todayMidnight(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private nowMinutes(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}
