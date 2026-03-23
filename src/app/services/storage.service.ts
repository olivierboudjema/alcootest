import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class StorageService {
    private readonly CURRENT_SOIREE_KEY = 'alcootest_current_soiree';
    private readonly USERNAME_KEY = 'alcootest_username';
    private readonly USER_PROFILE_KEY = 'alcootest_user_profile';

    private isLocalStorageAvailable(): boolean {
        try {
            return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
        } catch {
            return false;
        }
    }

    setCurrentSoiree(soireeId: string): void {
        if (!this.isLocalStorageAvailable()) return;
        try {
            localStorage.setItem(this.CURRENT_SOIREE_KEY, soireeId);
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    }

    getCurrentSoiree(): string | null {
        if (!this.isLocalStorageAvailable()) return null;
        try {
            return localStorage.getItem(this.CURRENT_SOIREE_KEY);
        } catch (e) {
            console.warn('LocalStorage read failed:', e);
            return null;
        }
    }

    clearCurrentSoiree(): void {
        if (!this.isLocalStorageAvailable()) return;
        try {
            localStorage.removeItem(this.CURRENT_SOIREE_KEY);
        } catch (e) {
            console.warn('LocalStorage clear failed:', e);
        }
    }

    setUsername(username: string): void {
        if (!this.isLocalStorageAvailable()) return;
        try {
            localStorage.setItem(this.USERNAME_KEY, username);
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    }

    getUsername(): string | null {
        if (!this.isLocalStorageAvailable()) return null;
        try {
            return localStorage.getItem(this.USERNAME_KEY);
        } catch (e) {
            console.warn('LocalStorage read failed:', e);
            return null;
        }
    }

    setUserProfile(profile: any): void {
        if (!this.isLocalStorageAvailable()) return;
        try {
            localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    }

    getUserProfile(): any | null {
        if (!this.isLocalStorageAvailable()) return null;
        try {
            const data = localStorage.getItem(this.USER_PROFILE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('LocalStorage read failed:', e);
            return null;
        }
    }

    clearAll(): void {
        if (!this.isLocalStorageAvailable()) return;
        try {
            localStorage.removeItem(this.CURRENT_SOIREE_KEY);
            localStorage.removeItem(this.USERNAME_KEY);
            localStorage.removeItem(this.USER_PROFILE_KEY);
        } catch (e) {
            console.warn('LocalStorage clear failed:', e);
        }
    }
}
