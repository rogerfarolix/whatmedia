# CLAUDE.md — Instructions pour Claude Code

Tu construis **WhatMedia** : une PWA open source qui prépare photos et vidéos pour les statuts WhatsApp (traitement local avec WebCodecs, serveur de secours optionnel), déployée sur **https://whatmedia.nealix.org**. Porteur du projet : Roger Gnanih (Nealix).

## Sources de vérité (lire avant de coder)
1. `docs/00-VISION.md` — pourquoi, promesse, limites honnêtes
2. `docs/01-PRD.md` — fonctionnalités et critères d'acceptation
3. `docs/02-ARCHITECTURE.md` — stack, arborescence, API du moteur
4. `docs/03-PIPELINE-MEDIA.md` — **le cœur** : presets, débits, HDR, contraintes iOS
5. `docs/04-API.md` — serveur de secours
6. `docs/05-UI-UX-LANDING.md` — design, écrans, textes de la landing
7. `docs/06-DEPLOIEMENT.md` — serveur, DNS, Docker, CI/CD
8. `docs/07-SECURITE-VIE-PRIVEE.md`, `docs/08-TESTS-QUALITE.md`
9. `docs/09-ROADMAP-TACHES.md` — **l'ordre de travail**, à cocher au fur et à mesure

En cas de contradiction : PRD > Architecture > le reste. Signale la contradiction à Roger.

## Règles de travail
- Suis les phases de `09-ROADMAP-TACHES.md` dans l'ordre. **Commence par les spikes de la phase 0** quand ils exigent un iPhone réel : prépare la page de test, puis demande à Roger de l'exécuter et de te renvoyer les résultats.
- Une tâche = une branche `feat/…` ou `fix/…` = des commits Conventional Commits (`feat(core): …`). Coche la case dans la roadmap dans le même commit.
- La CI doit être verte avant de passer à la tâche suivante. Pas de `--no-verify`.
- TypeScript strict, aucun `any` non justifié. Fonctions pures testées (`plan()` surtout).
- **Aucune valeur de compression en dur** : tout vient de `packages/config/*.json`.
- **N'invente jamais de chiffres de qualité** (VMAF, « 3× plus net »…) dans l'UI ou la landing. Ils viennent de `measurements.json` ; tant qu'il est vide, affiche « Mesures en cours ».
- Ne promets jamais de « désactiver » ou « contourner » la compression de WhatsApp. Pas de logo, pas de vert `#25D366`, pas d'icône WhatsApp. Avertissement de non-affiliation dans chaque pied de page.
- Toute bibliothèque marquée « candidat » doit passer un spike avant d'être adoptée ; note la décision dans `docs/adr/`.
- Vie privée : aucun appel réseau tiers depuis `/app` (polices, CDN, analytics inclus). Vérifie avec un test Playwright qui échoue si une requête sort de l'origine.
- Interface en français par défaut, anglais complet ; tous les textes passent par l'i18n.
- Accessibilité WCAG 2.2 AA (axe-core en CI).

## Déploiement — règles de sécurité
- **Avant le premier déploiement, pose à Roger les questions de `docs/06-DEPLOIEMENT.md §0`.** N'invente ni IP, ni utilisateur, ni chemin.
- Le serveur héberge probablement d'autres sites (ex. codebox.nealix.org) : **ne touche jamais à leur configuration**. Ajoute seulement un bloc pour `whatmedia.nealix.org`. Valide (`nginx -t` / `caddy validate`) avant chaque rechargement.
- Demande confirmation avant toute commande destructive ou irréversible sur le serveur (suppression, `docker system prune -a`, modification du pare-feu, redémarrage de services partagés).
- Les secrets vont dans les secrets GitHub et dans `deploy/.env` sur le serveur — jamais dans Git.

## Commandes (une fois le monorepo créé)
```bash
pnpm i
pnpm dev            # web + app (+ api si WHATMEDIA_API_ENABLED=true)
pnpm test           # vitest
pnpm test:e2e       # playwright (chromium + webkit)
pnpm lint && pnpm typecheck
pnpm build
docker compose -f deploy/docker-compose.yml --profile api up --build   # test local complet
```

## Définition de « terminé » pour une fonctionnalité
- Critères d'acceptation du PRD satisfaits et testés
- Tests unitaires + E2E pertinents verts
- Textes FR + EN
- Accessible au clavier et à VoiceOver
- Documentation mise à jour (docs/ ou README) et CHANGELOG (section Unreleased)
