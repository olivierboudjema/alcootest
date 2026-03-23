# 🍺 AlcooTest - Application Angular de Calcul d'Alcoolémie

Une application Angular 21 complète et moderna pour calculer l'alcoolémie en temps réel pendant une soirée, avec graphique interactif et persistance de données.

## 🎯 Fonctionnalités Principales

✅ **Calcul d'alcoolémie en temps réel** - Formule scientifique de Widmark
✅ **Graphique interactif** - Courbe arc-en-ciel avec Chart.js  
✅ **Interface mobile-first** - Optimisée pour le Portrait
✅ **Persistance de données** - LocalStorage + Supabase
✅ **Gestion de profil** - Éditable avec mise à jour graphique instantanée  
✅ **Verres prédéfinis** - Sélection rapide (Pinte, Vin, Shot, etc.)
✅ **Statuts émojis** - Description visuelle du niveau d'alcoolémie  
✅ **Suivi multi-soirée** - Créer et charger plusieurs soirées
✅ **Temps réel** - Mise à jour automatique toutes les 5 secondes

## 🛠️ Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Angular** | 21.2.0 | Framework principal |
| **TypeScript** | 5.9.2 | Langage typé |
| **Tailwind CSS** | 4.1.12 | Styling mobile |
| **Chart.js** | 4.x | Graphiques |
| **Supabase** | 2.99.3 | Backend & Base de données |
| **RxJS** | 7.8.0 | Programmation réactive |
| **Signaux Angular** | v21+ | State management |

## 📱 Architecture

### Composants Standalone
- **HomeComponent** - Écran d'accueil (créer/charger soirée)
- **DashboardComponent** - Dashboard principal (graphique + verres)

### Services
- **SupabaseService** - CRUD Supabase avec subscriptions temps réel
- **CalculService** - Moteur mathématique (formule de Widmark)
- **StorageService** - Gestion du LocalStorage

### Modèles
- `Profile` - Profil utilisateur
- `Soiree` - Soirée (session)
- `Alcool` - Verre d'alcool consommé
- `UserProfile` - Données de l'utilisateur (âge, poids, sexe)

## 🚀 Démarrage Rapide

### 1. Configuration Supabase
```bash
# Voir INSTALLATION.md pour les détails complets
# Vous devez:
# 1. Créer un projet Supabase
# 2. Exécuter le script SQL pour créer les tables
# 3. Remplir src/environments/environment.ts avec vos credentials
```

### 2. Installation & Démarrage
```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement (port 4300 par défaut)
npm start

# Le serveur sera disponible sur: http://localhost:4300
```

### 3. Build Production
```bash
# Compiler pour la production
npm run build

# Les fichiers sont générés dans: dist/alcootest/
```

## 📐 Formule Scientifique

L'application utilise la **formule de Widmark** pour calculer l'alcoolémie:

$$\text{Taux (g/L)} = \frac{\text{Alcool}_{pur}(g)}{\text{Poids}(kg) \times K}$$

Où:
- **K** = 0.7 (Hommes), 0.6 (Femmes)
- **Alcool pur (g)** = Volume(ml) × (Degré/100) × 0.8
- **Élimination** = 0.15 g/L par heure (métabolisme naturel)
- **Délai absorption** = +30 minutes si nourriture consommée avant

## 🎮 Utilisation

### Page d'Accueil
1. **Créer une soirée**: Remplissez le formulaire avec vos infos
   - Pseudo, Nom de soirée, Âge, Poids, Sexe
   - Cochez si vous avez mangé avant
   
2. **Charger une soirée existante**: Rentrez un pseudo pour voir ses soirées

### Dashboard Principal
- **Graphique**: Courbe d'alcoolémie en direct
- **Résumé profil**: Modifiez poids/sexe (graphique se met à jour)
- **Ajouter un verre**: Sélectionnez parmi les verres prédéfinis
- **Statut**: Emoji et description selon votre niveau
- **Terminer**: Retour à l'accueil

## 📊 Statuts d'Alcoolémie

| Taux (g/L) | Statut | Emoji | Description |
|-----------|--------|-------|-------------|
| 0 | Sobre | 😇 | Zéro alcool |
| < 0.2 | Léger | 🙂 | Légèrement sérein |
| < 0.5 | Joyeux | 😊 | Ambiance monte |
| < 0.8 | Gai | 😄 | Très gai |
| < 1.2 | Sympa | 🍻 | Sympa mais limite |
| < 1.5 | Éméché | 😵 | Perte de contrôle |
| ≥ 1.5 | Danger | ⚠️ | Zone de danger |

## 🗄️ Structure Base de Données

### Supabase Tables

```sql
-- Profils utilisateurs
profiles (id TEXT PRIMARY KEY, username TEXT UNIQUE)

-- Soirées (sessions)
soiree (id UUID PRIMARY KEY, name TEXT, creator TEXT, created_at TIMESTAMP)

-- Verres consommés
alcool (
  id UUID PRIMARY KEY,
  nom TEXT,
  type TEXT (cocktail|vin|biere|spiritueux pur|champagne),
  degre DECIMAL,
  quantite DECIMAL,
  soiree_id UUID FOREIGN KEY,
  heure_consommation TIMESTAMP
)
```

## 🎨 Design & UX

- **Mobile-first** - Optimisé pour écrans Portrait
- **Gradient background** - Bleu à violet dégrade
- **Graphique coloré** - Dégradé arc-en-ciel pour la courbe
- **Responsive text** - Lisible sur petits écrans
- **Emojis intuitifs** - Compréhension immédiate du statut

## 📦 Verres Prédéfinis

```typescript
[
  { label: 'Pinte (5%)', type: 'biere', degre: 5, quantite: 500 },
  { label: 'Vin rouge (13%)', type: 'vin', degre: 13, quantite: 150 },
  { label: 'Shot (40%)', type: 'spiritueux pur', degre: 40, quantite: 50 },
  { label: 'Champagne (12%)', type: 'champagne', degre: 12, quantite: 150 },
  { label: 'Cocktail (15%)', type: 'cocktail', degre: 15, quantite: 200 },
  { label: 'Verre de bière (5%)', type: 'biere', degre: 5, quantite: 250 },
  { label: 'Verre de vin blanc (12%)', type: 'vin', degre: 12, quantite: 150 },
]
```

## 🧪 Tests & Validation

### Test Scénario Complet
1. ✅ Créer une soirée
2. ✅ Ajouter plusieurs verres
3. ✅ Observer le graphique se mettre à jour
4. ✅ Modifier poids/sexe → graphique change
5. ✅ Rafraîchir F5 → reste sur la même soirée
6. ✅ Charger une soirée existante
7. ✅ Terminer une soirée

### Build & Compilation
```bash
ng build --configuration=development  # ✅ Succès
npm start                             # ✅ Serveur démarre
```

## 📄 Fichiers Importants

```
📁 src/
  📁 app/
    📁 components/
      📁 home/home.component.ts          (Page accueil)
      📁 dashboard/dashboard.component.ts (Dashboard)
    📁 services/
      supabase.service.ts               (API Supabase)
      calcul.service.ts                 (Formule Widmark)
      storage.service.ts                (LocalStorage)
    📁 models/
      types.ts                          (Interfaces TypeScript)
    app.routes.ts                       (Routing)
    app.config.ts                       (Configuration)
    app.ts                              (Composant root)
  📁 environments/
    environment.ts                      (⚠️ À configurer!)
  styles.css                            (Tailwind global)
  main.ts                               (Point d'entrée)

📄 angular.json                         (Config CLI)
📄 tsconfig.json                        (Config TypeScript)
📄 INSTALLATION.md                      (Guide installation)
📄 SETUP.md                             (Configuration détaillée)
```

## ⚠️ Points Importants

### Configuration Requise
- ⚠️ **CONFIGURATION SUPABASE OBLIGATOIRE** dans `environment.ts`
- Les tables doivent être créées en base de données
- Les RLS policies doivent être configurées pour le dev

### LocalStorage
- Sauvegarde: soireeId_courant, username, profil utilisateur
- Disparaît au "Terminer la soirée"
- Restauré au rechargement F5

### Limitations Actuelles
- ⚠️ Pas d'authentification utilisateur (à venir)
- ⚠️ Pas d'export de graphique
- ⚠️ Pas de tracking historique complet

## 🚨 Avertissements Légaux

⚠️ **IMPORTANT:** 
- Cette application est à titre informatif/éducatif uniquement
- Elle ne remplace **PAS** un alcootest professionnel
- Les calculs sont approximatifs et variables selon les individus
- **NE CONDUISEZ JAMAIS** en état d'ébriété!
- Consommez l'alcool de manière responsable

## 📞 Support & Contribution

### Dépannage
Consultez [INSTALLATION.md](./INSTALLATION.md) pour les solutions courantes

### Améliorations Futures
- [ ] Statistiques historiques
- [ ] Graphique exportable (PNG)
- [ ] Authentification utilisateur
- [ ] Dark mode
- [ ] Notifications de limite légale
- [ ] Import/export de données

## 📝 Licence

MIT - Libre d'utilisation

---

**Créé avec ❤️ en Angular 21**

*Version: 1.0.0 - 21/03/2026*
