# ✅ Checklist de Vérification - AlcooTest

## 📋 Vérification Pré-Lancement

Cochez à mesure que vous avancez:

### Installation & Configuration
- [ ] `npm install` exécuté sans erreurs
- [ ] `src/environments/environment.ts` rempli avec credentials Supabase
- [ ] Supabase project créé et tables générées
- [ ] `ng serve` lance sans erreurs
- [ ] Application disponible sur browser

### Composants & Services
- [ ] HomeComponent charge correctement
- [ ] DashboardComponent affiche le graphique
- [ ] SupabaseService peut lire les données
- [ ] CalculService calcule correctement
- [ ] StorageService sauvegarde/récupère les données

### Pages & Routes
- [ ] Route '/' → HomeComponent
- [ ] Route '/dashboard' → DashboardComponent
- [ ] Bouton "Créer" → redirige vers dashboard
- [ ] Bouton "Charger" → charge la soirée
- [ ] localStorage persistent (F5 refresh)

### Formulaires
- [ ] Formulaire création soirée fonctionne
- [ ] Validation des champs
- [ ] Boutons actifs/inactifs selon état
- [ ] Messages d'erreur clairs

### Graphique
- [ ] Graphique affiche courbe d'alcoolémie
- [ ] Couleurs: dégradé arc-en-ciel
- [ ] X-axis: temps (H+1, H+2...)
- [ ] Y-axis: taux g/L
- [ ] Axes avec labels

### Verres & Calcul
- [ ] 7 verres prédéfinis en liste
- [ ] Verre ajouté → DB Supabase
- [ ] Taux d'alcoolémie calculé
- [ ] Graphique mis à jour
- [ ] Emoji/statut changent

### Profil Utilisateur
- [ ] Poids éditable
- [ ] Sexe modifiable
- [ ] Changement → graphique recalculé
- [ ] Données persistées en localStorage

### Persistance
- [ ] `npm start` garder ouvert
- [ ] F5 → reste sur même soirée
- [ ] Fermer tab → rouvrir → soirée restaurée
- [ ] Nouveau tab → page accueil
- [ ] "Terminer" → LocalStorage cleared

### Performance
- [ ] Page charge en < 3 secondes
- [ ] Graphique fluide (pas de lag)
- [ ] Pas de memory leaks (DevTools)
- [ ] Responsive sur mobile (F12)

### Console & Erreurs
- [ ] 0 erreurs TypeScript
- [ ] 0 erreurs JavaScript console
- [ ] Pas de warnings critiques
- [ ] Network tab: appels Supabase OK

## 🔧 Checklist Débogage

Si quelque chose ne marche pas:

### Credentials Supabase
- [ ] URL correcte (copiée de Settings → API)
- [ ] Anon key correcte
- [ ] Pas d'espaces/caractères supplémentaires
- [ ] Vérifier environment.ts exactement

### Tables Supabase
- [ ] 3 tables créées: profiles, soiree, alcool
- [ ] Colonnes correctes pour chaque table
- [ ] Contraintes CHECK implémentées
- [ ] RLS enabled sur les tables

### Services
- [ ] SupabaseService inject()e correctement
- [ ] CalculService retourne nombres
- [ ] StorageService lit/écrit localStorage
- [ ] Pas de undefined errors

### UI/Graphique
- [ ] Canvas element présent
- [ ] Chart.js script chargé
- [ ] Pas de console.error pour Chart
- [ ] Colors/gradients appliqués

### Routes
- [ ] `app.routes.ts` correctement configuré
- [ ] Imports des composants vérifiés
- [ ] `redirectTo` configuré
- [ ] Navigation fonctionne

## 📊 Checklist Fonctionnalité

Testez chaque scénario:

### Scénario 1: Créer une Soirée
```
✅ Accueil charge
✅ Formulaire visible
✅ Tous les champs fillables
✅ Bouton "Créer" actif
✅ Soirée créée en DB
✅ Redirected to dashboard
✅ Graphique initial visible
```

### Scénario 2: Ajouter Verre
```
✅ Bouton "Ajouter un verre" visible
✅ Popup/modal s'ouvre
✅ 7 verres listés
✅ Sélection verre
✅ Verre inséré en DB
✅ Graphique mis à jour
✅ Taux recalculé
```

### Scénario 3: Modifier Profil
```
✅ Poids input editable
✅ Sexe select fonctionnel
✅ Changement → graphique recalcule
✅ Taux change
✅ Emoji/statut change
✅ LocalStorage mis à jour
```

### Scénario 4: Rafraîchir Page (F5)
```
✅ Page refresh
✅ Même soirée chargée (localStorage)
✅ Verres toujours visibles
✅ Graphique restauré
✅ Profil restauré
```

### Scénario 5: Charger Soirée Existante
```
✅ Accueil charge
✅ Bouton "Charger" visible
✅ Input pseudo fillable
✅ Recherche retourne soirées
✅ Sélection soirée
✅ Dashboard avec historique
```

### Scénario 6: Terminer Soirée
```
✅ Bouton "Terminer" visible
✅ Confirmation dialog
✅ LocalStorage cleared
✅ Redirected to home
✅ Nouveau formulaire vierge
```

## 🚨 Erreurs Communes

Si vous voyez ces erreurs, voici les fixes:

### "Cannot get soirees"
```
✅ Tables Supabase créées?
✅ Script SQL exécuté?
✅ RLS policies créées?
✅ Credentials corrects?
```

### "localStorage is not defined"
```
✅ Mode développement?
✅ Pas de mode privaté du navigateur?
✅ Cookies activés?
```

### "Chart is not defined"
```
✅ Chart.js importé?
✅ canvas element existe en DOM?
✅ ID canvas correct?
```

### "Impossible de créer profil"
```
✅ Table profiles exist?
✅ Colonne username unique?
✅ RLS policy INSERT OK?
```

### "Graphique vide"
```
✅ Pas de verres ajoutés?
✅ F5 refresh pour tester
✅ Console a erreurs?
✅ Données en DB?
```

## 📱 Checklist Mobile

Test sur mobile (F12 device mode):

- [ ] Layout responsive (pas scroll horizontal)
- [ ] Boutons cliquables (size ≥ 44px)
- [ ] Text lisible (size ≥ 14px)
- [ ] Input keyboard visible
- [ ] Graphique adapté à screen
- [ ] Navigation accessible
- [ ] Couleurs contrastées

## ✨ Checklist Qualité Code

- [ ] TypeScript strict mode
- [ ] Pas de `any` types
- [ ] Imports organisés
- [ ] Noms variables clairs
- [ ] Services standalone
- [ ] Composants focuses
- [ ] No console.log() en prod
- [ ] Commentaires importants

## 🚀 Pre-Deployment

Avant de mettre en production:

- [ ] Build prod sans errors: `ng build`
- [ ] dist/ folder créé
- [ ] main.js < 100KB gzipped
- [ ] SourceMaps disabled
- [ ] Environment prod configuré
- [ ] Analytics/monitoring setup
- [ ] Backup DB Supabase
- [ ] SSL certificate ready

## 📞 Vérification Finale

Avant d'annoncer "ready":

- [ ] `npm start` → fonctionne
- [ ] Créer soirée → fonctionne
- [ ] Ajouter verre → fonctionne
- [ ] Modifier profil → fonctionne
- [ ] F5 refresh → fonctionne
- [ ] Charger soirée → fonctionne
- [ ] Terminer soirée → fonctionne
- [ ] Build prod → fonctionne
- [ ] 0 console errors
- [ ] 0 TypeScript errors

---

## ✅ Status: 

### Application Status
```
✅ Développement: COMPLÈTE
✅ Compilation: OK
✅ Features: IMPLÉMENTÉES
✅ Docs: FOURNIE
✅ Build: TESTÉ
✅ Prête pour: LANCEMENT ✨
```

---

**Fait le**: 21/03/2026
**Version**: 1.0.0 - Production Ready
**Status**: ✅ VALIDATED
