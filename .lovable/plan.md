## Objectif

Remplacer la démo scriptée actuelle de `src/pages/TuteurIA.tsx` par une vraie conversation libre avec Amara, alimentée par l'IA (edge function `math-chat`), avec un onboarding personnalisé.

## Nouveau flux

1. **Clic sur « Commencer la démo »**
   - Récupération du prénom de l'utilisateur connecté (table `profiles` via Supabase) — fallback "👋" si non connecté.
   - Amara envoie automatiquement : *« Bonjour {prénom} ! Je suis Amara, ta tutrice en mathématiques. Que souhaites-tu maîtriser aujourd'hui ? »*

2. **L'utilisateur répond** (ex: "les dérivées", "le théorème de Pythagore", "les intégrales"…)

3. **Amara fait un brief (≤ 5 lignes)**
   - Le système prompt impose : première réponse après le sujet = brief court (5 lignes max) présentant la notion, son utilité, et annonçant qu'on va explorer par questions.
   - Peut inclure une visualisation 3D/2D (GeoGebra/function-plot) si pertinent, via les blocs déjà supportés par `MessageBubble`.

4. **Conversation libre ensuite**
   - Amara pose des questions socratiques une par une.
   - L'utilisateur peut aussi poser ses propres questions à tout moment — Amara répond pédagogiquement (LaTeX, graphiques, exemples africains, comme dans `math-chat`).

## Changements techniques

### `src/pages/TuteurIA.tsx` (refonte du bloc chat)
- **Supprimer** : `conversationSteps`, `step`, appel à `verify-answer`, état `isConversationDone`, message de fin scripté.
- **Ajouter** :
  - `useEffect` au montage pour récupérer le prénom via `supabase.auth.getUser()` + `profiles`.
  - `handleStart` → insère le premier message d'Amara (salutation + question d'ouverture) sans appel API.
  - `handleSend` → appelle `supabase.functions.invoke("math-chat", { body: { messages: [...historique, userMsg] } })` et streame/affiche la réponse.
  - Conversation libre illimitée (plus de blocage après N étapes).
  - Le panneau de droite (graphique recharts fixe f(x)=x³−2x+1) devient un **état d'accueil générique** ("Les visualisations apparaîtront dans la conversation") puisque les graphiques sont désormais rendus inline dans les bulles via `MessageBubble`.

### `supabase/functions/math-chat/index.ts`
- Ajouter (ou accepter via body) un **mode "tuteur"** qui injecte une instruction supplémentaire dans le system prompt :
  > « Quand l'utilisateur annonce une notion qu'il veut maîtriser, fais d'abord un BRIEF de 5 lignes maximum (définition, utilité, plan), puis enchaîne par UNE question socratique. Ensuite, alterne questions/réponses, et réponds aussi aux questions de l'utilisateur. »
- Aucune nouvelle dépendance ni migration DB.

### Inchangé
- Le rendu LaTeX, GeoGebra 3D (cône, sphère, cylindre) et function-plot fonctionne déjà via `MessageBubble` → les visualisations 3D continueront d'apparaître quand Amara en inclut.
- Auth, routes, autres pages : aucun changement.

## Hors scope
- Pas de persistance de la conversation Tuteur IA (session uniquement, comme aujourd'hui).
- Pas de modification de la voix / `EntretienSession`.
