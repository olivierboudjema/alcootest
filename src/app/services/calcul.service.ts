import { Injectable } from '@angular/core';
import { Alcool, ConsommationAlcool, AlcoholeDataPoint, UserProfile, DrinkWithTime } from '../models/types';

@Injectable({
    providedIn: 'root',
})
export class CalculService {
    /**
     * Formule de Widmark pour calculer le taux d'alcoolémie
     * Taux (g/L) = Alcool_pur(g) / (Poids(kg) × K)
     * K = 0.7 (Homme), 0.6 (Femme)
     */

    private readonly K_HOMME = 0.7;
    private readonly K_FEMME = 0.6;
    private readonly ELIMINATION_RATE = 0.15; // g/L par heure
    private readonly ABSORPTION_DURATION_SANS_REPAS = 30; // minutes jusqu'au pic
    private readonly ABSORPTION_DURATION_AVEC_REPAS = 40; // minutes jusqu'au pic (repas = absorption plus lente)

    /**
     * Calcule l'alcool pur en grammes
     * Alcool pur (g) = Volume(mL) × (Degre/100) × 0.8
     * quantite est stockée en mL dans la DB
     */
    private calculatePureAlcohol(volumeMl: number, degre: number): number {
        return volumeMl * (degre / 100) * 0.8;
    }

    /**
     * Calcule le coefficient de distribution K selon le sexe et l'âge.
     * Avec l'âge, la proportion d'eau corporelle diminue, ce qui réduit K
     * et augmente le taux d'alcoolémie pour une même quantité consommée.
     * Réduction : -0.002 par an au-delà de 25 ans (plancher à 0.55 H / 0.45 F).
     */
    private getKCoefficient(sexe: 'H' | 'F', age: number = 25): number {
        const base = sexe === 'H' ? this.K_HOMME : this.K_FEMME;
        const min  = sexe === 'H' ? 0.55 : 0.45;
        const reduction = 0.002 * Math.max(0, age - 25);
        return Math.max(min, base - reduction);
    }

    /**
     * Calcule le taux d'alcoolémie à un moment donné
     * @param drinks Liste des alcools consommés
     * @param userProfile Profil de l'utilisateur
     * @param timeInMinutes Temps en minutes depuis le premier verre
     * @returns Taux d'alcoolémie en g/L
     */
    calculateAlcoholLevel(
        drinks: ConsommationAlcool[],
        userProfile: UserProfile,
        timeInMinutes: number
    ): number {
        if (drinks.length === 0) return 0;

        // Transform drinks en objets avec heure_consommation si manquant
        const drinksWithTime = drinks.map((drink): DrinkWithTime => ({
            ...drink,
            heure_consommation: drink.heure_consomation, // Utiliser la propriété existante
        }));

        const poids = Number(userProfile.poids) || 70;
        const k = this.getKCoefficient(userProfile.sexe, userProfile.age);
        const absorptionDuration = userProfile.manage_avant
            ? this.ABSORPTION_DURATION_AVEC_REPAS
            : this.ABSORPTION_DURATION_SANS_REPAS;

        // Obtenir le temps du premier verre
        const firstDrinkTime = this.getFirstDrinkTime(drinksWithTime);

        // Somme de l'alcool absorbé à l'instant T (sans élimination)
        let totalAbsorbed = 0;
        drinksWithTime.forEach(drink => {
            const timeFromFirstDrink = this.getMinutesDifference(
                firstDrinkTime,
                drink.heure_consommation
            );
            const absorptionStartTime = timeFromFirstDrink;

            if (timeInMinutes < absorptionStartTime) return;

            const pureAlcohol = this.calculatePureAlcohol(drink.quantite, drink.degre);
            const peakTaux = pureAlcohol / (poids * k);

            if (timeInMinutes <= absorptionStartTime + absorptionDuration) {
                // Montée progressive
                const fraction = (timeInMinutes - absorptionStartTime) / absorptionDuration;
                totalAbsorbed += peakTaux * fraction;
            } else {
                // Verre entièrement absorbé
                totalAbsorbed += peakTaux;
            }
        });

        // Élimination globale depuis le premier verre (cinétique d'ordre zéro)
        // Le foie traite l'alcool total en continu, pas verre par verre
        const eliminatedHours = timeInMinutes / 60;
        const totalEliminated = eliminatedHours * this.ELIMINATION_RATE;

        return Math.max(0, totalAbsorbed - totalEliminated);
    }

    /**
     * Génère les données pour le graphique
     * @param drinks Liste des alcools consommés
     * @param userProfile Profil de l'utilisateur
     * @param durationHours Durée totale à afficher (ex: 8 heures)
     * @param currentTimeFromFirstDrinkMinutes Temps écoulé actuel depuis le premier verre
     * @returns Array de points pour le graphique (arrête quand taux = 0)
     */
    generateGraphData(
        drinks: ConsommationAlcool[],
        userProfile: UserProfile,
        maxDurationHours: number = 24,
    ): AlcoholeDataPoint[] {
        if (drinks.length === 0) return [];

        const dataPoints: AlcoholeDataPoint[] = [];

        // Durée en minutes du dernier verre par rapport au premier
        const firstDrinkMs = Math.min(...drinks.map(d => d.heure_consomation.getTime()));
        const lastDrinkMs  = Math.max(...drinks.map(d => d.heure_consomation.getTime()));
        const lastDrinkMinutes = (lastDrinkMs - firstDrinkMs) / 60000;

        // On va au moins 24h après le dernier verre pour laisser le temps à l'élimination
        const totalMinutes = Math.max(maxDurationHours * 60, lastDrinkMinutes + 24 * 60);

        let hasSeenNonZero = false;

        for (let i = 0; i <= totalMinutes; i += 5) {
            const taux = this.calculateAlcoholLevel(drinks, userProfile, i);
            dataPoints.push({
                time: i / 60,
                taux: Math.round(taux * 1000) / 1000,
            });

            if (taux > 0.01) hasSeenNonZero = true;

            // Arrêter uniquement quand le taux est à zéro ET qu'on est bien
            // passé au-delà du dernier verre + sa fenêtre d'absorption (~45 min)
            if (hasSeenNonZero && taux <= 0.01 && i > lastDrinkMinutes + 45) {
                break;
            }
        }

        return dataPoints;
    }

    /**
     * Obtient le temps du premier verre
     */
    private getFirstDrinkTime(drinks: DrinkWithTime[]): Date {
        if (drinks.length === 0) return new Date();
        return drinks.reduce((first, current) =>
            current.heure_consommation < first.heure_consommation ? current : first
        ).heure_consommation;
    }

    /**
     * Calcule la différence en minutes entre deux dates
     */
    private getMinutesDifference(date1: Date, date2: Date): number {
        return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60);
    }

    /**
     * Retourne une description du niveau d'alcoolémie
     */
    getStatusDescription(taux: number): string {
        if (taux === 0) return 'Sobre';
        if (taux < 0.2) return 'Léger';
        if (taux < 0.5) return 'Joyeux 🎉';
        if (taux < 0.8) return 'Gai 😄';
        if (taux < 1.2) return 'Sympa 🍻';
        if (taux < 1.5) return 'Éméché 😵';
        return 'Danger ⚠️';
    }

    /**
     * Retourne un emoji approprié au niveau d'alcoolémie
     */
    getEmoji(taux: number): string {
        if (taux === 0) return '😇';
        if (taux < 0.2) return '🙂';
        if (taux < 0.5) return '😊';
        if (taux < 0.8) return '😄';
        if (taux < 1.2) return '🍻';
        if (taux < 1.5) return '😵';
        return '⚠️';
    }
}
