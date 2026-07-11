## Objectif

Garantir que chaque visualisation (courbe `function-plot`, graphique `recharts`, figure `GeoGebra`) s'affiche **en entier**, s'adapte à la taille de l'écran, et propose un **bouton zoom plein écran** dans Chat IA, Tuteur IA et Visualisation IA.

## Changements

### 1. `src/components/chat/ChartRenderer.tsx` — `FunctionPlotBlock`
- Remplacer la hauteur fixe `340px` par une hauteur responsive :
  - mobile : `min(60vh, 360px)`
  - desktop : `min(70vh, 520px)`
- Recalculer le tracé au `resize` de la fenêtre (listener + `ResizeObserver`) pour que la courbe reste entièrement visible quand on change de taille d'écran.
- Auto-ajuster `xDomain`/`yDomain` au conteneur (préserver le ratio) si non fournis.
- Ajouter un **bouton "Agrandir" (icône `Maximize2`)** en haut à droite du cadre qui ouvre un `Dialog` shadcn plein écran contenant un second rendu du graphique à `90vw × 80vh`, avec un bouton "Fermer".

### 2. `src/components/chat/ChartRenderer.tsx` — `ChartBlock` (recharts)
- Hauteur responsive : `min(60vh, 420px)` au lieu de `260px` fixe (le `ResponsiveContainer` gère déjà la largeur).
- Même bouton **"Agrandir"** ouvrant un Dialog plein écran (`90vw × 80vh`).

### 3. `src/components/chat/GeoGebraBlock.tsx`
- Conteneur responsive : hauteur basée sur `min(70vh, 560px)` avec recalcul au resize.
- Après création des objets, appeler `api.setCoordSystem(...)` / `api.evalCommand("ZoomFit")` pour cadrer automatiquement la figure entière.
- Ajouter le **bouton "Agrandir"** : ouvre un Dialog plein écran qui remonte une nouvelle instance GeoGebra dimensionnée à la fenêtre, avec rejeu du même `code`.

### 4. Bulle de message — `src/components/chat/MessageBubble.tsx`
- Quand `hasVisual`, élargir à `max-w-full` sur mobile pour laisser le graphique respirer (au lieu de `max-w-[98%]`).
- Aucune autre modification de logique.

### 5. Pages — aucune modification fonctionnelle
- Les pages `ChatIA.tsx`, `TuteurIA.tsx`, `Visualisation.tsx` consomment toutes `MessageBubble`/`ChartRenderer`/`GeoGebraBlock` ; les améliorations s'y propagent automatiquement.

## Détails techniques

- Composant zoom partagé `ZoomableFigure` (wrapper avec bouton `Maximize2` + `Dialog`) placé dans `src/components/chat/ZoomableFigure.tsx` pour éviter la duplication entre les 3 blocs.
- Le Dialog réutilise `@/components/ui/dialog` (déjà présent) en mode `max-w-[95vw] h-[90vh]`.
- Pour `function-plot` et GeoGebra, le rendu dans le Dialog se fait dans un `useEffect` déclenché à l'ouverture, sur un `ref` séparé.
- Aucune dépendance nouvelle.
