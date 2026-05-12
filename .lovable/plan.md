## Objectif
Rendre le graphe GeoGebra de la page **Visualisation** plus grand, plus lisible et plus élégant.

## Constats (capture actuelle)
- Le graphe occupe ~40% de la largeur de la bulle, le reste est vide.
- La bulle assistant est limitée à `max-w-[70%]` → bride la figure.
- Hauteur 480px mais le canvas réel est rétréci par le panneau algèbre latéral (f(x)=…, A=(0,1)) qui consomme la moitié horizontale.
- Boutons zoom empilés au milieu, fond gris fade, peu de contraste.

## Plan de modifications

### 1. `src/components/chat/MessageBubble.tsx`
Quand le message contient un bloc `geogebra`, élargir la bulle :
- Passer `max-w-[70%]` → `max-w-[95%]` (ou pleine largeur) uniquement pour les messages contenant un graphe.
- Garder le style actuel pour les messages texte.

### 2. `src/components/chat/GeoGebraBlock.tsx`
Reconfigurer l'applet pour un rendu "premium" :
- `appName: "graphing"` (déjà OK)
- **Masquer le panneau algèbre latéral** : `showAlgebraInput: false` + `perspective: "G"` (vue graphique seule) → libère toute la largeur pour la figure.
- **Hauteur responsive** : 520px desktop, 380px mobile (calcul via `clientWidth`).
- **Largeur 100%** du conteneur élargi.
- **Désactiver les boutons zoom flottants** (`showZoomButtons: false`) — déplacement/zoom restent dispo via molette/pinch.
- `showToolBarHelp: false`, `showFullscreenButton: true` (élégant, en coin).
- Couleurs : `borderColor: "transparent"`, axes/grille en HSL semantic via post-init :
  - axes plus épais et couleur foreground
  - grille discrète (couleur muted)
  - courbe : couleur primary du design system (épaisseur 5)
- Padding intérieur du wrapper réduit, ombre douce + bordure semantic, fond `card`.
- Re-render sur resize fenêtre (ResizeObserver) pour rester net.

### 3. `src/index.css`
- S'assurer que `.ggb-container iframe` prend `width: 100% !important`.
- Forcer fond transparent sur les éléments internes GeoGebra restants.
- Petites règles pour adoucir les coins du canvas (`border-radius: 12px`).

## Détails techniques
- Couleur courbe via `api.setColor("f", r, g, b)` après `evalCommand`.
- Épaisseur via `api.setLineThickness("f", 5)`.
- Grille/axes via `api.setGridVisible(true)` + `setAxesColor` (si dispo) sinon style CSS sur SVG interne.
- Pas de changement côté edge function `visualize` — le format de réponse reste identique.

## Hors scope
- Pas de modification du prompt système ni du modèle IA.
- Pas de changement sur ChatIA/TuteurIA (uniquement page Visualisation, mais comme le composant est partagé, le rendu y sera amélioré aussi — comportement souhaité, à confirmer si non).