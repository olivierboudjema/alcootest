/**
 * Modèles de données pour l'application Alcootest
 */

export interface Profile {
    id: string;
    username: string;
}

export interface Soiree {
    id: string;
    name: string;
    creator: string;
    created_at?: string;
}

// Catalogue des types de verres
export interface Alcool {
    id: number;
    nom: string;
    type: 'cocktail' | 'vin' | 'biere' | 'spiritueux pur' | 'champagne';
    degre: number;
    quantite: number; // Volume en mL
}

// Consommation d'un verre dans une soirée (combine alcool + soiree_alcool)
export interface ConsommationAlcool extends Alcool {
    soiree_alcool_id: number; // id de la ligne soiree_alcool (pour delete/update)
    soiree_id: number;
    heure_consomation: Date;
    heure_consommation?: Date; // Pour compatibilité avec le code existant
}

// Type utilisé pour sélectionner/afficher un verre
export interface DrinkType {
    label: string;
    type: Alcool['type'];
    degre: number;
    quantite: number;
    id?: number;
    nom?: string;
}

export interface UserProfile {
    age: number;
    poids: number;
    sexe: 'H' | 'F';
    manage_avant: boolean;
}

export interface AlcoholeDataPoint {
    time: number; // heures depuis le début
    taux: number; // g/L
}

export interface DrinkWithTime extends Alcool {
    heure_consommation: Date; // Pour compatibilité avec le code existant
}
