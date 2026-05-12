## Problème observé
La capture montre un canvas presque entièrement blanc : la courbe n'est pas visible et le quadrillage n'apparaît qu'à l'extrême droite. Causes probables :
1. `ZoomFit()` ne cadre pas correctement les fonctions (GeoGebra ne connaît pas leurs bornes naturelles) → la courbe est tracée hors champ.
2. `setColor` / `setLineThickness` peuvent échouer silencieusement selon le type d'objet (fonction vs polygone).
3. La grille par défaut est trop pâle, sans distinction majeur/mineur.

## Plan de corrections (`src/components/chat/GeoGebraBlock.tsx` uniquement)

### 1. Cadrage fiable
- Toujours appeler `api.setCoordSystem(-10, 10, -6, 6)` **par défaut** (au lieu de seulement en fallback).
- Pour chaque objet de type `point`, élargir la fenêtre pour l'inclure (calcul min/max sur `getXcoord`/`getYcoord` + marge).
- Pour les fonctions, garder la fenêtre par défaut [-10,10]×[-6,6] (ou symétrique adaptée).
- Supprimer l'appel `ZoomFit()` qui échoue sur les fonctions.

### 2. Grille élégante (style "cahier de maths")
- `api.setGridVisible(true)` + `api.setAxesVisible(true, true)`
- Grille cartésienne avec lignes majeures/mineures :
  - `api.evalCommand("SetActiveView(1)")`
  - Forcer `gridType = 1` (cartésien) et `gridDistance = {1,1}` via JS API si dispo.
- Couleur grille douce (HSL ~ 210 20% 88%), axes sombres (foreground), épaisseur axes 2.

### 3. Courbe & objets bien visibles
- Pour les fonctions : `api.setColor(name, 26, 60, 110)` (primary) + `api.setLineThickness(name, 8)` + `api.setLineStyle(name, 0)` (plein).
- Pour les polygones : remplissage primary à 25% via `api.setFilling(name, 0.25)`.
- Points : couleur secondary (#2A8BCB), taille 7, label visible.
- Try/catch individuels (déjà en place) — on garde.

### 4. Fond & rendu
- `containerRef` fond blanc explicite (#FFFFFF) pour contraste max sur la courbe bleue.
- Réduire un peu la hauteur sur viewport étroit pour éviter le scroll vertical de la bulle.

## Hors scope
- Pas de changement du prompt edge function ni de `MessageBubble`.
- Pas de changement sur d'autres pages.