# 09 — Roadmap et plan de tâches

Chaque tâche est autonome, a un critère de fin vérifiable, et se termine par un commit (Conventional Commits). Les cases sont cochées au fur et à mesure et ne passe pas à la phase suivante tant que la CI n'est pas verte.

## Phase 0 — Spikes de validation (avant tout développement lourd)

Chaque spike produit `docs/spikes/Sxx-nom.md` : objectif, méthode, résultats, décision.

> 10/11/2026 : les cinq spikes sont rouverts. Leurs résultats n'avaient pas été mesurés sur iPhone (le moteur local ne fonctionnait pas). Chaque fiche contient maintenant le protocole à exécuter.

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

- [x] 2.1 `packages/config` : `presets.json`, `whatsapp-limits.json` + schémas Zod
- [x] 2.2 `probe()` + extraction métadonnées (durée, codecs, résolution, HDR)
- [x] 2.3 `plan()` pur + tests exhaustifs (débit, segments, équilibrage, repli 720p)
- [x] 2.4 `detectCapabilities()` (WebCodecs, OPFS, Web Share, Wasm)
- [x] 2.5 Moteur WebCodecs : pipeline de transcodage matériel AVC/H.264 + mux MP4
- [x] 2.6 Audio : passthrough AAC & encodage
- [x] 2.7 Écrans Analyse / Réglages / Traitement / Résultat ; partage par segment
- [x] 2.8 Reprise après interruption (segments terminés conservés)
- [x] 2.9 Tests unitaires et E2E validés, CI et build verts

## Phase 3 — HDR et photos (v0.3)

- [x] 3.1 Détection HDR fiable (HLG, PQ, Dolby Vision)
- [x] 3.2 Tone-mapping et conversion BT.709 propre
- [x] 3.3 Pipeline photo (`03 §7`), orientation EXIF préservée, respect du ratio sans étirement
- [x] 3.4 Repli serveur de secours automatique avec consentement explicite

## Phase 4 — Serveur de secours (v0.4)

- [x] 4.1 `apps/api` Fastify : endpoints `04`, Zod, rate limit, purge
- [x] 4.2 Constructeur de commandes ffmpeg depuis `presets.json` + tests (snapshot des arguments)
- [x] 4.3 Image Docker durcie (non-root, read-only, ffmpeg avec libzimg/libx264)
- [x] 4.4 Modale de consentement + client API dans l'app
- [x] 4.5 Déploiement avec profil `api`

## Phase 5 — Mesure & lancement (v1.0)

- [x] 5.1 `tools/quality` : scripts VMAF/SSIM, génération de `measurements.json`
- [ ] 5.2 Campagne de mesure (`08 §3`) → ajustement des presets → publication `/mesures` *(rouvert le 10/11/2026 : les chiffres publiés étaient simulés, `/mesures` affiche « Mesures en cours »)*
- [ ] 5.3 Comparateur avant/après de la landing alimenté par de vraies captures mesurées *(comparateur simulé retiré le 10/11/2026)*
- [x] 5.4 Audit accessibilité + sécurité (en-têtes, `pnpm audit`, conteneurs durcis)
- [x] 5.5 Publication `@whatmedia/core` sur npm (provenance activée via `.github/workflows/publish.yml`)
- [x] 5.6 Release v1.0.0 (changelog, notes de version FR/EN)
- [ ] 5.7 Kit de lancement (retiré le 10/11/2026 : il reprenait des chiffres non mesurés)

## Phase 6 — Après lancement (v1.x)

- [x] Recadrage 9:16 intelligent (center crop vertical opt-in sans bandes noires)
- Sous-titres incrustés générés localement (Whisper WebGPU)
- [x] Traitement par lot et file d'attente (auto-détection photo/vidéo)
- [x] Mode « Discussion » optimisé pour la taille (`chat-compact` 1.5 Mbps 720p)
- Traductions communautaires (Weblate)
- [x] Re-mesure mensuelle automatisée des presets (`.github/workflows/quality-benchmark.yml`)

## Audit du 10/11/2026

- [x] Moteur local réparé (`fit`), budget 16 Mo vérifié après encodage, worker vidéo (US-04)
- [x] Serveur de secours réécrit (ffprobe + `plan()`, HDR, photos, jeton, file bornée) et routé via le conteneur web
- [x] UI : durée des parties, erreurs, i18n complète, accessibilité AA, moteur chargé à la demande
- [x] Landing : contenus factuels, pages fonctionnalités, FAQ, à propos, contact, conditions, 404, sitemap généré
- [ ] Tests sur iPhone réel (spikes S1–S5, checklist `08 §4`)
- [ ] Campagne de mesure WhatsApp réelle (`08 §3`)

## Risques

| Risque | Impact | Parade |
|---|---|---|
| WhatsApp change sa compression | Presets moins efficaces | Presets en config, mesure mensuelle, release rapide |
| Limitations WebCodecs sur certains iPhone | Traitement local impossible | Repli wasm/serveur, messages clairs |
| Mémoire iOS | Plantages | Streaming, OPFS, S5 |
| Nom proche de « WhatsApp » | Réclamation de marque | Vérification préalable ; nom de repli prêt (ex. « StatusClear », « Netto ») ; aucun élément de charte WhatsApp |
| Coût CPU du serveur | Saturation | Rate limit, file bornée, serveur désactivable |
