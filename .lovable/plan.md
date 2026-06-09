## Problème

La vidéo d'arrière-plan de la page de connexion ne s'affiche que sur l'aperçu Lovable (et `*.lovable.app`), pas sur le déploiement Vercel.

La raison : le fichier `public/videos/auth-bg.mp4.asset.json` pointe vers une URL **relative** propre à l'hébergement Lovable :

```
/__l5e/assets-v1/9ac54379-.../auth-bg.mp4
```

Ce chemin `/__l5e/...` est réécrit par les serveurs Lovable vers leur CDN. Vercel ne connaît pas cette règle de réécriture → la requête renvoie 404 et la balise `<video>` reste vide (on ne voit que les overlays bleus).

## Solution

Héberger la vidéo en local dans le repo et la servir directement depuis `/public`, ce qui fonctionne sur n'importe quel hébergeur (Lovable, Vercel, Netlify, etc.).

### Étapes

1. Récupérer le binaire `auth-bg.mp4` depuis l'URL Lovable actuelle et le placer dans `public/videos/auth-bg.mp4` (≈ 23 Mo).
2. Modifier `src/components/AuthBackgroundVideo.tsx` :
   - Supprimer l'import du pointeur JSON.
   - Utiliser `src="/videos/auth-bg.mp4"` directement.
3. Supprimer le fichier `public/videos/auth-bg.mp4.asset.json` devenu inutile.

### Détails techniques

- Le dossier `public/` de Vite est copié tel quel dans `dist/` au build, donc `/videos/auth-bg.mp4` sera disponible à la racine sur Vercel.
- Ajout d'attributs `preload="auto"` recommandé pour démarrer le téléchargement tôt.
- La taille (~23 Mo) reste raisonnable pour une page d'auth ; aucune compression supplémentaire prévue dans ce plan (peut être faite plus tard si besoin).

### Hors périmètre

- Pas de changement visuel (overlays, filtres, mise en page conservés).
- Pas de modification de la logique d'authentification.
