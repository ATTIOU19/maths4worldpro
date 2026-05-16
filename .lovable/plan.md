## Objectif

Transformer la page **Maths Métier** en une expérience visuelle premium, plus engageante, en restant fidèle à l'identité MATHS4WORLD (bleu profond #1A3C6E, Inter, ton sérieux/africain). Aucune modification fonctionnelle : routes, navigation et logique de dépliement restent identiques.

## Ce qui change visuellement

### 1. Hero refondu
- Petit chip au-dessus du titre : « 14 domaines · 80+ notions ».
- Titre large avec un mot mis en gradient (ex. « Maths **Métier** » avec « Métier » en dégradé bleu → cyan).
- Sous-titre raffiné + 2 stats inline (domaines couverts, notions explorables).
- Décor : halo radial bleu très doux derrière le titre, motifs mathématiques déjà présents conservés.

### 2. Cartes de domaines (la grosse amélioration)
- Chaque domaine reçoit une **couleur d'accent dédiée** (IA = indigo, Data = cyan, ML = violet, BTP = ambre, Agro = vert, Santé = rose, Finance = émeraude, Éco = bleu, Compta = slate, Énergie = jaune, Logistique = orange, Cyber = rouge, Ingé = teal, Éducation = fuchsia).
- Carte : fond `bg-card`, bordure subtile, **glow d'accent** au hover, légère élévation et translation Y, icône posée dans une **tuile dégradée** colorée (10 % d'opacité de l'accent + ring).
- Coin supérieur droit : badge pastille (Populaire/Nouveau) repensé avec point coloré + texte fin.
- Sous-titre limité à 2 lignes, puis liste de 2-3 « tags » (premières notions) en pills discrètes.
- Bas de carte : bouton `Explorer →` avec flèche qui glisse au hover.
- Carte sélectionnée : ring d'accent + petit triangle/connector pointant vers la zone notions dépliée.

### 3. Section notions dépliée
- Conteneur avec en-tête plus riche : icône + titre du domaine, compteur « 6 notions », et bouton « Tout explorer » discret.
- Filtre rapide par niveau (Débutant / Intermédiaire / Avancé) en chips toggle (visuel uniquement, sans logique complexe — affichage de tout par défaut, filtrage simple côté state local).
- Cartes notions : passer du gris uniforme à un fond `card` avec bordure colorée à gauche selon le niveau (vert/ambre/rouge), hover qui fait apparaître l'action « Apprendre » de manière plus marquée, micro-animation sur l'icône `BookOpen`.

### 4. Bandeau CTA en bas de page
- Avant le footer : bandeau bleu avec accroche « Vous ne trouvez pas votre métier ? » + bouton vers le Chat IA pour demander une notion sur mesure.

### 5. Animations
- Stagger d'apparition plus nerveux sur les cartes (delay 0.04 au lieu de 0.08).
- Au hover de carte : `scale(1.01)`, glow d'accent, bordure qui s'illumine.
- Section notions : `AnimatePresence` conservé, transition légèrement plus fluide.

## Détails techniques

- Fichier principal : `src/pages/MathsMetier.tsx` uniquement.
- Ajouter une propriété `accent: { from: string; to: string; ring: string }` à chaque entrée de `domains` (valeurs HSL via classes Tailwind arbitraires ou tokens définis dans `tailwind.config.ts`).
- Ne pas casser la signature : `handleLearn(domaine, notion)` et la navigation vers `/notion?...` restent inchangées.
- Continuer d'utiliser `lucide-react`, `framer-motion`, `Badge`, `MathSymbolsBackground`, `Navbar`, `Footer` déjà en place.
- Filtre niveau : `useState<"all" | "Débutant" | "Intermédiaire" | "Avancé">("all")`, filtrage en `.filter()` avant `.map()` dans la liste de notions.
- Aucune nouvelle dépendance.

## Hors scope

- Pas de changement de la page `/notion` ni de la logique du chat.
- Pas de refonte de la Navbar / Footer.
- Pas de retrait/ajout de domaines (les 14 actuels sont conservés).
