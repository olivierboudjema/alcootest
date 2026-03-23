import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 pb-32">

      <!-- Header -->
      <div class="max-w-md mx-auto mb-6 flex items-center gap-3 text-white">
        <button
          (click)="cancel()"
          class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition font-bold text-lg leading-none"
        >←</button>
        <h1 class="text-xl font-bold">Verres de la soirée</h1>
      </div>

      <!-- 4 boutons catégorie -->
      <div class="max-w-md mx-auto mb-4 grid grid-cols-2 gap-3">
        @for (cat of categories; track cat.key) {
          <button
            (click)="toggleCategory(cat.key)"
            class="p-5 rounded-xl border text-white flex flex-col items-center gap-2 transition-all"
            [ngClass]="openCategory() === cat.key
              ? 'bg-yellow-400/20 border-yellow-400 ring-2 ring-yellow-400'
              : 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-blue-500/20 hover:from-blue-600/50 hover:to-purple-600/50'"
          >
            <span class="text-5xl">{{ cat.emoji }}</span>
            <span class="font-bold text-lg">{{ cat.label }}</span>
            <span class="text-xs text-gray-400">{{ (drinksByCategory[cat.key] || []).length }} référence(s)</span>
          </button>
        }
      </div>

      <!-- Accordéon: catalogue de la catégorie ouverte -->
      @if (openCategory() !== null && newDrink() === null && editingDrink() === null) {
        <div class="max-w-md mx-auto mb-4 rounded-xl border border-blue-500/20 overflow-hidden">
          @for (drink of drinksByCategory[openCategory()!] || []; track drink.id) {
            <button
              (click)="startAddDrink(drink)"
              class="w-full p-4 text-left text-white bg-slate-800 hover:bg-slate-700 transition border-b border-slate-700 last:border-b-0 flex items-center justify-between gap-3"
            >
              <div class="flex-1">
                <div class="font-semibold">{{ drink.nom }}</div>
                <div class="text-xs text-gray-400 mt-0.5">{{ drink.degre }}° · {{ drink.quantite }} cL</div>
              </div>
              <span class="text-yellow-400 font-bold">→</span>
            </button>
          }
          @if ((drinksByCategory[openCategory()!] || []).length === 0) {
            <div class="p-6 text-center text-gray-500 bg-slate-800">Aucun verre dans cette catégorie</div>
          }
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
                <div class="text-sm text-gray-300">{{ newDrink()!.degre }}° · {{ newDrink()!.quantite }} cL</div>
              </div>
            } @else {
              <span class="text-3xl">{{ getEmojiForType(editingDrink()!.type) }}</span>
              <div class="flex-1">
                <div class="font-bold text-lg">{{ editingDrink()!.nom }}</div>
                <div class="text-sm text-gray-300">{{ editingDrink()!.degre }}° · {{ editingDrink()!.quantite }} cL</div>
              </div>
            }
            <button
              (click)="clearPicker()"
              class="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition text-lg"
            >✕</button>
          </div>

          <!-- Frise chronologique -->
          <div class="bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-4 rounded-xl border border-blue-500/20 text-white">
            <div class="text-sm font-semibold text-gray-300 mb-4">À quelle heure ?</div>

            <div class="text-center mb-6">
              <span class="text-5xl font-bold text-yellow-400 tabular-nums">{{ selectedTimeDisplay() }}</span>
            </div>

            <div class="px-1">
              <input
                type="range"
                [min]="sliderMin()"
                [max]="sliderMax()"
                [value]="sliderValue()"
                (input)="onSliderChange($event)"
                step="5"
                class="w-full cursor-pointer"
                style="accent-color: #facc15;"
              />
              <div class="relative mt-3 h-10">
                @for (tick of timelineTicks(); track tick.label) {
                  <div
                    class="absolute flex flex-col items-center"
                    [style.left.%]="tick.pct"
                    style="transform: translateX(-50%)"
                  >
                    <div class="w-px h-2 mb-1" [ngClass]="tick.isNow ? 'bg-yellow-400' : 'bg-gray-600'"></div>
                    <span class="text-xs whitespace-nowrap" [ngClass]="tick.isNow ? 'text-yellow-400 font-bold' : 'text-gray-500'">{{ tick.label }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Bouton confirmer -->
          <button
            (click)="confirmPicker()"
            [disabled]="isLoading()"
            class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-60"
          >
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
      <div class="max-w-md mx-auto mt-6">
        <h2 class="text-white font-semibold text-sm mb-3 px-1">
          Verres déjà ajoutés ({{ consumedDrinks().length }})
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
              <button
                (click)="startEditDrink(drink)"
                class="px-3 py-1.5 rounded-lg bg-blue-600/40 hover:bg-blue-600/70 text-blue-300 text-xs font-semibold transition"
              >Changer</button>
              <button
                (click)="deleteDrink(drink)"
                class="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/60 text-red-400 text-xs font-semibold transition"
              >🗑</button>
            </div>
          }
        </div>
      </div>

    </div>
  `,
})
export class AddDrinkComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private storage = inject(StorageService);
  private router = inject(Router);

  readonly categories: DrinkCategory[] = [
    { key: 'champagne', label: 'Champagne', emoji: '🍾', types: ['champagne'] },
    { key: 'vin',       label: 'Vin',       emoji: '🍷', types: ['vin'] },
    { key: 'cocktail',  label: 'Cocktails', emoji: '🍹', types: ['cocktail', 'spiritueux pur'] },
    { key: 'biere',     label: 'Bière',     emoji: '🍺', types: ['biere'] },
  ];

  drinksByCategory: Record<string, Alcool[]> = {};
  consumedDrinks = signal<ConsommationAlcool[]>([]);

  openCategory = signal<string | null>(null);
  newDrink = signal<Alcool | null>(null);          // verre en cours d'ajout
  editingDrink = signal<ConsommationAlcool | null>(null); // verre en cours de modif
  isLoading = signal(false);

  // Timeline
  private soireeStartMs = signal(0);
  private nowMs = signal(Date.now());
  sliderMin = signal(0);
  sliderMax = signal(0);
  sliderValue = signal(0);

  selectedTimeDisplay = computed(() => {
    const ts = this.soireeStartMs() + this.sliderValue() * 60 * 1000;
    return this.formatMs(ts);
  });

  timelineTicks = computed(() => {
    const start = this.soireeStartMs();
    const max = this.sliderMax();
    const now = this.nowMs();
    if (max === 0) return [];

    const ticks: { pct: number; label: string; isNow: boolean }[] = [];
    const nowMinutes = Math.floor((now - start) / 60000);
    const tickSet = new Set<number>();

    for (let min = 0; min <= max; min += 180) tickSet.add(min);
    tickSet.add(max);

    const hasNowTick = [...tickSet].some(m => Math.abs(m - nowMinutes) < 30);
    if (!hasNowTick) tickSet.add(nowMinutes);

    for (const min of [...tickSet].sort((a, b) => a - b)) {
      ticks.push({
        pct: (min / max) * 100,
        label: min === nowMinutes ? 'maintenant' : this.formatMs(start + min * 60000),
        isNow: min === nowMinutes,
      });
    }
    return ticks;
  });

  async ngOnInit() {
    const soireeIdStr = this.storage.getCurrentSoiree();
    if (!soireeIdStr) { this.router.navigate(['/']); return; }

    try {
      const [soiree, alcools, consumed] = await Promise.all([
        this.supabase.getSoiree(soireeIdStr),
        this.supabase.getAllDrinks(),
        this.supabase.getDrinksBySoiree(Number(soireeIdStr)),
      ]);

      const startMs = soiree.created_at
        ? new Date(soiree.created_at).getTime()
        : Date.now() - 8 * 60 * 60 * 1000;
      const nowMs = Date.now();
      const maxMs = nowMs + 12 * 60 * 60 * 1000;

      this.soireeStartMs.set(startMs);
      this.nowMs.set(nowMs);
      this.sliderMin.set(0);
      this.sliderMax.set(Math.ceil((maxMs - startMs) / 60000));
      this.sliderValue.set(Math.floor((nowMs - startMs) / 60000));

      for (const cat of this.categories) {
        this.drinksByCategory[cat.key] = alcools.filter(a =>
          (cat.types as string[]).includes(a.type)
        );
      }

      // Trier par heure croissante
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
    this.openCategory.set(this.openCategory() === key ? null : key);
  }

  startAddDrink(drink: Alcool) {
    this.editingDrink.set(null);
    this.newDrink.set(drink);
    this.sliderValue.set(Math.floor((Date.now() - this.soireeStartMs()) / 60000));
    this.openCategory.set(null);
  }

  // ─── Liste des verres consommés ───────────────────────────────

  startEditDrink(drink: ConsommationAlcool) {
    this.newDrink.set(null);
    this.openCategory.set(null);
    // Positionner le slider sur l'heure actuelle du verre
    const minutesFromStart = Math.floor(
      (drink.heure_consomation.getTime() - this.soireeStartMs()) / 60000
    );
    this.sliderValue.set(Math.max(0, Math.min(minutesFromStart, this.sliderMax())));
    this.editingDrink.set(drink);
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ─── Time picker ──────────────────────────────────────────────

  clearPicker() {
    this.newDrink.set(null);
    this.editingDrink.set(null);
  }

  onSliderChange(event: Event) {
    this.sliderValue.set(Number((event.target as HTMLInputElement).value));
  }

  async confirmPicker() {
    if (this.isLoading()) return;
    const heure = new Date(this.soireeStartMs() + this.sliderValue() * 60000);
    const soireeIdStr = this.storage.getCurrentSoiree();

    this.isLoading.set(true);
    try {
      if (this.editingDrink() !== null) {
        // Modification de l'heure
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
        // Ajout d'un nouveau verre
        await this.supabase.addDrink(this.newDrink()!.id, Number(soireeIdStr), heure);
        // Recharger la liste
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
    return `${date.getHours().toString().padStart(2, '0')}h${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private formatMs(ms: number): string {
    const d = new Date(ms);
    return `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
  }

  getEmojiForType(type: string): string {
    const map: Record<string, string> = {
      champagne: '🍾', vin: '🍷', cocktail: '🍹',
      'spiritueux pur': '🥃', biere: '🍺',
    };
    return map[type] ?? '🍶';
  }
}
