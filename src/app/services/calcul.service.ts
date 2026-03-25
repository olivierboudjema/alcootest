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
    private readonly DELAI_ABSORPTION_AVEC_REPAS = 30; // minutes

    /**
     * Calcule l'alcool pur en grammes
     * Alcool pur (g) = Volume(mL) × (Degre/100) × 0.8
     * quantite est stockée en mL dans la DB
     */
    private calculatePureAlcohol(volumeMl: number, degre: number): number {
        return volumeMl * (degre / 100) * 0.8;
    }

    /**
     * Calcule le coefficient de distribution K selon le sexe
     */
    private getKCoefficient(sexe: 'H' | 'F'): number {
        return sexe === 'H' ? this.K_HOMME : this.K_FEMME;
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

        const k = this.getKCoefficient(userProfile.sexe);
        const delaiAbsorption = userProfile.manage_avant
            ? this.DELAI_ABSORPTION_AVEC_REPAS
            : 0;

        let totalTaux = 0;

        // Obtenir le temps du premier verre
        const firstDrinkTime = this.getFirstDrinkTime(drinksWithTime);


        drinksWithTime.forEach(drink => {
            const timeFromFirstDrink = this.getMinutesDifference(
                firstDrinkTime,
                drink.heure_consommation
            );

            // Absorption commence immédiatement à la consommation, monte sur 20 min
            const absorptionStartTime = timeFromFirstDrink + delaiAbsorption;
            const absorptionDuration = 40; // minutes

            // Calcul du taux au moment du pic
            const pureAlcohol = this.calculatePureAlcohol(
                drink.quantite,
                drink.degre
            );
            const peakTaux = pureAlcohol / (userProfile.poids * k);

            if (timeInMinutes < absorptionStartTime) {
                // Pas encore absorbé
                return;
            }

            // Montée progressive pendant absorptionDuration minutes
            if (timeInMinutes <= absorptionStartTime + absorptionDuration) {
                const fraction = (timeInMinutes - absorptionStartTime) / absorptionDuration;
                totalTaux += peakTaux * fraction;
                return;
            }

            // Après le pic : élimination
            const elapsedAfterAbsorption = timeInMinutes - (absorptionStartTime + absorptionDuration);
            const elimination =
                (elapsedAfterAbsorption / 60) * this.ELIMINATION_RATE;
            const drinkTaux = Math.max(0, peakTaux - elimination);

            totalTaux += drinkTaux;
        });

        return Math.max(0, totalTaux);
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
        const dataPoints: AlcoholeDataPoint[] = [];
        const totalMinutes = maxDurationHours * 60;
        let hasSeenNonZero = false;

        // Un point tous les 5 minutes, de t=0 jusqu'au moment où le taux revient à 0
        for (let i = 0; i <= totalMinutes; i += 5) {
            const taux = this.calculateAlcoholLevel(drinks, userProfile, i);
            dataPoints.push({
                time: i / 60, // heures depuis le premier verre
                taux: Math.round(taux * 1000) / 1000,
            });

            if (taux > 0.01) hasSeenNonZero = true;

            // Arrêter dès que le taux est retombé à zéro
            if (hasSeenNonZero && taux <= 0.01) {
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
