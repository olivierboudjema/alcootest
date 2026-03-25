import { Injectable } from '@angular/core';

export interface EtatAlcool {
    level: string;
    status: string;
}

@Injectable({
    providedIn: 'root',
})
export class EtatService {
    private etats: EtatAlcool[] = [];

    constructor() {
        this.loadEtats();
    }

    private loadEtats() {
        // Charger les données depuis le fichier JSON
        const etatData = {
            echelle_alcool_grammes: [
                {
                    level: "0.0",
                    status: "Sobriété exemplaire."
                },
                {
                    level: "0.1",
                    status: "Légère désinhibition."
                },
                {
                    level: "0.2",
                    status: "On retrouve la sourire."
                },
                {
                    level: "0.3",
                    status: "Le rire facile et sonore."
                },
                {
                    level: "0.4",
                    status: "Confiance en soi boostée."
                },
                {
                    level: "0.5",
                    status: "Le centre de l'attention."
                },
                {
                    level: "0.6",
                    status: "L'élocution devient créative."
                },
                {
                    level: "0.7",
                    status: "Envie soudaine de danser."
                },
                {
                    level: "0.8",
                    status: "Sensation de puissance absolue."
                },
                {
                    level: "0.9",
                    status: "Décontraction totale des muscles."
                },
                {
                    level: "1.0",
                    status: "Le moment des grands discours."
                },
                {
                    level: "1.1",
                    status: "Gestuelle de moins en moins contrôlée."
                },
                {
                    level: "1.2",
                    status: "Danser et phaser."
                },
                {
                    level: "1.3",
                    status: "Tkt je suis pas bourré."
                },
                {
                    level: "1.4",
                    status: "Maître tunnelier."
                },
                {
                    level: "1.5",
                    status: "La genance."
                },
                {
                    level: "1.6",
                    status: "Confusion mentale et bugs visuels."
                },
                {
                    level: "1.7",
                    status: "Monologue intense sans fin."
                },
                {
                    level: "1.8",
                    status: "Expressions faciales déformées."
                },
                {
                    level: "1.9",
                    status: "Le coup de barre monumental."
                },
                {
                    level: "2.0",
                    status: "Fusion avec le mobilier urbain."
                },
                {
                    level: "2.1",
                    status: "Perte totale du sens de l'orientation."
                },
                {
                    level: "2.2",
                    status: "Présence physique uniquement."
                },
                {
                    level: "2.3",
                    status: "Absence de signal cérébral."
                },
                {
                    level: "2.4",
                    status: "L'appel de la porcelaine."
                },
                {
                    level: "2.5",
                    status: "Hystérie résiduelle."
                },
                {
                    level: "2.6",
                    status: "Retour à l'instinct primaire."
                }
            ]
        };

        this.etats = etatData.echelle_alcool_grammes;
    }

    /**
     * Récupère l'état d'alcool le plus proche du taux donné
     * @param taux Taux d'alcoolémie en g/L
     * @returns EtatAlcool correspondant
     */
    getEtatByTaux(taux: number): EtatAlcool {
        if (this.etats.length === 0) {
            return { level: '0.0', status: 'Aucune donnée disponible' };
        }

        // Arrondir le taux au 0.1 le plus proche pour trouver le bon état
        const roundedTaux = Math.round(taux * 10) / 10;
        const levelKey = roundedTaux.toFixed(1);

        // Chercher l'état correspondant
        const etat = this.etats.find(e => e.level === levelKey);

        // Si exact, sinon chercher le plus proche inférieur
        if (etat) {
            return etat;
        }

        // Trouver le taux le plus proche inférieur
        let closestEtat = this.etats[0];
        for (const e of this.etats) {
            if (parseFloat(e.level) <= taux) {
                closestEtat = e;
            } else {
                break;
            }
        }

        return closestEtat;
    }

    /**
     * Récupère le chemin de l'image correspondant au taux
     * @param taux Taux d'alcoolémie en g/L
     * @returns Chemin de l'image
     */
    getImageByTaux(taux: number): string {
        const etat = this.getEtatByTaux(taux);
        return `/assets/etat/${etat.level}.jpg`;
    }

    /**
     * Récupère tous les états d'alcool
     */
    getAllEtats(): EtatAlcool[] {
        return this.etats;
    }
}
