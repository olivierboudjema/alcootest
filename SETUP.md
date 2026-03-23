# 🍺 AlcooTest - Application Web de Calcul d'Alcoolémie

Une application Angular mobile-first pour calculer l'alcoolémie en temps réel pendant une soirée.

## 🎯 Fonctionnalités

- ✅ Création et gestion de soirées
- ✅ Calcul d'alcoolémie en temps réel basé sur la formule de Widmark
- ✅ Graphique interactif avec Chart.js (courbe arc-en-ciel)
- ✅ Ajout rapide de verres prédéfinis
- ✅ Profil éditable (poids, sexe)
- ✅ Persistance avec LocalStorage
- ✅ Intégration Supabase pour la base de données
- ✅ Interface mobile-first (Portrait)
- ✅ Mise à jour en temps réel

## 🛠️ Stack Technique

- **Framework**: Angular 21
- **Styling**: Tailwind CSS
- **Graphiques**: Chart.js + ng2-charts
- **Base de données**: Supabase
- **State Management**: Angular Signals
- **Build Tool**: esbuild (via Angular CLI)

## 📋 Configuration Supabase

### 1. Créer les tables dans Supabase

```sql
-- Table profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Table soiree
CREATE TABLE soiree (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator TEXT NOT NULL REFERENCES profiles(username),
  created_at TIMESTAMP DEFAULT now()
);

-- Table alcool
CREATE TABLE alcool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cocktail', 'vin', 'biere', 'spiritueux pur', 'champagne')),
  degre DECIMAL(5,2) NOT NULL,
  quantite DECIMAL(5,2) NOT NULL,
  soiree_id uuid NOT NULL REFERENCES soiree(id) ON DELETE CASCADE,
  heure_consommation TIMESTAMP DEFAULT now()
);
```

### 2. Configurer les variables d'environnement

Dans `src/environments/environment.ts`, remplissez vos credentials Supabase :

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_ANON_KEY',
  },
};
```

Vous pouvez trouver ces valeurs dans le dashboard Supabase → Settings → API.

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm start

# Build pour la production
npm run build
```

L'application sera disponible sur `http://localhost:4200`

## 📱 Utilisation

### Page d'accueil
1. **Créer une soirée** : Remplissez le formulaire avec vos informations
   - Pseudo
   - Nom de la soirée
   - Âge, Poids, Sexe
   - Avez-vous mangé avant ?

2. **Charger une soirée** : Sélectionnez une soirée existante par pseudo

### Dashboard Principal
- **Graphique** : Courbe d'alcoolémie réelle en temps réel
- **Résumé profil** : Modifiez votre poids/sexe (le graphique se met à jour)
- **Ajouter un verre** : Sélectionnez un verre prédéfini
- **Statut** : Description et emoji selon votre niveau
- **Terminer la soirée** : Retour à l'accueil

## 📐 Formule de Calcul (Widmark)

$$\text{Taux (g/L)} = \frac{\text{Alcool}_{pur}(g)}{\text{Poids}(kg) \times K}$$

Où :
- **K** = 0.7 (Homme), 0.6 (Femme)
- **Alcool pur (g)** = Volume(ml) × (Degré/100) × 0.8
- **Élimination** = 0.15 g/L par heure après absorption
- **Délai avec repas** = +30 minutes d'absorption

## 🎨 Verres Prédéfinis

- Pinte (5%, 500ml)
- Vin rouge (13%, 150ml)
- Shot (40%, 50ml)
- Champagne (12%, 150ml)
- Cocktail (15%, 200ml)
- Et plus...

## 🛡️ Sécurité & Bonnes Pratiques

- ✅ Formulaires réactifs (Reactive Forms)
- ✅ TypeScript strict
- ✅ Signaux Angular pour la réactivité
- ✅ Services avec `providedIn: 'root'`
- ✅ Composants standalone
- ✅ Change detection strategy: OnPush
- ✅ Pas de `ngClass`/`ngStyle` (utilisation de class bindings)
- ✅ Contrôle de flux natif (@if, @for)

## 📝 Statuts d'Alcoolémie

| Taux (g/L) | Statut | Description |
|-----------|--------|-------------|
| 0 | Sobre | 😇 |
| < 0.2 | Léger | 🙂 |
| < 0.5 | Joyeux | 😊 |
| < 0.8 | Gai | 😄 |
| < 1.2 | Sympa | 🍻 |
| < 1.5 | Éméché | 😵 |
| ≥ 1.5 | Danger | ⚠️ |

## 🐛 Dépannage

### "Impossible de créer une soirée"
- Vérifiez vos credentials Supabase dans `environment.ts`
- Vérifiez que les tables sont bien créées en base de données

### "Graphique vide"
- Attendez quelques secondes après l'ajout d'un verre
- Vérifiez la console pour les erreurs

### LocalStorage ne persiste pas
- Vérifiez que les cookies ne sont pas bloqués
- Utilisez un mode non-privé du navigateur

## 📦 Architecture

```
src/
├── app/
│   ├── components/
│   │   ├── home/
│   │   │   └── home.component.ts
│   │   └── dashboard/
│   │       └── dashboard.component.ts
│   ├── services/
│   │   ├── supabase.service.ts
│   │   ├── calcul.service.ts
│   │   └── storage.service.ts
│   ├── models/
│   │   └── types.ts
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.ts
├── environments/
│   └── environment.ts
└── main.ts
```

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont bienvenues! N'hésitez pas à créer une issue ou une pull request.

---

**Avertissement Légal** : Cette application est à titre informatif. Elle ne remplace pas un alcootest professionnel. Consommez l'alcool de manière responsable et ne conduisez jamais en état d'ébriété.
