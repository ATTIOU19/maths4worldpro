

## Plan : Vérification IA des réponses dans le Tuteur IA

### Problème actuel
La démo du Tuteur IA accepte n'importe quelle réponse et passe directement à l'étape suivante, sans vérifier si la réponse est correcte.

### Solution
Quand l'utilisateur envoie sa réponse, appeler l'edge function `math-chat` (ou une nouvelle fonction dédiée) pour que l'IA vérifie si la réponse est correcte. Selon le résultat :
- **Correcte** → afficher le message de validation puis continuer la conversation scriptée
- **Incorrecte** → afficher un message d'encouragement de l'IA expliquant l'erreur et invitant à réessayer, sans avancer à l'étape suivante

### Modifications

**1. `src/pages/TuteurIA.tsx`** — Modifier `handleSend` :
- Au lieu d'avancer automatiquement, envoyer la réponse de l'utilisateur + la question posée à une edge function pour vérification
- Ajouter les réponses attendues dans `conversationSteps` (ex: `expectedAnswer` avec mots-clés)
- Si l'IA juge la réponse correcte → avancer au step suivant (afficher la réponse scriptée)
- Si incorrecte → afficher un message IA personnalisé (ex: "Pas tout à fait, réessaye ! Indice : ...") et rester au même step

**2. `supabase/functions/verify-answer/index.ts`** — Nouvelle edge function :
- Reçoit : `{ question, userAnswer, expectedConcept }`
- Appelle Lovable AI Gateway avec un prompt système dédié : "Tu es un correcteur. Vérifie si la réponse de l'élève est correcte. Réponds en JSON : `{ correct: boolean, feedback: string }`"
- Retourne le résultat JSON

### Flux utilisateur
1. Amara pose une question
2. L'utilisateur tape sa réponse
3. L'IA vérifie → typing indicator pendant la vérification
4. Si correct : message de félicitations + passage à l'étape suivante
5. Si incorrect : message d'aide bienveillant + l'utilisateur peut réessayer

