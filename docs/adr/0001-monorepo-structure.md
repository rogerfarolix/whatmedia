# ADR 0001: Architecture Monorepo pnpm & Turborepo

## Statut
Accepté & Implémenté

## Contexte
WhatMedia comprend plusieurs composants logiciels :
1. Une landing page de présentation performante, bilingue, optimisée SEO (`apps/web`).
2. Une Progressive Web App (PWA) interactive exécutant le transcodage client (`apps/app`).
3. Une API serveur de repli Fastify 5 orchestrant ffmpeg (`apps/api`).
4. Une bibliothèque cœur de traitement média agnostique de l'interface (`packages/core`).
5. Une source unique de vérité pour les presets et contraintes WhatsApp (`packages/config`).
6. Un banc de test de qualité automatisé (`tools/quality`).

## Décision
Adopter un monorepo géré avec `pnpm` workspaces et orchestré par `Turborepo` :
- `apps/*` : applications déployables (`web`, `app`, `api`).
- `packages/*` : bibliothèques internes réutilisables (`core`, `config`).
- `tools/*` : scripts de banc d'essai et de tooling hors runtime de production.
- Configuration TypeScript unifiée via `tsconfig.base.json` en mode strict.
- Pipeline unifié de linting (ESLint flat config) et de tests (Vitest).

## Conséquences
- Partage direct des types et schémas Zod entre le client, le serveur et les tests sans duplication.
- Build ultra-rapide grâce au cache Turborepo.
- Déploiement indépendant des conteneurs Caddy (`apps/web` + PWA sous `/app/`) et Fastify (`apps/api`).

