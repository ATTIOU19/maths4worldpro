

## Problème

Les graphiques actuels utilisent **Recharts** avec des blocs ` ```chart ` JSON pré-calculés par l'IA. Cela pose deux problèmes :
- L'IA ne génère pas toujours le JSON correctement (données manquantes, format cassé)
- Le rendu ressemble à un graphique de données, pas à un vrai graphique mathématique style GeoGebra (pas d'axes centrés à l'origine, pas de courbes fluides)

## Solution

Remplacer le système de rendu par **function-plot** (bibliothèque basée sur D3 spécialisée dans le tracé de fonctions mathématiques). L'IA enverra simplement les expressions mathématiques au lieu de pré-calculer des points.

### Nouveau format pour l'IA

Au lieu du bloc ` ```chart ` avec des tableaux de données, l'IA utilisera un bloc ` ```graph ` avec des expressions :

```json
{
  "title": "f(x) = sin(x)",
  "functions": ["sin(x)", "cos(x)"],
  "xDomain": [-6.28, 6.28],
  "yDomain": [-1.5, 1.5]
}
```

### Fichiers modifiés

1. **`src/components/chat/ChartRenderer.tsx`** — Refactorer complètement :
   - Ajouter le parsing des blocs ` ```graph ` (en plus des ` ```chart ` existants pour rétrocompatibilité)
   - Créer un composant `FunctionPlotBlock` qui utilise **function-plot** pour tracer les courbes avec axes centrés, grille, style GeoGebra
   - Garder `ChartBlock` pour les histogrammes/barres si nécessaire

2. **`src/components/chat/MessageBubble.tsx`** — Mettre à jour pour rendre les blocs ` ```graph `

3. **`supabase/functions/math-chat/index.ts`** — Mettre à jour le prompt système pour utiliser le nouveau format ` ```graph ` avec des expressions mathématiques

4. **`supabase/functions/visualize/index.ts`** — Même mise à jour du prompt pour le menu Visualisation

5. **`package.json`** — Ajouter la dépendance `function-plot`

### Rendu style GeoGebra
- Axes x et y centrés à l'origine (0,0)
- Grille en arrière-plan
- Courbes colorées et fluides
- Étiquettes des fonctions
- Zoom/pan si supporté par function-plot

### Section technique

- **function-plot** est une lib légère qui prend des expressions comme `"x^2"`, `"sin(x)"`, `"exp(x)"` et les trace directement. Pas besoin de pré-calculer les points.
- Le parsing sera mis à jour pour détecter ` ```graph ` en plus de ` ```chart `
- Les prompts IA seront simplifiés : l'IA n'a plus qu'à fournir l'expression de la fonction, pas des tableaux de 20+ points

