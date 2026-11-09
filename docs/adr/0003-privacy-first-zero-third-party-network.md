# ADR 0003: Politique Privacy-First & Zéro Requête Réseau Tiers

## Statut
Accepté & Implémenté

## Contexte
Les utilisateurs confient à WhatMedia leurs vidéos et photos personnelles, souvent intimes ou familiales. La plupart des outils concurrents envoient silencieusement les médias vers des serveurs distants ou embarquent des scripts publicitaires / traceurs (Google Analytics, Facebook Pixel, etc.).

## Décision
1. **Zéro requête réseau tiers** : L'application `/app/` n'effectue aucun appel vers l'extérieur.
2. **Auto-hébergement strict** : Polices de caractères (`Space Grotesk`, `Inter`, `JetBrains Mono`), icônes SVG et scripts sont intégrés à 100% dans le bundle PWA et le conteneur Caddy.
3. **Vérification automatisée en CI** : Un test Playwright E2E intercepte toutes les requêtes réseau émises par la page et échoue immédiatement si une requête sort vers un domaine tiers.
4. **Pas de cookies de pistage** : Aucun cookie publicitaire ni tracking d'utilisateur.

## Conséquences
- Confidentialité absolue garantie par conception et prouvée scientifiquement par audit réseau.
- Fonctionnement autonome hors-ligne via le Service Worker PWA.

