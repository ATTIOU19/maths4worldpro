## Objectif
Corriger durablement le tableau GeoGebra pour que les figures demandées soient réellement reliées et visibles : triangle, carré, parallélogramme, losange, polygone régulier, fractale, patron de cône de révolution et patron de pavé droit.

## Plan d’implémentation
1. **Renforcer le moteur GeoGebra côté interface**
   - Normaliser les commandes générées par l’IA avant exécution.
   - Mieux gérer les syntaxes GeoGebra qui échouent selon les versions : `Segment(A,B)`, `Polygon(A,B,C)`, `Polygon(A,B,n)`, commandes avec affectation, etc.
   - Ajouter une exécution de secours qui crée explicitement les côtés quand un polygone ne se trace pas.

2. **Créer des fallbacks géométriques fiables**
   - Si GeoGebra ne relie que les points, créer automatiquement les segments entre sommets consécutifs et fermer la figure.
   - Pour les polygones réguliers avec deux points et un nombre `n`, calculer les sommets manquants en JavaScript, puis tracer les segments.
   - Pour carré, triangle, losange et parallélogramme, utiliser des constructions explicites quand la commande GeoGebra échoue.

3. **Ajouter des patrons 2D prédéfinis fiables**
   - Patron de cône : cercle de base + secteur circulaire déplié + rayon/génératrice annotés.
   - Patron de pavé droit : 6 rectangles reliés en croix avec segments visibles.
   - Ces patrons resteront en `dim: "2d"`, même si le solide lui-même est 3D, car un patron est un dépliage plan.

4. **Améliorer le prompt d’Amara**
   - Lui imposer des exemples robustes pour les figures qui posent problème.
   - Lui demander d’éviter les points isolés sans segments.
   - Lui demander d’utiliser les patrons 2D explicites pour cône et pavé droit.

5. **Valider le résultat**
   - Tester les commandes représentatives : losange avec diagonales, carré, triangle, parallélogramme, polygone régulier, patron de cône, patron de pavé droit.
   - Vérifier que le tableau affiche les segments sur desktop et mobile.