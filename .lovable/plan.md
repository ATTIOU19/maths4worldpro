

## Modifications du Footer

### 1. Footer plus bas
Ajouter `mt-auto` au footer et wraper le layout des pages avec `min-h-screen flex flex-col` pour que le footer soit toujours poussé en bas de la page. Cela se fait dans les pages qui incluent le Footer (Index, etc.).

### 2. "Contact" comme lien mailto
Transformer le titre `<h4>Contact</h4>` en lien cliquable `<a href="mailto:attioukotchole@gmail.com">Contact</a>` avec un style de lien hypertexte (souligné au survol).

### Fichiers modifiés
- **`src/components/Footer.tsx`** : transformer le `<h4>Contact</h4>` en `<a href="mailto:...">`, ajouter `mt-auto` au footer
- **`src/pages/Index.tsx`** (et autres pages avec Footer) : ajouter `min-h-screen flex flex-col` au conteneur principal pour pousser le footer en bas

