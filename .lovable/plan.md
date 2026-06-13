## Objectif

1. Sur la page **Tuteur IA**, afficher les figures (GeoGebra / graphes) **dans le Tableau d'apprentissage à droite** sur desktop, et **juste sous le chat** sur mobile, au lieu de les rendre à l'intérieur des bulles.
2. Réduire le temps d'apparition des visuels générés par Amara (les applets GeoGebra mettent plusieurs secondes avant de s'afficher).

Changements limités à la présentation (front-end). Aucune modification de la base, de l'auth ou du prompt IA.

---

## 1. Déplacement des figures vers le Tableau

### `src/components/chat/MessageBubble.tsx`
- Ajouter un prop optionnel `hideVisuals?: boolean`.
- Quand `hideVisuals` est vrai, ne pas rendre les blocs `geogebra` / `graph` / `chart` dans la bulle : on ne garde que le texte markdown (`before` + `after` fusionnés).

### `src/pages/TuteurIA.tsx`
- Calculer en `useMemo` la **dernière figure** (geogebra > graph > chart) trouvée dans l'ensemble des messages de l'assistant via `parseChartBlocks`.
- Passer `hideVisuals` aux `MessageBubble` rendus dans la colonne de gauche.
- **Colonne droite (desktop, ≥lg)** : remplacer le placeholder actuel par :
  - si une figure existe → l'afficher en grand (réutilisation de `GeoGebraBlock` / `FunctionPlotBlock` / `ChartBlock`) avec un titre "Figure courante".
  - sinon → garder le visuel d'attente actuel ("Les figures apparaîtront ici…").
- **Vue mobile (lg:hidden)** : ajouter, juste sous la zone de chat, une section "📊 Tableau" qui rend la même figure quand elle existe. Aucun changement de logique conversationnelle.

Le composant `GeoGebraBlock` reste utilisé tel quel ; il s'adapte déjà à la largeur du conteneur via `ResizeObserver`.

---

## 2. Accélération du chargement des figures

### `index.html`
- Ajouter dans `<head>` :
  ```html
  <link rel="preconnect" href="https://www.geogebra.org" crossorigin>
  <link rel="dns-prefetch" href="https://www.geogebra.org">
  ```
- Charger `deployggb.js` avec `defer` (au lieu du chargement bloquant actuel) pour ne plus retarder le premier rendu.

### `src/components/chat/GeoGebraBlock.tsx`
- Si `window.GGBApplet` n'est pas encore disponible (script `defer` pas terminé), **attendre son apparition** via un petit polling (`setInterval` 50 ms, max 5 s) puis lancer l'injection — sinon le composant restait silencieux quand l'applet n'était pas chargé à temps.
- Pendant l'initialisation de l'applet, afficher un **skeleton animé** (rectangle pulsant aux dimensions de la figure) à la place du fond blanc vide, pour que l'utilisateur voie immédiatement qu'une figure arrive.
- **Lazy-init via `IntersectionObserver`** : ne lancer `applet.inject(...)` que lorsque le conteneur entre dans le viewport (utile sur mobile où plusieurs figures peuvent exister, et pour ne pas saturer le CPU dès le premier message).

---

## Détails techniques

- `MessageBubble` continue de gérer la coupe `before / chart|graph|geogebra / after`; quand `hideVisuals` est actif on concatène simplement `before + "\n\n" + after` pour le rendu markdown.
- La sélection de "la dernière figure" se fait côté `TuteurIA.tsx` (pas dans la bulle) pour qu'il n'y ait qu'**un seul applet GeoGebra monté à la fois** dans le Tableau → bien plus fluide que plusieurs applets dans l'historique.
- Le polling `GGBApplet` n'introduit aucune dépendance : il vérifie `typeof window.GGBApplet === "function"`.
- Aucun changement de schéma DB, aucun edge function, aucune modification du prompt système Amara.

---

## Fichiers modifiés

- `index.html` — preconnect + `defer` sur `deployggb.js`
- `src/components/chat/MessageBubble.tsx` — option `hideVisuals`
- `src/components/chat/GeoGebraBlock.tsx` — attente de `GGBApplet`, skeleton, lazy-init
- `src/pages/TuteurIA.tsx` — extraction de la dernière figure, rendu dans le Tableau (desktop + mobile), `hideVisuals` activé sur les bulles
