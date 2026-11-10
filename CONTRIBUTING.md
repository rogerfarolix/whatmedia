# Contribuer à WhatMedia

Merci ! Toutes les contributions sont bienvenues : code, tests sur appareils, mesures, traductions, documentation.

## Démarrer

1. Lis [`docs/00-VISION.md`](docs/00-VISION.md) et [`docs/02-ARCHITECTURE.md`](docs/02-ARCHITECTURE.md).
2. Ouvre une issue avant un gros changement, ou prends une issue `good first issue`.
3. `pnpm install && pnpm dev`.

## Règles

- Branches : `feat/…`, `fix/…`, `docs/…`.
- Commits : [Conventional Commits](https://www.conventionalcommits.org/fr/) (`feat(core): …`). Un hook vérifie le format.
- `pnpm lint && pnpm typecheck && pnpm test` doivent passer ; la CI lance aussi `pnpm test:e2e`.
- Tout texte d’interface passe par l’i18n, en français et en anglais (`apps/app/src/i18n/translations.ts`, `apps/web/src/i18n/site.ts` et les vues de `apps/web/src/views`).
- Les réglages de compression se changent uniquement dans `packages/config/src`.
- Aucun appel réseau vers un tiers (polices, CDN, mesure d’audience) : un test Playwright le vérifie.
- Accessibilité WCAG 2.2 AA : contrastes, cibles de 44 px, utilisable au clavier.

## Ce qui aide le plus

- **Tester sur ton téléphone** : indique le modèle, la version d’iOS ou d’Android, le navigateur, le type de fichier et ce qui s’est passé.
- **Mesurer sur WhatsApp** : suis le protocole de [`docs/08-TESTS-QUALITE.md`](docs/08-TESTS-QUALITE.md) §3. Seules les mesures faites sur des fichiers réellement passés par WhatsApp sont acceptées dans `packages/config/src/measurements.json`.
- **Traduire** : copie les textes anglais, traduis, ouvre une PR.

## Code de conduite

En participant, tu acceptes le [code de conduite](CODE_OF_CONDUCT.md).
