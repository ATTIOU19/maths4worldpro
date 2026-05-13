## Objectif
Permettre au modèle de tracer **toute la géométrie** : figures 2D (carré, cercle, losange, parallélogramme, trapèze, hexagone, triangles spéciaux, ellipse, parabole…) **et** figures 3D (cube, sphère, cylindre, cône, pyramide, tétraèdre, prisme, plans, droites de l'espace).

## État actuel
- `supabase/functions/visualize/index.ts` : prompt système limité à quelques exemples 2D (carré, triangle équilatéral, x²).
- `src/components/chat/GeoGebraBlock.tsx` : applet figé sur `appName: "graphing"` (2D uniquement) avec `perspective: "G"`.

## Plan

### 1. Enrichir le prompt système (`supabase/functions/visualize/index.ts`)
Ajouter une **bibliothèque d'exemples** couvrant :
- **Quadrilatères** : carré, rectangle, losange (via diagonales perpendiculaires), parallélogramme, trapèze
- **Triangles** : équilatéral, isocèle, rectangle, quelconque, avec hauteurs/médianes/bissectrices si demandé
- **Polygones réguliers** : `Polygon(centre, sommet, n)` pour pentagone, hexagone, octogone
- **Cercles & coniques** : cercle, ellipse, parabole, hyperbole, arcs, secteurs, tangentes
- **Constructions** : médiatrice, bissectrice, perpendiculaire, parallèle, intersection, milieu
- **Transformations** : rotation, symétrie, translation, homothétie
- **3D** (nouveau) : cube, sphère, cylindre, cône, pyramide, tétraèdre, prisme, plan, droite de l'espace

Ajouter un **champ `dim`** dans le JSON renvoyé : `"dim": "2d"` ou `"dim": "3d"`. Le modèle doit choisir selon la demande.

### 2. Étendre le format de sortie
```json
{
  "type": "geogebra",
  "dim": "3d",
  "title": "Cube ABCDEFGH",
  "code": "Cube((0,0,0),(2,0,0),(0,2,0))"
}
```
- Rétrocompat : si `dim` absent → `"2d"`.

### 3. Adapter `GeoGebraBlock.tsx`
- Le type `GeoGebraData` reçoit un champ optionnel `dim?: "2d" | "3d"`.
- Si `dim === "3d"` → `appName: "3d"` et `perspective: "T"` (vue 3D), pas de `setCoordSystem` 2D, sauter le calcul de cadrage points (laisser GeoGebra gérer).
- Sinon comportement 2D actuel inchangé.
- Le panneau algèbre reste masqué dans les deux cas.

### 4. Propager `dim` côté parsing
- `src/components/chat/ChartRenderer.tsx` (parser des blocs `geogebra`) : inclure `dim` dans l'objet retourné.
- `MessageBubble.tsx` : déjà transmet `part.geogebra` → rien à changer si on enrichit juste le type.

## Hors scope
- Pas de changement UI (taille, style — déjà OK).
- Pas de nouvel endpoint, pas de migration DB.
- Pas de touche aux pages ChatIA / TuteurIA (le composant partagé bénéficie des améliorations automatiquement).

## Risques & mitigations
- Certaines commandes 3D échouent silencieusement → on garde le `try/catch` par commande déjà présent.
- Le modèle peut hésiter entre 2D/3D : le prompt explicitera **"si l'utilisateur mentionne 'espace', 'volume', '3D', cube, sphère, pyramide, plan ⇒ dim=3d ; sinon dim=2d"**.