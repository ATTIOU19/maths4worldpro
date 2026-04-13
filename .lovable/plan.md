

## Problème

Le tableau markdown ne s'affiche pas correctement car le plugin **remark-gfm** (GitHub Flavored Markdown) n'est pas installé. Sans ce plugin, ReactMarkdown ne reconnaît pas la syntaxe des tableaux markdown (`| ... | ... |`) et affiche le texte brut avec les traits.

## Solution

1. **Installer `remark-gfm`** — Ce plugin active le support des tableaux, du texte barré, et d'autres extensions GFM dans ReactMarkdown.

2. **Mettre à jour `MessageBubble.tsx`** — Ajouter `remarkGfm` dans la liste des `remarkPlugins` de ReactMarkdown, à côté de `remarkMath`.

### Détail technique

Dans `src/components/chat/MessageBubble.tsx`, chaque `<ReactMarkdown>` passera de :
```
remarkPlugins={[remarkMath]}
```
à :
```
remarkPlugins={[remarkGfm, remarkMath]}
```

Les styles CSS pour les tableaux existent déjà dans `index.css` — ils s'appliqueront automatiquement une fois que les tableaux seront correctement parsés.

