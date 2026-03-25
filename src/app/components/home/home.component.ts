import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    <div class="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 p-4 flex flex-col justify-center">
      <div class="max-w-md mx-auto w-full">
        <!-- Logo/Title -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-white mb-2">🍺 AlcooTest</h1>
          <p class="text-blue-200">Suivi d'alcoolémie en temps réel</p>
        </div>

        <!-- Install Button (Android) -->
        @if (showInstallButton()) {
          <button
            (click)="installApp()"
            class="w-full mb-4 bg-white/10 border border-white/30 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition"
          >
            <span>📲</span> Installer sur l'écran d'accueil
          </button>
        }

        <!-- Install Instructions (iPhone) -->
        @if (showIosInstructions()) {
          <div class="mb-4 bg-white/10 border border-white/30 text-white p-3 rounded-lg text-sm text-center">
            <p class="font-semibold mb-1">📲 Installer sur iPhone</p>
            <p class="text-blue-200">Appuie sur <span class="font-bold">Partager</span> puis <span class="font-bold">"Sur l'écran d'accueil"</span></p>
          </div>
        }

        <!-- Buttons -->
        <div class="space-y-4">
          <button
            (click)="openNewSoireeForm()"
            class="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105"
          >
            ➕ Créer une soirée
          </button>

          <button
            (click)="showLoadSoiree = !showLoadSoiree"
            class="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105"
          >
            📋 Charger une soirée
          </button>
        </div>

        <!-- Load Soiree Section -->
        @if (showLoadSoiree) {
          <div class="mt-6 bg-white bg-opacity-10 backdrop-blur p-4 rounded-lg">
            <input
              [(ngModel)]="searchUsername"
              placeholder="Entrez un pseudo"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              (click)="loadSoirees()"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold transition"
            >
              Chercher
            </button>

            @if (soirees && soirees.length > 0) {
              <div class="mt-4 space-y-2">
                @for (soiree of soirees; track soiree.id) {
                  <button
                    (click)="selectSoiree(soiree)"
                    class="w-full p-3 bg-slate-700 hover:bg-slate-600 text-white rounded text-left transition border border-slate-600"
                  >
                    {{ soiree.name }}
                  </button>
                }
              </div>
            }
          </div>
        }

        <!-- New Soiree Form -->
        @if (showNewSoireeForm) {
          <div class="mt-6 bg-white bg-opacity-10 backdrop-blur p-4 rounded-lg">

            <input
              [(ngModel)]="formData.username"
              placeholder="Votre pseudo"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              [(ngModel)]="formData.soireeName"
              placeholder="Nom de la soirée"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              [(ngModel)]="formData.age"
              type="number"
              placeholder="Âge"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              [(ngModel)]="formData.poids"
              type="number"
              placeholder="Poids (kg)"
              class="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <!-- Heure de début -->
            <div class="mb-3">
              <input
                type="time"
                name="startTime"
                [(ngModel)]="formData.startTime"
                class="w-full px-3 py-2 bg-slate-700 text-yellow-400 font-bold text-lg rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <select
              [(ngModel)]="formData.sexe"
              class="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="" disabled class="bg-slate-700 text-white">Sélectionnez votre sexe</option>
              <option value="H" class="bg-slate-700 text-white">Homme</option>
              <option value="F" class="bg-slate-700 text-white">Femme</option>
            </select>

            <label class="flex items-center bg-slate-700 p-3 rounded border border-slate-600 mb-4 cursor-pointer hover:bg-slate-600 transition">
              <input
                [(ngModel)]="formData.mangedAvant"
                type="checkbox"
                class="mr-3 w-5 h-5 cursor-pointer accent-blue-400"
              />
              <span class="text-white font-medium">J'ai mangé avant</span>
            </label>

            <div class="space-y-2">
              <button
                (click)="createSoiree()"
                class="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded font-semibold transition"
              >
                Créer
              </button>
              <button
                (click)="closeForms()"
                class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded font-semibold transition"
              >
                Annuler
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  showNewSoireeForm = false;
  showLoadSoiree = false;
  soirees: Soiree[] | null = null;
  searchUsername = '';

  showInstallButton = signal(false);
  showIosInstructions = signal(false);
  private installPrompt: any = null;

  private supabase = inject(SupabaseService);
  private storage = inject(StorageService);
  private router = inject(Router);

  formData = {
    username: '',
    soireeName: '',
    age: 25,
    poids: 70,
    sexe: '' as 'H' | 'F' | '',
    mangedAvant: false,
    startTime: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
  };

  ngOnInit() {
    const currentSoireeId = this.storage.getCurrentSoiree();
    if (currentSoireeId) {
      this.router.navigate(['/dashboard']);
    }

    // Android : écouter l'event d'installation
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallButton.set(true);
    });

    // iPhone : détecter Safari iOS hors PWA
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true;
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

    try {
      // Créer ou récupérer le profil
      let profile = await this.supabase.getProfile(this.formData.username);
      if (!profile) {
        profile = await this.supabase.createProfile(this.formData.username);
      }

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
    }
  }

  selectSoiree(soiree: Soiree) {
    this.storage.setUsername(soiree.creator);
    this.storage.setCurrentSoiree(soiree.id);
    this.router.navigate(['/dashboard']);
  }
}
