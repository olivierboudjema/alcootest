# 🚀 Guide d'Installation - AlcooTest

## ✅ Configuration Supabase (IMPORTANT!)

### Étape 1: Créer un compte Supabase
1. Allez sur [https://supabase.com](https://supabase.com)
2. Inscrivez-vous ou connectez-toi avec GitHub
3. Créez un nouveau projet appelé "alcootest"

### Étape 2: Obtenir vos credentials
1. Allez dans **Settings → API**
2. Copiez:
   - **Project URL** (SUPABASE_URL)
   - **anon public** (SUPABASE_ANON_KEY)

### Étape 3: Créer les tables Supabase

Dans l'éditeur SQL de Supabase (SQL Editor), exécutez ce script:

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

-- Activer RLS (Row Level Security) - Optionnel mais recommandé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE soiree ENABLE ROW LEVEL SECURITY;
ALTER TABLE alcool ENABLE ROW LEVEL SECURITY;

-- Pour development, créer des policies permissives
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can create profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read soirees" ON soiree FOR SELECT USING (true);
CREATE POLICY "Anyone can create soirees" ON soiree FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read alcools" ON alcool FOR SELECT USING (true);
CREATE POLICY "Anyone can create alcools" ON alcool FOR INSERT WITH CHECK (true);
```

### Étape 4: Configurer les variables d'environnement

Ouvrez `src/environments/environment.ts` et remplissez vos credentials:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',  // ← Remplacez par votre URL
    anonKey: 'YOUR_ANON_KEY',                    // ← Remplacez par votre clé
  },
};
```

## 🎯 Démarrage de l'application

### Installation des dépendances
```bash
npm install
```

### Démarrage du serveur de développement
```bash
npm start
```

L'application sera disponible sur: **http://localhost:4200**

### Build pour la production
```bash
npm run build
```

Les fichiers seront générés dans le dossier `dist/alcootest/`

## 🧪 Tester l'application

### Scénario de test complet

1. **Créer une soirée:**
   - Cliquez sur "Créer une soirée"
   - Pseudo: "jean"
   - Nom de soirée: "Apéro samedi"
   - Âge: 30
   - Poids: 75 kg
   - Sexe: Homme
   - Mangé avant: Non
   - Cliquez "Créer"

2. **Ajouter des verres:**
   - Cliquez "Ajouter un verre"
   - Sélectionnez plusieurs verres (ex: Pinte, Vin, Shot)
   - Observez la courbe d'alcoolémie qui se met à jour

3. **Modifier le profil:**
   - Changez le poids ou le sexe
   - Observez que le graphique se met à jour en temps réel

4. **Rafraîchir la page:**
   - F5 pour rafraîchir
   - Vérifiez que vous restez sur la même soirée (grâce à LocalStorage)

5. **Charger une soirée existante:**
   - Terminez la soirée → "Terminer la soirée"
   - Cliquez "Charger une soirée"
   - Entrez "jean"
   - Sélectionnez "Apéro samedi"

## 🐛 Dépannage

### "Erreur lors de la création de la soirée"
**Cause:** Credentials Supabase invalides
**Solution:** Vérifiez environment.ts et copiez les bonnes valeurs depuis Supabase

### "Impossible de créer un profil"
**Cause:** La table profiles n'existe pas
**Solution:** Exécutez le script SQL pour créer les tables

### "Le graphique ne se met pas à jour"
**Cause:** Les données ne sont pas rechargées
**Solution:** Attendez quelques secondes ou rafraîchissez la page (F5)

### "localStorage est indisponible"
**Cause:** Les cookies sont bloqués ou vous êtes en mode privé
**Solution:** Utilisez un mode normal du navigateur

## 📱 Caractéristiques testées

- ✅ Création de profil et soirée
- ✅ Calcul d'alcoolémie selon la formule de Widmark
- ✅ Graphique coloré avec courbe arc-en-ciel
- ✅ Modification du profil + mise à jour graphique
- ✅ Persistance avec LocalStorage
- ✅ Intégration Supabase
- ✅ Interface mobile-first
- ✅ Statuts d'alcoolémie avec emojis

## 📚 Architecture du projet

```
src/
├── app/
│   ├── components/
│   │   ├── home/home.component.ts       # Page d'accueil (créer/charger)
│   │   └── dashboard/dashboard.component.ts  # Dashboard principal
│   ├── services/
│   │   ├── supabase.service.ts   # CRUD Supabase
│   │   ├── calcul.service.ts     # Moteur mathématique
│   │   └── storage.service.ts    # Gestion LocalStorage
│   ├── models/types.ts           # Interfaces TypeScript
│   ├── app.routes.ts             # Routes
│   ├── app.config.ts             # Configuration
│   └── app.ts                    # Composant root
├── environments/environment.ts   # Variables d'environnement
└── main.ts                       # Point d'entrée
```

## 🎓 Formule utilisée

La formule de Widmark :

```
Taux (g/L) = Alcool_pur(g) / (Poids(kg) × K)

Où :
- K = 0.7 (Homme), 0.6 (Femme)
- Alcool pur (g) = Volume(ml) × (Degré/100) × 0.8
- Élimination = 0.15 g/L / heure (après absorption)
- Délai absorption = +30 min si mange avant
```

## 📝 Notes importantes

- Cette application est à titre informatif/éducatif
- Elle ne remplace pas un alcootest professionnel
- Consommez l'alcool de manière responsable
- Ne conduisez jamais en état d'ébriété!

## ❓ Questions?

Vérifiez le fichier SETUP.md pour plus de détails sur la configuration.

---

**Bon amusement! 🍻**
