import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { StorageService } from '../../services/storage.service';
import { Soiree } from '../../models/types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page principale : h-dvh, jamais de scroll -->
    <div class="bg-gradient-to-b from-blue-900 to-purple-900 flex flex-col justify-center px-6 overflow-hidden"
         style="height: 100dvh; padding-top: max(1rem, env(safe-area-inset-top)); padding-bottom: env(safe-area-inset-bottom)">
      <div class="max-w-md mx-auto w-full flex flex-col gap-3">

        <!-- Logo/Title -->
        <div class="text-center">
          <h1 class="text-3xl font-bold text-white">🍺 AlcooTest</h1>
          <p class="text-blue-200 text-xs mt-1">Suivi d'alcoolémie en temps réel</p>
        </div>

        <!-- Bouton installer Android -->
        @if (showInstallButton()) {
          <button (click)="installApp()"
            class="w-full bg-white/10 border border-white/30 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
            📲 Installer sur l'écran d'accueil
          </button>
        }

        <!-- Bouton installer iPhone -->
        @if (showIosInstructions()) {
          <button (click)="showIosModal.set(true)"
            class="w-full bg-white/10 border border-white/30 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
            📲 Installer sur l'écran d'accueil
          </button>
        }

        <!-- Boutons principaux -->
        <button (click)="openOverlay('new')"
          class="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 rounded-lg font-bold text-lg">
          ➕ Créer une soirée
        </button>

        <button (click)="openOverlay('load')"
          class="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white py-4 rounded-lg font-bold text-lg">
          📋 Charger une soirée
        </button>
      </div>
    </div>

    <!-- Overlay formulaire (plein écran, scrollable) -->
    @if (showNewSoireeForm || showLoadSoiree) {
      <div class="fixed inset-0 z-50 bg-gradient-to-b from-blue-900 to-purple-900 overflow-y-auto">
        <div class="max-w-md mx-auto p-6 min-h-full flex flex-col justify-center overflow-hidden">

          @if (showNewSoireeForm) {
            <h2 class="text-white text-xl font-bold mb-4">Nouvelle soirée</h2>

            <input [(ngModel)]="formData.username" placeholder="Votre pseudo"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400" />

            <input [(ngModel)]="formData.soireeName" placeholder="Nom de la soirée"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400" />

            <input [(ngModel)]="formData.age" type="number" placeholder="Âge"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400" />

            <input [(ngModel)]="formData.poids" type="number" placeholder="Poids (kg)"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400" />

            <input type="time" [(ngModel)]="formData.startTime"
              class="w-full min-w-0 px-3 py-2 bg-slate-700 text-yellow-400 font-bold rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="font-size: 16px; max-width: 100%; box-sizing: border-box;" />

            <select [(ngModel)]="formData.sexe"
              class="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="" disabled>Sélectionnez votre sexe</option>
              <option value="H">Homme</option>
              <option value="F">Femme</option>
            </select>

            <label class="flex items-center bg-slate-700 p-3 rounded border border-slate-600 mb-4 cursor-pointer">
              <input [(ngModel)]="formData.mangedAvant" type="checkbox" class="mr-3 w-5 h-5 accent-blue-400" />
              <span class="text-white font-medium">J'ai mangé avant</span>
            </label>

            <button (click)="createSoiree()" class="w-full bg-green-500 text-white py-3 rounded-lg font-bold mb-2">Créer</button>
            <button (click)="closeForms()" class="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold">Annuler</button>
          }

          @if (showLoadSoiree) {
            <h2 class="text-white text-xl font-bold mb-4">Charger une soirée</h2>

            <input [(ngModel)]="searchUsername" placeholder="Entrez un pseudo"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400" />

            <button (click)="loadSoirees()" class="w-full bg-blue-500 text-white py-3 rounded-lg font-bold mb-3">Chercher</button>

            @if (soirees && soirees.length > 0) {
              <div class="space-y-2 mb-3">
                @for (soiree of soirees; track soiree.id) {
                  <button (click)="selectSoiree(soiree)"
                    class="w-full p-3 bg-slate-700 text-white rounded text-left border border-slate-600">
                    {{ soiree.name }}
                  </button>
                }
              </div>
            }

            <button (click)="closeForms()" class="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold">Annuler</button>
          }
        </div>
      </div>
    }

    <!-- Modal instructions iPhone -->
    @if (showIosModal()) {
      <div class="fixed inset-0 z-50 bg-black/70 flex items-end" (click)="showIosModal.set(false)">
        <div class="w-full bg-slate-800 rounded-t-2xl p-6" (click)="$event.stopPropagation()">
          <h3 class="text-white text-lg font-bold mb-4 text-center">📲 Installer AlcooTest</h3>
          <ol class="text-white space-y-3 text-sm">
            <li class="flex items-center gap-3">
              <span class="text-2xl">1️⃣</span>
              <span>Appuie sur le bouton <strong>Partager</strong> en bas de Safari</span>
            </li>
            <li class="flex items-center gap-3">
              <span class="text-2xl">2️⃣</span>
              <span>Fais défiler et appuie sur <strong>"Sur l'écran d'accueil"</strong></span>
            </li>
            <li class="flex items-center gap-3">
              <span class="text-2xl">3️⃣</span>
              <span>Appuie sur <strong>Ajouter</strong></span>
            </li>
          </ol>
          <button (click)="showIosModal.set(false)"
            class="w-full mt-6 bg-blue-500 text-white py-3 rounded-lg font-bold">
            OK
          </button>
        </div>
      </div>
    }
  `,
})
export class HomeComponent implements OnInit {
  showNewSoireeForm = false;
  showLoadSoiree = false;
  soirees: Soiree[] | null = null;
  searchUsername = '';

  showInstallButton = signal(false);
  showIosInstructions = signal(false);
  showIosModal = signal(false);
  private installPrompt: any = null;

  private supabase = inject(SupabaseService);
  private storage = inject(StorageService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  formData = {
    username: '',
    soireeName: '',
    age: null as unknown as number,
    poids: null as unknown as number,
    sexe: '' as 'H' | 'F' | '',
    mangedAvant: false,
    startTime: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
  };

  ngOnInit() {
    const currentSoireeId = this.storage.getCurrentSoiree();
    if (currentSoireeId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Pré-remplir le formulaire avec les données du dernier utilisateur
    const username = this.storage.getUsername();
    const profile = this.storage.getUserProfile();
    if (username) this.formData.username = username;
    if (profile) {
      if (profile.age) this.formData.age = profile.age;
      if (profile.poids) this.formData.poids = profile.poids;
      if (profile.sexe) this.formData.sexe = profile.sexe;
    }

    if (!isPlatformBrowser(this.platformId)) return;

    // Android : écouter l'event d'installation
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallButton.set(true);
    });

    // iPhone : détecter iOS (bouton toujours visible si pas déjà installé)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()) ||
      (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const isStandalone = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isIos && !isStandalone) {
      this.showIosInstructions.set(true);
    }
  }

  async installApp() {
    if (!this.installPrompt) return;
    this.installPrompt.prompt();
    const { outcome } = await this.installPrompt.userChoice;
    if (outcome === 'accepted') {
      this.showInstallButton.set(false);
    }
  }

  openOverlay(type: 'new' | 'load') {
    this.showNewSoireeForm = type === 'new';
    this.showLoadSoiree = type === 'load';
  }

  openNewSoireeForm() {
    this.showNewSoireeForm = true;
    this.showLoadSoiree = false;
  }

  closeForms() {
    this.showNewSoireeForm = false;
    this.showLoadSoiree = false;
  }

  async createSoiree() {
    if (!this.formData.username || !this.formData.soireeName || !this.formData.sexe) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    if (!this.formData.poids || this.formData.poids < 30 || this.formData.poids > 300) {
      alert('Veuillez entrer un poids valide (entre 30 et 300 kg)');
      return;
    }

    try {
      // Créer ou récupérer le profil, puis sauvegarder age/poids/sexe
      let profile = await this.supabase.getProfile(this.formData.username);
      if (!profile) {
        profile = await this.supabase.createProfile(this.formData.username);
      }
      await this.supabase.updateProfile(this.formData.username, {
        age: this.formData.age,
        poids: this.formData.poids,
        sexe: this.formData.sexe as 'H' | 'F',
      });

      // Créer la soirée avec l'heure de début choisie
      const [hours, minutes] = this.formData.startTime.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      const soiree = await this.supabase.createSoiree(
        this.formData.soireeName,
        this.formData.username,
        startTime
      );

      // Sauvegarder en LocalStorage
      this.storage.setUsername(this.formData.username);
      this.storage.setCurrentSoiree(soiree.id);
      this.storage.setUserProfile({
        age: this.formData.age,
        poids: this.formData.poids,
        sexe: this.formData.sexe,
        manage_avant: this.formData.mangedAvant,
      });

      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Erreur détaillée:', error);

      let errorMsg = 'Erreur inconnue';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error && typeof error === 'object') {
        errorMsg = JSON.stringify(error);
      }

      alert(`❌ Erreur: ${errorMsg}\n\n⚠️ Vérifiez que:\n1. Les credentials Supabase sont corrects dans environment.ts\n2. Les tables Supabase ont été créées\n3. Votre connexion Internet fonctionne`);
    }
  }

  async loadSoirees() {
    if (!this.searchUsername) {
      alert('Veuillez entrer un pseudo');
      return;
    }

    try {
      this.soirees = await this.supabase.getSoireesByCreator(this.searchUsername);
      if (!this.soirees || this.soirees.length === 0) {
        alert('Aucune soirée trouvée pour ce pseudo');
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur lors du chargement des soirées');
    } finally {
      this.cdr.markForCheck();
    }
  }

  async selectSoiree(soiree: Soiree) {
    this.storage.setUsername(soiree.creator);
    this.storage.setCurrentSoiree(soiree.id);

    // Charger le profil depuis Supabase pour restaurer age/poids/sexe
    try {
      const profile = await this.supabase.getProfile(soiree.creator);
      if (profile?.age || profile?.poids || profile?.sexe) {
        const existing = this.storage.getUserProfile() || {};
        this.storage.setUserProfile({
          ...existing,
          age: profile.age ?? existing.age ?? 25,
          poids: profile.poids ?? existing.poids ?? 70,
          sexe: profile.sexe ?? existing.sexe ?? 'H',
        });
      }
    } catch (e) {
      console.warn('Impossible de charger le profil depuis Supabase:', e);
    }

    this.router.navigate(['/dashboard']);
  }
}
