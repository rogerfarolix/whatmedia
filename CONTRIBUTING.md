# Contribuer à WhatMedia

Merci ! Toutes les contributions sont bienvenues : code, mesures, traductions, tests sur appareils, documentation.

## Démarrer
1. Lis [`docs/00-VISION.md`](docs/00-VISION.md) et [`docs/02-ARCHITECTURE.md`](docs/02-ARCHITECTURE.md).
2. Cherche une issue `good first issue` ou `help wanted`, ou ouvre une issue avant un gros changement.
3. `pnpm i && pnpm dev`.

## Règles
- Branches : `feat/…`, `fix/…`, `docs/…`.
- Commits : [Conventional Commits](https://www.conventionalcommits.org/fr/) (`feat(core): …`).
- `pnpm lint && pnpm typecheck && pnpm test` doivent passer.
- Tout texte d'interface passe par l'i18n (FR + EN).
- Les paramètres de compression se changent **uniquement** dans `packages/config/`, avec des mesures à l'appui (`docs/08-TESTS-QUALITE.md`).
- Pas d'appel réseau tiers dans l'app.

## Contribuer des mesures
Le plus utile pour le projet ! Suis le protocole de `docs/08-TESTS-QUALITE.md §3`, puis ouvre une PR qui ajoute tes résultats à `packages/config/measurements.json` en précisant l'appareil et la version de WhatsApp.

## Traductions
Les fichiers de langue sont dans `apps/app/src/i18n/` et `apps/web/src/i18n/`. Copie `en.json`, traduis, ouvre une PR.

## Code de conduite
En participant, tu acceptes le [Code de conduite](CODE_OF_CONDUCT.md).
