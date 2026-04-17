

L'utilisateur veut rendre la plateforme plus dynamique et engageante, avec des symboles mathématiques en arrière-plan visibles partout, pour donner envie d'apprendre dès l'arrivée.

Note : la page d'accueil a déjà des symboles mathématiques flottants dans le hero (∑, ∫, π, √, ∞, Δ, ∂, λ, θ, φ) mais ils sont très transparents (opacité 0.05) et limités au hero. Je vais amplifier l'effet et le propager.

## Plan : Plateforme dynamique et engageante

### 1. Symboles mathématiques en arrière-plan (composant réutilisable)

Créer `src/components/MathSymbolsBackground.tsx` :
- Composant de fond avec ~15-20 symboles flottants animés (∑, ∫, π, √, ∞, Δ, ∂, λ, θ, φ, ≈, ≠, ∇, ∈, ⊂, %, ÷, ×, ²)
- Tailles variées (24px à 72px), positions aléatoires, animations désynchronisées
- Opacité augmentée (0.08 à 0.12 selon le fond) pour être visible sans gêner la lecture
- Variante claire (sur fond blanc) et variante foncée (sur fond bleu hero)
- `pointer-events: none` pour ne pas bloquer les clics

L'utiliser sur : Accueil (toutes sections), Chat IA, Tuteur IA, Visualisation, Maths Métier, À propos, Connexion, Inscription.

### 2. Hero d'accueil plus vivant

Dans `src/pages/Index.tsx` :
- Ajouter un badge animé au-dessus du titre : « 🚀 Nouvelle génération de tuteur IA » avec pulse léger
- Animation typewriter sur un mot-clé du titre (ex : « mathématiques » qui se réécrit)
- Boutons CTA avec effet de brillance (shine) au hover
- Ajouter une équation animée flottante près du titre (ex : `f'(x) = 3x² - 2` qui apparaît progressivement)

### 3. Animations au scroll renforcées

- Cartes Features : ajouter un effet de tilt léger au hover (rotation 3D subtile)
- Section « Comment ça marche » : ligne animée qui se trace entre les étapes au scroll
- Compteurs Stats : déjà animés, ajouter un glow subtil pendant le comptage

### 4. Nouvelle section « Aperçu en direct » sur l'accueil

Avant la section Stats, ajouter une section démo visuelle :
- Mini-carte qui simule une conversation avec Amara (3-4 bulles statiques mais stylées)
- À côté, un mini-graphique `function-plot` d'une parabole `x²` pour illustrer la visualisation auto
- CTA : « Essayer maintenant »

### 5. Micro-interactions globales

- Curseur personnalisé subtil sur les boutons CTA (effet magnetic léger via Framer Motion)
- Transitions de page avec fade-in via `AnimatePresence` dans `App.tsx`

### Fichiers modifiés / créés

- **Créé** : `src/components/MathSymbolsBackground.tsx`
- **Modifié** : `src/pages/Index.tsx` (badge, hero enrichi, section démo, fond)
- **Modifié** : `src/pages/ChatIA.tsx`, `src/pages/TuteurIA.tsx`, `src/pages/Visualisation.tsx`, `src/pages/MathsMetier.tsx`, `src/pages/APropos.tsx`, `src/pages/Connexion.tsx`, `src/pages/Inscription.tsx` (ajout du fond)
- **Modifié** : `src/index.css` (nouvelle keyframe shine + variantes d'opacité pour symboles)
- **Modifié** : `src/App.tsx` (transitions de page)

### Résultat attendu

Sensation immédiate « plateforme vivante et premium » : symboles maths qui flottent doucement partout en fond, hero qui respire avec équation animée, démo visible sans scroller loin, micro-interactions partout = envie immédiate de cliquer et d'apprendre.

