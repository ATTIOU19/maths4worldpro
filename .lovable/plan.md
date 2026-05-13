## Problème
Sur la capture, le cercle n'est pas visible : seuls les points O=(0,0) et A=(3,0) apparaissent, et la fenêtre est cadrée uniquement sur leur boîte englobante (~ x∈[-0.9, 3.9], y∈[-0.9, 0.9]). Le cercle de rayon 3 sort largement de cette fenêtre.

**Cause** dans `GeoGebraBlock.tsx` : le cadrage automatique ne prend en compte que les points, pas l'extension réelle des coniques, polygones, segments ou fonctions construits.

## Plan

### Corriger le cadrage 2D dans `src/components/chat/GeoGebraBlock.tsx`

Remplacer la logique « bounding box des points uniquement » par une **bounding box réelle de tous les objets visibles** :

1. Parcourir tous les objets via `getAllObjectNames()`.
2. Pour chaque type, étendre `[xs, ys]` :
   - **point** : `(getXcoord, getYcoord)` (déjà fait).
   - **segment / line / vector** : ajouter les deux extrémités via `getValueString` ou les points de définition (`getCommandString` parsing) — fallback : utiliser `getXcoord`/`getYcoord` sur les points associés déjà collectés.
   - **conic / circle** : récupérer centre + rayon via `getValue("Center(c)")`/`getValue("Radius(c)")` en utilisant `evalCommandGetLabels` sur des commandes auxiliaires, OU plus simple et robuste : `evalCommand("__bb=Corner(1)")` n'est pas dispo en 2D… À la place, utiliser **`api.getValueString(name)`** + parsing de l'équation `(x-a)² + (y-b)² = r²`, et étendre `[a-r, a+r] × [b-r, b+r]`. Pour les ellipses/paraboles, parser n'est pas fiable → fallback : élargir la fenêtre à `±10` si une conique non-cercle est présente.
   - **polygon** : itérer sur les sommets via `getCommandString` (les sommets sont déjà des points donc déjà couverts).
3. Si une **fonction** est présente, garder `[-10,10] × [-6,6]`.
4. Appliquer un padding de 20 % (au lieu de 30 %), avec un minimum de 1 unité sur chaque axe.
5. Garantir un **ratio raisonnable** : si la hauteur de la fenêtre est < 30 % de la largeur (ou inversement), élargir l'axe le plus court pour éviter une bande aplatie.

### Hors scope
- Pas de changement du prompt ni des autres composants.
- Pas de modification du rendu 3D (l'auto-cadrage GeoGebra suffit).

### Risque
`getValueString` pour un cercle GeoGebra renvoie typiquement `"x² + y² = 9"` ou `"(x - a)² + (y - b)² = r²"`. Le parsing par regex couvre les deux cas ; en cas d'échec on retombe sur `±10`.