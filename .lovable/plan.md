## 4 modifications demandées

### 1. Page d'accueil — retirer la ligne descriptive

Dans `src/pages/Index.tsx`, supprimer le paragraphe :

> « Tuteur IA conversationnel · Réponse visuelle automatique · Adapté aux curricula africains · Évaluation orale »

### 2. Tuteur IA — retirer les sélecteurs niveau et pays

Dans `src/pages/TuteurIA.tsx` (en-tête du chat) :

- Supprimer les deux `<select>` (Terminale C/D / Première / … et 🇧🇯 Bénin / 🇸🇳 Sénégal / …).
- Garder uniquement l'avatar « Amara » et son statut « En ligne ».

### 3. Entretien vocal — supprimer toute mention de dollars / FCFA / argent

Dans `supabase/functions/entretien-chat/index.ts`, ajouter une règle stricte au `systemPrompt` :

- « Tu es un assistant pédagogique qui explique les mathématiques à l’oral.
  Règles STRICTES :
  - N’utilise JAMAIS de LaTeX (pas de $, \frac, \sqrt, etc.)
  - N’utilise pas de notation mathématique brute
  - Transforme toujours les expressions en langage naturel, comme si tu parlais à un élève
  Règles de conversion :
  - f(x) → "f de x"
  - = → "égale"
  - / → "sur"
  - a - b → "a moins b"
  - a + b → "a plus b"
  - a × b → "a fois b"
  - a^2 → "a au carré"
  - a^n → "a puissance n"
  Exemples :
  - f(x)=2/(2-x) → "f de x égale deux sur deux moins x"
  - x^2 + 3x → "x au carré plus trois x"
  Important :
  - Le texte doit être parfaitement lisible par une synthèse vocale (TTS)
  - Ne lis jamais les symboles comme "$" ou "\" ou caractère par caractère
  - Toujours privilégier une phrase naturelle et fluide
  Objectif :
  Produire une réponse compréhensible à l’oral, naturelle et fluide, sans symboles techniques.»
- Re-déployer la fonction `entretien-chat` automatiquement après modification.

### 4. Authentification obligatoire avant l'accès au site

Aujourd'hui `/` (accueil) est accessible sans compte. Mettre en place une **garde d'authentification globale** :

- Créer `src/components/RequireAuth.tsx` :
  - Écoute `supabase.auth.onAuthStateChange` + `getSession()` (listener AVANT getSession, conformément aux bonnes pratiques).
  - Si pas de session → `<Navigate to="/connexion" replace />`.
  - Si session → rend les enfants.
  - Affiche un petit loader pendant la vérification initiale.
- Dans `src/App.tsx`, envelopper toutes les routes protégées avec `RequireAuth`. Routes **publiques** (non protégées) :
  - `/connexion`
  - `/inscription`
  - `*` (NotFound)
  Routes **protégées** (nécessitent un compte) :
  - `/` (Accueil)
  - `/tuteur-ia`, `/maths-metier`, `/a-propos`
  - `/entretien-vocal`, `/entretien-vocal/session`
  - `/chat`, `/visualisation`
- Sur `/connexion` et `/inscription`, après succès, rediriger vers `/`.

```text
Visiteur ──► / ──► RequireAuth ──► session ?
                                    │
                       non ─────────┴───────── oui
                        ▼                       ▼
                  /connexion                Accueil
```

### Fichiers modifiés / créés

- `src/pages/Index.tsx` — suppression du sous-titre.
- `src/pages/TuteurIA.tsx` — suppression des deux selects.
- `supabase/functions/entretien-chat/index.ts` — règle « pas d'argent ».
- `src/components/RequireAuth.tsx` — **nouveau**.
- `src/App.tsx` — wrapping des routes protégées.
- (Vérification rapide que `Connexion.tsx` / `Inscription.tsx` redirigent bien vers `/` après succès — sinon ajustement minimal.)

### Résultat attendu

- Accueil épuré sans la ligne marketing.
- Tuteur IA sans menus déroulants superflus.
- Amara ne parle plus jamais d'argent pendant les entretiens.
- Toute personne qui ouvre le lien de l'app est redirigée vers `/connexion` tant qu'elle n'a pas de compte / n'est pas connectée.