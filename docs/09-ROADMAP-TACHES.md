# 09 — Roadmap et plan de tâches pour Claude Code

Chaque tâche est autonome, a un critère de fin vérifiable, et se termine par un commit (Conventional Commits). Claude Code coche les cases au fur et à mesure et ne passe pas à la phase suivante tant que la CI n'est pas verte.

## Phase 0 — Spikes de validation (avant tout développement lourd)

Chaque spike produit `docs/spikes/Sxx-nom.md` : objectif, méthode, résultats, décision.

- [ ] **S1 — Entrée iOS & Mediabunny** : sur iPhone réel, que renvoie `<input type=file>` pour une vidéo HDR HEVC (codec, HDR conservé, taille) ? Mediabunny lit-il le MOV et écrit-il un MP4 valide avec WebCodecs ? → décision demux/mux.
- [ ] **S2 — Tone-mapping HDR local** : options A (canvas) et B (WebGL2) vs référence ffmpeg, ΔE2000 sur 10 clips → décision.
- [ ] **S3 — ffmpeg.wasm sur iOS** : single-thread suffit-il (temps pour 30 s 1080p) ? Le multi-thread vaut-il les en-têtes COOP/COEP ? → décision d'embarquer ou non le repli wasm.
- [ ] **S4 — Partage** : `navigator.share` avec 1 puis 3 fichiers MP4 de 15 Mo depuis la PWA installée → WhatsApp propose-t-il « Mon statut » ? → décision UX partage séquentiel/groupé.
- [ ] **S5 — Mémoire** : vidéo 4K de 3 min traitée de bout en bout sur iPhone 12/13 sans que l'onglet soit tué ; mesurer le pic.

## Phase 1 — Fondations (v0.1)

- [x] 1.1 Monorepo pnpm + Turborepo, TypeScript strict, ESLint, Prettier, Vitest, Husky + commitlint
- [x] 1.2 Fichiers open source : README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, modèles d'issues/PR (déjà fournis dans ce kit — les intégrer)
- [x] 1.3 `apps/web` Astro : landing complète (`05 §3`), pages légales, FR/EN, SEO, OG image, JSON-LD
- [x] 1.4 `apps/app` React + vite-plugin-pwa sous `/app/` : manifest, icônes, service worker, écran d'accueil, bandeau d'installation iOS
- [x] 1.5 Sélection de fichier + partage direct du fichier original (sans traitement) — valide la chaîne de bout en bout
- [x] 1.6 CI (`ci.yml`) verte ; configuration Playwright (WebKit & Chromium)
- [x] 1.7 Docker `web` + `deploy/` ; **premier déploiement sur whatmedia.nealix.org** (conteneur live sur 127.0.0.1:8096, config Nginx prête)

## Phase 2 — Moteur vidéo local (v0.2)

- [ ] 2.1 `packages/config` : `presets.json`, `whatsapp-limits.json` + schémas Zod
- [ ] 2.2 `probe()` + tests sur le corpus
- [ ] 2.3 `plan()` pur + tests exhaustifs (débit, segments, équilibrage, repli 720p)
- [ ] 2.4 `detectCapabilities()`
- [ ] 2.5 Moteur WebCodecs : decode → scale → encode H.264 → mux MP4 dans l'OPFS, dans un worker (Comlink), annulable
- [ ] 2.6 Audio : passthrough AAC ; encodage si nécessaire
- [ ] 2.7 Écrans Analyse / Réglages / Traitement / Résultat ; partage par segment
- [ ] 2.8 Reprise après interruption (segments terminés conservés)
- [ ] 2.9 Tests E2E Playwright WebKit + Chromium

## Phase 3 — HDR et photos (v0.3)

- [ ] 3.1 Détection HDR fiable (HLG, PQ, Dolby Vision)
- [ ] 3.2 Tone-mapping selon la décision S2
- [ ] 3.3 Pipeline photo (`03 §7`), HEIC inclus
- [ ] 3.4 Repli ffmpeg.wasm selon la décision S3 (chargement paresseux)

## Phase 4 — Serveur de secours (v0.4)

- [ ] 4.1 `apps/api` Fastify : endpoints `04`, Zod, rate limit, purge
- [ ] 4.2 Constructeur de commandes ffmpeg depuis `presets.json` + tests (snapshot des arguments)
- [ ] 4.3 Image Docker durcie (non-root, read-only, ffmpeg avec libzimg/libx264)
- [ ] 4.4 Modale de consentement + client API dans l'app
- [ ] 4.5 Déploiement avec profil `api`

## Phase 5 — Mesure & lancement (v1.0)

- [ ] 5.1 `tools/quality` : scripts VMAF/SSIM, génération de `measurements.json`
- [ ] 5.2 Campagne de mesure (`08 §3`) → ajustement des presets → publication `/mesures`
- [ ] 5.3 Comparateur avant/après de la landing alimenté par de vraies captures mesurées
- [ ] 5.4 Audit accessibilité + sécurité (en-têtes, `pnpm audit`, scan d'image Trivy)
- [ ] 5.5 Publication `@whatmedia/core` sur npm (provenance activée)
- [ ] 5.6 Release v1.0.0 (changelog, images signées, notes de version FR/EN)
- [ ] 5.7 Kit de lancement : post GitHub, LinkedIn, X, statut WhatsApp de démonstration (réalisé avec WhatMedia !), soumission à des annuaires open source

## Phase 6 — Après lancement (v1.x)

- Recadrage 9:16 intelligent (détection de visage/sujet, opt-in)
- Sous-titres incrustés générés localement (Whisper WebGPU)
- Traitement par lot et file d'attente
- Mode « Discussion » optimisé pour la taille
- Traductions communautaires (Weblate)
- Re-mesure mensuelle automatisée des presets

## Risques

| Risque | Impact | Parade |
|---|---|---|
| WhatsApp change sa compression | Presets moins efficaces | Presets en config, mesure mensuelle, release rapide |
| Limitations WebCodecs sur certains iPhone | Traitement local impossible | Repli wasm/serveur, messages clairs |
| Mémoire iOS | Plantages | Streaming, OPFS, S5 |
| Nom proche de « WhatsApp » | Réclamation de marque | Vérification préalable ; nom de repli prêt (ex. « StatusClear », « Netto ») ; aucun élément de charte WhatsApp |
| Coût CPU du serveur | Saturation | Rate limit, file bornée, serveur désactivable |
