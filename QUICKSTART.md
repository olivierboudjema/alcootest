# ⚡ Quick Start - AlcooTest

Lancez l'application en **5 minutes** 🚀

## Étape 1: Obtenir les credentials Supabase (2 min)

### Sans compte Supabase? Créez-en un:
```
1. Allez sur https://supabase.com
2. Sign up avec GitHub
3. Créez un nouveau projet "alcootest"
```

### Obtenir URL et clé:
```
1. Ouvrez Settings → API
2. Copiez "Project URL" (ex: https://xxxxx.supabase.co)
3. Copiez "anon public" key (ex: eyJhbGc...)
```

## Étape 2: Créer les tables Supabase (1 min)

### In Supabase Dashboard:
```
1. Cliquez sur "SQL Editor"
2. New Query
3. Collez ce script:
```

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE soiree (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE alcool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cocktail', 'vin', 'biere', 'spiritueux pur', 'champagne')),
  degre DECIMAL(5,2) NOT NULL,
  quantite DECIMAL(5,2) NOT NULL,
  soiree_id uuid NOT NULL REFERENCES soiree(id) ON DELETE CASCADE,
  heure_consommation TIMESTAMP DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE soiree ENABLE ROW LEVEL SECURITY;
ALTER TABLE alcool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Any create profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Any read soirees" ON soiree FOR SELECT USING (true);
CREATE POLICY "Any create soirees" ON soiree FOR INSERT WITH CHECK (true);
CREATE POLICY "Any read alcools" ON alcool FOR SELECT USING (true);
CREATE POLICY "Any create alcools" ON alcool FOR INSERT WITH CHECK (true);
```

```
4. "Run" button
5. Done! ✅
```

## Étape 3: Configurer l'app (1 min)

### Éditer `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',  // ← Votre URL depuis Supabase
    anonKey: 'eyJhbGc...',                        // ← Votre clé depuis Supabase
  },
};
```

## Étape 4: Lancer l'app (1 min)

```bash
cd alcootest

# Install dependencies (si pas déjà fait)
npm install

# Start development server
npm start

# L'app sera sur: http://localhost:4200
```

## ✅ Test Rapide (bonus)

Cliquez sur "Créer une soirée" et remplissez:
```
Pseudo: jean
Soirée: Apéro vendredi
Âge: 30
Poids: 75
Sexe: Homme
Mangé: Non

Cliquez Créer → Vous êtes sur le Dashboard!

Cliquez "Ajouter un verre" → Sélectionnez "Pinte (5%)"

Observez le graphique monter! 📈
```

## 🐛 Ça ne marche pas?

### erreur "Cannot get soirees"
→ Vérifiez que les tables existent dans Supabase

### "localhost:4200 refused to connect"
→ Le serveur n'a pas démarré
→ Essayez: `ng serve --port 4300`

### "Impossible de créer une soirée"
→ Vérifiez les credentials dans environment.ts  

## 📚 Plus d'infos

- Configuration advanced → [INSTALLATION.md](./INSTALLATION.md)
- Architecture complète → [README_COMPLET.md](./README_COMPLET.md)
- Setup détaillé → [SETUP.md](./SETUP.md)

---

**Enjoy! 🍺** (responsibly 😉)
