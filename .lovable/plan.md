

## Plan : Afficher les notions maths par métier au clic

### Problème actuel
Seul le domaine "Intelligence Artificielle" (index 0) a un contenu étendu en dur. Les 5 autres domaines ne montrent rien quand on clique dessus. Le contenu actuel (chat simulé, évaluation orale) est trop complexe et statique.

### Solution
Remplacer le bloc étendu unique par un système dynamique : chaque domaine aura sa liste de **notions mathématiques** structurées. Au clic sur un domaine, un panneau s'ouvre en dessous avec les notions correspondantes, présentées sous forme de cartes claires.

### Structure des données

Chaque domaine contiendra un tableau de notions :
```text
domaine → [
  { nom, description, niveau (Débutant/Intermédiaire/Avancé), icône }
]
```

Exemple pour **IA** : Algèbre linéaire, Calcul matriciel, Probabilités bayésiennes, Optimisation convexe, Dérivées partielles...
Exemple pour **BTP** : Trigonométrie, Calculs de volumes, Résistance des matériaux, Géométrie dans l'espace...
Exemple pour **Médecine** : Statistiques descriptives, Probabilités, Dosages proportionnels, Épidémiologie...

### Rendu visuel

Au clic sur un domaine :
- Le panneau s'ouvre avec une animation (déjà en place via AnimatePresence)
- Titre : "Notions mathématiques pour [Domaine]"
- Grille de cartes (2-3 colonnes) avec pour chaque notion :
  - Nom en gras
  - Description courte (1-2 lignes)
  - Badge de niveau (couleur selon difficulté)
- Bouton "Apprendre cette notion" qui redirige vers le chat IA avec la notion pré-remplie

### Modifications techniques

**Fichier unique** : `src/pages/MathsMetier.tsx`
- Enrichir le tableau `domains` avec un champ `notions` pour chaque domaine (6-8 notions par domaine)
- Remplacer le bloc `{expanded === 0 && ...}` par un rendu dynamique `{expanded >= 0 && ...}` qui affiche les notions du domaine sélectionné
- Supprimer le contenu statique (mini chat, évaluation orale, stepper, certificat)
- Chaque carte de notion aura un lien vers `/chat?notion=...` pour lancer directement une conversation

