import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConsommationAlcool } from '../models/types';
import { EtatService } from './etat.service';

@Injectable({ providedIn: 'root' })
export class RoastService {
    private http = inject(HttpClient);
    private etat = inject(EtatService);
    private platformId = inject(PLATFORM_ID);
    private expressionsCache: string[] | null = null;

    private async loadExpressions(): Promise<string[]> {
        if (this.expressionsCache) return this.expressionsCache;
        try {
            const text = await firstValueFrom(
                this.http.get('/assets/expressions.txt', { responseType: 'text' })
            );
            this.expressionsCache = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            return this.expressionsCache;
        } catch {
            return [];
        }
    }

    private pickRandom(arr: string[], n: number): string[] {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n);
    }

    async generateRoast(
        username: string,
        soireeName: string,
        drinks: ConsommationAlcool[],
        taux: number
    ): Promise<string> {
        // Fallback par défaut
        const fallback = this.etat.getEtatByTaux(taux).status;

        if (!isPlatformBrowser(this.platformId)) return fallback;

        const apiKey = environment.claudeApiKey;
        if (!apiKey) return fallback;

        try {
            const allExpressions = await this.loadExpressions();
            const expressions = this.pickRandom(allExpressions, 17).join('\n');

            const drinkSummary = drinks.length === 0
                ? 'Aucun verre pour l\'instant.'
                : drinks.map(d => `${d.nom} (${d.type})`).join(', ');
            const drinkCount = `${drinks.length} verre${drinks.length > 1 ? 's' : ''} bu${drinks.length > 1 ? 's' : ''} au total`;

            const prompt = `Tu es un commentateur de soirée hilarant et piquant. Tu roastes venere les gens sur leur consommation d'alcool.

            Contexte :
            - Pseudo : ${username}
            - Soirée : "${soireeName}"
            - Nombre total : ${drinkCount}
            - Détail des verres : ${drinkSummary}

            Expressions à utiliser comme inspiration (intègres-en une ou deux naturellement) :
            ${expressions}

            Génère UNE seule phrase courte (max 120 caractères), drôle et piquante en français, dans le style d'un ami qui roaste.
            - Mentionne un verre spécifique si possible
            - Utilise une expression de la liste de façon naturelle
            - Pas de hashtag, pas d'emoji
            - Réponds UNIQUEMENT avec la phrase, rien d'autre`;

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 150,
                    messages: [{ role: 'user', content: prompt }],
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.error('Claude API error:', response.status, JSON.stringify(err));
                return fallback;
            }

            const data = await response.json();
            const text = data?.content?.[0]?.text?.trim();
            return text || fallback;
        } catch (e) {
            console.error('Claude fetch error:', e);
            return fallback;
        }
    }
}
