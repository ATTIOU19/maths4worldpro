

## Correction : Vérification trop stricte dans le Tuteur IA

### Problème
L'IA de vérification est trop exigeante sur la formulation. Quand l'élève répond "3x^2 - 2" (réponse correcte), l'IA considère que c'est incomplet parce que le `expectedConcept` demande le détail terme par terme. Résultat : l'élève est bloqué même avec la bonne réponse.

### Solution (2 modifications)

**1. `supabase/functions/verify-answer/index.ts`** — Rendre le prompt de vérification plus indulgent :
- Modifier le prompt système pour préciser : "Si la réponse finale est mathématiquement correcte, considère-la comme correcte même si l'élève ne détaille pas chaque étape."
- Ajouter l'instruction : "Sois indulgent sur la notation (3x^2 = 3x² = 3·x²)"

**2. `src/pages/TuteurIA.tsx`** — Simplifier les `expectedConcept` :
- Step 1 : changer en `"La règle est n·x^(n-1). Par exemple la dérivée de x^n est n*x^(n-1)"`
- Step 2 : changer en `"f'(x) = 3x² - 2. Accepter aussi 3x^2 - 2 ou toute formulation équivalente."`
- Step 3 : garder tel quel

### Fichiers modifiés
- `supabase/functions/verify-answer/index.ts`
- `src/pages/TuteurIA.tsx`

