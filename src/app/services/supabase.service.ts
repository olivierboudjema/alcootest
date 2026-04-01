import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Soiree, Alcool, ConsommationAlcool } from '../models/types';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabase.url,
            environment.supabase.anonKey
        );
    }

    // PROFILES
    async createProfile(username: string): Promise<Profile> {
        const { data, error } = await this.supabase
            .from('profiles')
            .insert([{ username }])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (createProfile):', error);
            throw new Error(`Impossible de créer le profil: ${error.message}`);
        }
        return data;
    }

    async getProfile(username: string): Promise<Profile | null> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select()
            .eq('username', username)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Supabase Error (getProfile):', error);
            throw new Error(`Impossible de charger le profil: ${error.message}`);
        }
        return data || null;
    }

    // SOIREES
    // Force l'interprétation UTC d'une date Supabase (évite le double décalage horaire)
    private parseUTC(dateStr: string): Date {
        if (!dateStr) return new Date();
        // Si pas de timezone info, ajouter Z pour forcer UTC
        const str = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
        return new Date(str);
    }

    async createSoiree(name: string, creator: string, startTime?: Date): Promise<Soiree> {
        const payload: any = { name, creator };
        if (startTime) payload.created_at = startTime.toISOString();
        const { data, error } = await this.supabase
            .from('soiree')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (createSoiree):', error);
            throw new Error(`Impossible de créer la soirée: ${error.message}`);
        }
        return data;
    }

    async getSoireesByCreator(creator: string): Promise<Soiree[]> {
        const { data, error } = await this.supabase
            .from('soiree')
            .select()
            .ilike('creator', creator)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getSoiree(id: string): Promise<Soiree> {
        const { data, error } = await this.supabase
            .from('soiree')
            .select()
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    // ALCOOLS (Catalogue)
    async getAllDrinks(): Promise<Alcool[]> {
        const { data, error } = await this.supabase
            .from('alcool')
            .select()
            .order('nom');

        if (error) throw error;
        return data || [];
    }

    // CONSOMMATIONS (soiree_alcool)
    async addDrink(
        alcool_id: number,
        soiree_id: number,
        heure?: Date
    ): Promise<Alcool> {
        const { data, error } = await this.supabase
            .from('soiree_alcool')
            .insert([
                {
                    alcool_id,
                    soiree_id,
                    heure_consomation: (heure ?? new Date()).toISOString(),
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { ...data, heure_consomation: this.parseUTC(data.heure_consomation) };
    }

    async getDrinksBySoiree(soiree_id: number): Promise<ConsommationAlcool[]> {
        const { data, error } = await this.supabase
            .from('soiree_alcool')
            .select(`
                id,
                soiree_id,
                heure_consomation,
                alcool:alcool_id (id, nom, type, degre, quantite)
            `)
            .eq('soiree_id', soiree_id)
            .order('heure_consomation', { ascending: true });

        if (error) throw error;


        return (data || []).map((item: any): ConsommationAlcool => ({
            id: item.alcool.id,
            soiree_alcool_id: item.id, // id de la ligne soiree_alcool
            nom: item.alcool.nom,
            type: item.alcool.type,
            degre: item.alcool.degre,
            quantite: item.alcool.quantite,
            soiree_id: item.soiree_id,
            heure_consomation: this.parseUTC(item.heure_consomation),
            heure_consommation: this.parseUTC(item.heure_consomation),
        }));
    }

    async updateDrinkTime(soiree_alcool_id: number, heure: Date): Promise<void> {
        const { error } = await this.supabase
            .from('soiree_alcool')
            .update({ heure_consomation: heure.toISOString() })
            .eq('id', soiree_alcool_id);

        if (error) throw error;
    }

    async deleteDrink(soiree_alcool_id: number): Promise<void> {
        const { error } = await this.supabase
            .from('soiree_alcool')
            .delete()
            .eq('id', soiree_alcool_id);

        if (error) throw error;
    }

    removeChannel(channel: any): void {
        this.supabase.removeChannel(channel);
    }

    // REAL-TIME SUBSCRIPTION
    subscribeToDrinks(soiree_id: number, callback: () => void) {
        return this.supabase
            .channel(`drinks:${soiree_id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'soiree_alcool',
                    filter: `soiree_id=eq.${soiree_id}`,
                },
                async () => {
                    callback();
                }
            )
            .subscribe();
    }
}
