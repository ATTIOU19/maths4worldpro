

## Plan : Lancer le chat automatiquement avec les bases de la notion

### Modifications

**1. `src/pages/MathsMetier.tsx`** — Modifier le prompt dans `handleLearn` pour demander de commencer par les bases :
```
Enseigne-moi la notion "${notion}" dans le contexte du domaine "${domaine}".
Commence par les bases et les prérequis fondamentaux, puis progresse étape par étape avec des exemples concrets liés à ce métier.
```

**2. `src/pages/ChatIA.tsx`** — Lire le paramètre `prompt` de l'URL au montage et envoyer automatiquement :
- Importer `useSearchParams` de react-router-dom
- Ajouter un `useEffect` qui lit `searchParams.get("prompt")` et appelle `send(prompt)` si présent
- Nettoyer le paramètre URL après envoi

Résultat : clic sur "Apprendre cette notion" → redirection vers le chat → Amara commence directement par les bases.

