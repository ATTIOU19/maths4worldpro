# Plan — GeoGebra 2D/3D dans tous les chats

## Constat

- `GeoGebraBlock` (utilisé dans Visualisation) gère déjà 2D et 3D avec le même rendu soigné (cadre blanc, palette terracotta/sauge, points bleus, légende).
- `MessageBubble` (Chat IA + Notion d'apprentissage) **affiche déjà** les blocs ` ```geogebra ` via `parseChartBlocks` + `<GeoGebraBlock />`. Le rendu visuel est donc déjà identique à la page Visualisation.
- Ce qui manque côté **Chat IA** et **Notion** : le prompt système ne décrit que des primitives 2D. Le modèle n'a aucune raison d'émettre un bloc avec `"dim":"3d"` ni d'utiliser `Cube`, `Sphere`, `Cylinder`, `Cone`, `Pyramid`, `Plane`, `Surface`, etc. Résultat : pour une question 3D, soit pas de figure, soit une figure 2D approximative.
- **Visualisation** : déjà parfait, rien à changer.
- **Tuteur IA** (`src/pages/TuteurIA.tsx`) : c'est une **démo scriptée** (messages codés en dur, pas d'appel IA). Ajouter un bloc GeoGebra revient simplement à inclure un bloc ` ```geogebra ` dans un message scénarisé et basculer son rendu sur `MessageBubble`.
- **Entretien vocal** (`src/pages/EntretienSession.tsx`) : c'est une session **100% audio (TTS)**. Le system prompt interdit explicitement LaTeX/symboles/formats lisibles à l'œil. Ajouter des figures GeoGebra dans ce flux casse la cohérence vocale. À traiter à part (voir Q).

## Changements

### 1) `supabase/functions/math-chat/index.ts` (Chat IA)

Enrichir le bloc « GRAPHIQUES ET VISUALISATIONS » pour aligner Chat IA sur la fonction `visualize` :

- Ajouter le champ `"dim"` (`"2d"` par défaut, `"3d"` obligatoire dès qu'on parle de solide, d'espace, de volume, ou de : cube, pavé, sphère, cylindre, cône, pyramide, tétraèdre, prisme, octaèdre, surface `z=f(x,y)`, plan de l'espace, droite de l'espace).
- Compléter la syntaxe avec les commandes 3D : `Cube(A,B,C)`, `Tetrahedron`, `Octahedron`, `Pyramid`, `Prism`, `Sphere(centre,r)`, `Cylinder(A,B,r)`, `Cone(A,B,r)`, `Plane(A,B,C)`, `Surface(...)`, `f(x,y)=...`.
- Compléter la syntaxe 2D usuelle (Segment, Vector, Polygon régulier `Polygon(A,B,n)`, Ellipse/Parabola/Hyperbola, Midpoint, PerpendicularBisector, AngleBisector, Tangent, Intersect, Rotate/Reflect/Translate/Dilate).
- Ajouter 4–5 exemples ciblés (cube, sphère, cylindre, cône, pyramide à base carrée) au même format que `visualize`.
- Conserver la règle « points manipulables » et le reste du prompt pédagogique (étapes, exemple africain, astuce, signature finale).

### 2) `src/pages/NotionApprentissage.tsx` (Maths Métier → notion)

Renforcer l'étape 5 du prompt initial : préciser explicitement « **bloc ` ```geogebra ` au format JSON `{type,dim,title,code}`, `dim:"3d"` pour tout solide/espace** ». Aucune autre logique à toucher (le rendu passe déjà par `MessageBubble`).

### 3) `src/pages/TuteurIA.tsx` (démo scriptée)

- Faire passer le rendu par `MessageBubble` (au lieu du `<p>{msg.text}</p>` actuel) afin que la démo puisse afficher un mini bloc GeoGebra.
- Ajouter dans le script de démo un message Amara contenant un petit bloc ` ```geogebra ` (ex. un cône ou une sphère) pour illustrer visuellement la capacité 3D. Aucun appel IA n'est ajouté, la démo reste scriptée.

### 4) Entretien vocal — à confirmer (voir question)

Par défaut **ne rien changer** : le flux est vocal, l'écran sert au transcript et la consigne TTS interdit les formats visuels. Si l'utilisateur veut quand même afficher des figures pendant l'entretien, on peut autoriser le modèle à émettre un bloc ` ```geogebra ` après sa réponse parlée et l'afficher sous le transcript via `MessageBubble`, sans le lire au TTS.

## Hors-scope

- Pas de refonte du composant `GeoGebraBlock` (le style « image fournie » est déjà en place).
- Pas de changement du pipeline `visualize` ni du parseur `parseChartBlocks`.
- Pas de nouvelles dépendances.

## Question

Pour l'**Entretien vocal**, tu préfères :
- (A) **Ne rien changer** (recommandé — le format est strictement audio) ?
- (B) Autoriser Amara à afficher des figures GeoGebra sous le transcript, sans les vocaliser ?
