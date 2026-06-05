## Objectif
Rendre la page d'accueil (`/`) publique et accessible sans connexion. Tous les autres onglets (Chat IA, Visualisation, Tuteur IA, Entretien Vocal, Maths Métier, À propos) restent protégés : si un visiteur non connecté clique sur l'un d'eux, il est redirigé vers la page de connexion.

## Changements prévus

### 1. App.tsx
- Retirer `<RequireAuth>` autour de la route `/` pour laisser l'accueil accessible publiquement.
- Toutes les autres routes gardent leur `<RequireAuth>` existant.

### 2. Navbar.tsx
- Ajouter un hook d'authentification (`supabase.auth.getSession` + `onAuthStateChange`) pour connaître l'état de connexion.
- Si l'utilisateur **n'est pas connecté** :
  - Les liens du menu vers les pages protégées (`/chat`, `/visualisation`, `/tuteur-ia`, `/entretien-vocal`, `/maths-metier`, `/a-propos`) pointent vers `/connexion` au lieu de leur route directe.
  - Le clic sur un de ces liels redirige vers la page de connexion avec un état de redirection (`state={{ from: link.to }}`) pour revenir après connexion.
- Si l'utilisateur **est connecté** :
  - Les liens pointent normalement vers leur route.
  - Le bouton "S'inscrire" est remplacé par un bouton de déconnexion (ou un menu utilisateur).
- Les liens publics (`/`, `/connexion`, `/inscription`) restent inchangés.

### 3. Connexion.tsx
- Vérifier que la redirection post-connexion (`navigate("/")`) fonctionne correctement ; pas de changement majeur requis.

## Détail technique
- Pas de modification de la base de données ni des edge functions.
- Aucun changement sur `RequireAuth.tsx` : le composant continue de fonctionner normalement pour les routes protégées.
