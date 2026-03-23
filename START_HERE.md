# 📝 COMMENCER ICI - Instructions Finales

## 👋 Bienvenue sur AlcooTest!

Vous avez maintenant une **application Angular 21 complète** pour calculer l'alcoolémie en temps réel. Voici comment la lancer.

## ⚡ 3 ÉTAPES SEULEMENT

### ÉTAPE 1: Configurer Supabase (2 minutes)

Vous devez obtenir deux credentials:
- `SUPABASE_URL` 
- `SUPABASE_ANON_KEY`

#### Où les obtenir?
```
1. Allez sur https://supabase.com
2. Créez un compte (Sign up avec GitHub)
3. Créez un nouveau projet appelé "alcootest"
4. Allez Settings → API
5. Copiez "Project URL" 
6. Copiez "anon public" sous "API Key"
```

### ÉTAPE 2: Créer les tables (1 minute)

Dans le dashboard Supabase:
1. Cliquez **SQL Editor** (gauche)
2. Cliquez **New Query**
3. **Copiez-collez** ce script:

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

4. Cliquez le bouton **Run** (bleu)
5. ✅ Fait!

### ÉTAPE 3: Remplir les credentials (1 minute)

Ouvrez le fichier:
```
src/environments/environment.ts
```

**Remplacez** ces deux lignes:
```typescript
url: 'https://YOUR_PROJECT.supabase.co',  // ← Votre URL
anonKey: 'your-anon-key',                     // ← Votre clé
```

**Par vos vraies valeurs** (depuis Supabase Settings → API):

Exemple:
```typescript
url: 'https://xazuivhvfg.supabase.co',
anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
```

## 🚀 Lancer l'App

Ouvrez un terminal dans le dossier `alcootest`:

```bash
npm start
```

**Attendez** 10-15 secondes, puis ouvrez votre navigateur:
```
http://localhost:4200
```

## ✅ Tester

### Test Simple (2 minutes)

1. Cliquez **"Créer une soirée"**
2. Remplissez:
   ```
   Pseudo: jean
   Nom: Apéro du soir
   Âge: 30
   Poids: 75
   Sexe: Homme
   Mangé: Non
   ```
3. Cliquez **"Créer"**
4. Vous êtes sur le Dashboard! ✅
5. Cliquez **"Ajouter un verre"**
6. Sélectionnez **"Pinte (5%)"**
7. Observez le graphique monter! 📈

## 🐛 Si ça ne marche pas

### "Erreur - impossible de créer"
**Raison**: Credentials Supabase incorrects
**Fix**: Revérifiez environment.ts (copie-colle exacte depuis Supabase)

### "Port 4200 already in use"
**Raison**: Autre Angular server en cours
**Fix**: Utilisez un autre port:
```bash
ng serve --port 4300
```

### "localhost refused to connect"
**Raison**: Serveur pas lancé
**Fix**: Attendez que `ng serve` finisse (watch mode activé)

### "Error in console"
**Raison**: Tables Supabase pas créées
**Fix**: Revérifiez étape 2 - exécutez bien le script SQL

## 📚 Documentation

Tout est documenté:
- **QUICKSTART.md** - Lancer rapidement ⭐ (commencer par ici!)
- **INSTALLATION.md** - Setup détaillé
- **SETUP.md** - Architecture & DB
- **TECHNICAL_NOTES.md** - Pour les développeurs
- **README_COMPLET.md** - Vue complète du projet

## 🎮 Exploration

### Page d'Accueil
- ✅ Créer une soirée (nouveau profil)
- ✅ Charger une soirée (pseudo existant)

### Dashboard
- ✅ Graphique temps réel
- ✅ Ajouter des verres
- ✅ Modifier poids/sexe
- ✅ Voir le statut (emoji)
- ✅ Terminer la soirée

### Verres Prédéfinis
- Pinte 5% / 500ml
- Vin rouge 13% / 150ml
- Shot 40% / 50ml
- Champagne 12% / 150ml
- Cocktail 15% / 200ml
- Verre de bière 5% / 250ml
- Vin blanc 12% / 150ml

## 💡 Conseils

### Pour dev
- `ng serve` - Lancer serveur
- `ng build` - Build production
- `F5` - Refresher (teste persistance LocalStorage)
- Console dev (F12) - Voir logs

### Pour prod
- Utiliser Vercel/Netlify pour deploy
- Remplacer credentials Supabase prod
- Ajouter authentification JWT
- Activiser HTTPS

## 🎓 Comment ça Marche?

La formule utilisée: **Widmark's Formula**

```
Taux d'alcool (g/L) = Alcool pur / (Poids × K)

Où:
- K = 0.7 (Hommes), 0.6 (Femmes)
- Alcool pur = Volume × Degré × 0.8
- Élimination = 0.15 par heure
```

Exactement comme les alcootests professionnels! 📊

## ⚠️ Important

**RAPPEL**: 
- Cette app est éducative et approximative (±10%)
- Elle ne remplace PAS un alcootest professionnel
- **NE CONDUISEZ JAMAIS EN ÉTAT D'ÉBRIÉTÉ**
- Consommez responsablement! 🍺

## 🎯 Prochaines Étapes (Optionnel)

Après avoir testé:
1. Explorez le code (bien commenté)
2. Regardez `calcul.service.ts` (formule)
3. Modifiez les couleurs (Tailwind)
4. Ajoutez des verres
5. Déployez sur Vercel!

## 📞 Support Rapide

| Problème | Solution |
|----------|----------|
| Pas de graphique | `F5` refresh |
| Verre pas ajouté | Attendre 2-3s |
| LocalStorage vide | Pas mode privé |
| Compilation error | Vérif environment.ts |
| Port occupé | `ng serve --port 4300` |

## ✨ Vous êtes Prêt!

```bash
1. npm start
2. Ouvrir http://localhost:4200
3. Créer une soirée
4. Ajouter des verres
5. Profitez! 🎉
```

**Bon amusement avec AlcooTest!** 🍻  
*(responsibly, bien sûr!)* 😉

---

**Questions?** Consultez les fichiers de documentation mentionnés plus haut.

**Besoin d'aide?** Vérifiez la section "Dépannage" dans INSTALLATION.md

**Heureux de coder!** 👨‍💻👩‍💻
