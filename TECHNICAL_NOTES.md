# 📋 Notes Techniques - AlcooTest

## Architecture & Design Decisions

### Choix Technologiques

#### 1. **Angular 21 Standalone Components**
- ✅ Plus moderne que NgModules
- ✅ Meilleure tree-shaking
- ✅ Plus facile à tester
- ✅ Composition plutôt qu'héritage

Utilisation:
```typescript
@Component({
  selector: 'app-home',
  standalone: true,  // Crucial!
  imports: [CommonModule, FormsModule],
  template: `...`,
})
```

#### 2. **Angular Signals pour State Management**
- Remplacement des Observables simples
- Réactivité automatique (pas besoin de | async)
- Performance optimisée (fine-grained reactivity)
- Immutabilité encouragée via `set()` et `update()`

```typescript
// Bon
currentTaux = signal('0.00');

// À l'utilisation
currentTaux.set('0.42');
```

#### 3. **Injection de Dépendances avec `inject()`**
- Plus moderne que constructor injection
- Meilleure TypeScript inference
- Compatible avec les signaux

```typescript
// Moderne
private router = inject(Router);

// Au lieu de
constructor(private router: Router) {}
```

#### 4. **Supabase au lieu de Firebase**
- PostgreSQL backend (meilleure intégrité données)
- RLS (Row Level Security) intégré
- Subscriptions temps réel
- Plus transparent et contrôlable

### Patterns Utilisés

#### 1. **Smart & Dumb Components**
- **HomeComponent**: Smart (logique métier, formulaires)
- **DashboardComponent**: Semi-smart (affichage + interactions)

#### 2. **Service Segregation**
```
SupabaseService  → Communication API
CalculService    → Logique métier (formule Widmark)
StorageService   → Persistance locale
```

Chaque service a une responsabilité unique (Single Responsibility Principle).

#### 3. **Reactive Forms**
**Utilisé**: `FormsModule` avec ngModel pour simplicité
```typescript
[(ngModel)]="userProfile.poids"
(change)="onProfileChange()"
```

**Alternative future**: Reactive Forms avec `FormBuilder` pour plus de contrôle.

#### 4. **Change Detection Strategy: OnPush**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

Améliore les performances en limitant la détection de changements.

### Structure de Données

#### Signaux vs Propriétés Ordinaires
| Type | Usage | Raison |
|------|-------|--------|
| `signal()` | `currentTaux`, `emoji` | Données affichées, reactives |
| Propriété ordinaire | `userProfile`, `drinks` | Données complexes, formulaires |

**Raison**: NgModel fonctionne mieux avec des propriétés ordinaires.

#### Immutabilité
```typescript
// Mauvais
this.userProfile.poids = 80;

// Bon (avec signal)
this.userProfile.update(p => ({ ...p, poids: 80 }));
```

## Performance & Optimisations

### 1. **Graphique Chart.js**
- Manuel (pas de directive) pour contrôle total
- Destruction avant re-création pour éviter fuites mémoire
- Lime style gradient arc-en-ciel

```typescript
this.chart?.destroy();  // Important!
this.chart = new Chart(canvas, config);
```

### 2. **Mise à Jour Graphique**
- Intervalle 5 secondes: `interval(5000)`
- Calcul différentiel (temps depuis premier verre)
- LocalStorage pour restauration après F5

### 3. **Lazy Loading Routes**
**Futur**: Les routes peuvent être lazy-loaded
```typescript
{ path: 'dashboard', loadComponent: () => import(...).then(m => m.DashboardComponent) }
```

### 4. **Bundle Size**
- Tailwind avec purge CSS: ~24KB
- Chart.js: ~40KB
- Supabase JS: ~80KB
- **Total initial**: ~2.4MB (production: ~600KB gzipped)

## Formule Mathématique: Implémentation

### Calcul Alkoolémie (`calcul.service.ts`)

```typescript
// K coefficient par sexe
K = sexe === 'H' ? 0.7 : 0.6

// Alcool pur en grammes
pure_alcohol_g = volume_ml * (degree / 100) * 0.8

// Taux initial (pic d'absorption)
peak_taux = pure_alcohol_g / (weight_kg * K)

// Après absorption + élimination
hours_elapsed = time - time_start
elimination = Math.max(0, hours_elapsed - 1) * 0.15
final_taux = Math.max(0, peak_taux - elimination)
```

### Complexité Algorithmique
- **addDrink()**: O(1)
- **calculateAlcoholLevel()**: O(n) où n = nombre de verres
- **generateGraphData()**: O(n*m) où n=verres, m=points graphique (720)

**Optimisation possible**: Utiliser des événements RxJS au lieu de polling.

## Tests à Implémenter

```typescript
// CalculService.spec.ts
describe('CalculService', () => {
  it('devrait calculer correctement avec formule Widmark', () => {
    // Test avec données connues
  });
  
  it('devrait gérer l\'élimination d\'alcool', () => {
    // Test après 1h, 2h, 3h
  });
});

// SupabaseService.spec.ts
describe('SupabaseService', () => {
  it('devrait créer un profil', fakeAsync(() => {
    // Mock Supabase
  }));
});
```

## Sécurité

### RLS (Row Level Security)
```sql
-- Active par défaut dans notre config
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies permissives (développement)
CREATE POLICY "Any read" ON profiles FOR SELECT USING (true);
```

**Production**: Utiliser des policies strictes avec JWT authentication.

### XSS Protection
- Angular fait de l'HTML escaping automatiquement
- `{{ }}` est safe, contrairement à innerHTML

### CSRF
- Supabase gère automatiquement avec CORS approprié

## Déploiement

### Build Production
```bash
ng build --configuration production
# → dist/alcootest/

# Ou avec compression
ng build --configuration production --stats-json
```

### Hosting Options
1. **Vercel** (recommandé pour SSR)
2. **Netlify** (simple, gratuit)
3. **Firebase Hosting**
4. **AWS S3 + CloudFront**

### Environment Configuration
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  supabase: {
    url: 'YOUR_PROD_URL',
    anonKey: 'YOUR_PROD_ANON_KEY',  // Ne pas exposer!
  },
};
```

**⚠️ Jamais committer de credentials en production!**

## Debugging

### Console
```typescript
console.log('Taux actuel:', currentTaux.set('0.42'));
```

### Angular DevTools
```bash
npm install --save-dev @angular/devtools
```

### Network Tab
- Vérifier appels Supabase
- Vérifier authentification headers

### LocalStorage
```javascript
// Console navigateur
localStorage.getItem('alcootest_current_soiree')
localStorage.clear()
```

## Git & Versionning

### .gitignore
```
dist/
node_modules/
.angular/
*.log
environment.prod.ts  // Ne pas committer les credentials!
```

### Commits
```
feat: Ajouter graphique arc-en-ciel
fix: Corriger calcul élimination alcool
chore: Update dependencies
docs: Documenter formule Widmark
```

## Améliorations Futures

### Court terme (Priority 1)
- [ ] Unit tests (Jasmine/Jest)
- [ ] E2E tests (Cypress/Playwright)
- [ ] Authentification utilisateur
- [ ] Validation formulaire côté serveur

### Moyen terme (Priority 2)
- [ ] Statistiques historiques de soirée
- [ ] Export graphique (PNG)
- [ ] Partage de soirée (liens)
- [ ] Dark mode
- [ ] PWA (installable)

### Long terme (Priority 3)
- [ ] API backend custom (Node.js)
- [ ] Machine learning (prédictions)
- [ ] Intégration GPS (itinéraires sûrs)
- [ ] Système de ratings/reviews

## Dépannage Courant

### BUG: Graphique vide après add verre
**Cause**: `updateChart()` pas appelé
**Solution**: Vérifier que `onProfileChange()` appelle `updateChart()`

### BUG: LocalStorage pas persisté
**Cause**: Mode privé du navigateur
**Solution**: Utiliser navigateur normal ou localStorage polyfill

### BUG: "localStorage is not defined"
**Cause**: Prerendering SSR
**Solution**: Normal, ne pas générer routes statiques avec localStorage

### PERF: Graphique lag
**Cause**: Trop de points de données
**Solution**: Réduire granularité (10 min au lieu de 5 min)

## Ressources

### Documentation
- [Angular Best Practices](https://angular.dev)
- [Widmark Formula](https://en.wikipedia.org/wiki/Blood_alcohol_content)
- [Supabase Docs](https://supabase.com/docs)
- [Chart.js Guide](https://www.chartjs.org/)

### Tools
- `ng serve` - Développement
- `ng build` - Production
- `ng test` - Tests
- `ng lint` - Code quality

### VS Code Extensions
- Angular Language Service
- Prettier
- ES7+ React/Redux/React-Native snippets

---

**Last Updated**: 21/03/2026
**Maintainer**: [Votre nom]
**License**: MIT
