# 02 — Architecture technique

## 1. Vue d'ensemble

```
                         whatmedia.nealix.org (HTTPS, Caddy)
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
     /  (landing, Astro)        /app (PWA React)          /api/v1 (optionnel)
     HTML statique              statique + SW              Fastify + ffmpeg
                                      │                          ▲
                                      ▼                          │ consentement
                         ┌────────────────────────┐              │ explicite
                         │  Web Worker            │──────────────┘
                         │  @whatmedia/core       │
                         │  ├─ probe (demux)      │
                         │  ├─ plan (preset)      │
                         │  ├─ engine WebCodecs   │
                         │  ├─ engine ffmpeg.wasm │ (chargé à la demande)
                         │  └─ mux MP4 / JPEG     │
                         └────────────────────────┘
                                      │
                            OPFS (fichiers temporaires)
                                      │
                         navigator.share → WhatsApp
```

## 2. Choix de stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Monorepo | **pnpm workspaces + Turborepo** | Builds incrémentaux, un seul dépôt open source |
| Langage | **TypeScript strict** partout | Fiabilité, contributeurs |
| Landing + pages | **Astro 5** | HTML statique, SEO, Lighthouse 100, îlots React si besoin |
| App | **React 19 + Vite**, routée sous `/app` | Écosystème, PWA mature |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest, précache, mises à jour |
| Style | **Tailwind CSS 4** + tokens CSS (voir `05-UI-UX-LANDING.md`) | Cohérence landing/app |
| État | **Zustand** | Léger |
| i18n | **Paraglide JS** (ou i18next) | Typé, léger |
| Moteur média | **`@whatmedia/core`** (package interne publié sur npm) | Réutilisable, testable |
| Demux/mux | **Mediabunny** (candidat principal — à valider au spike S1) | Lecture MP4/MOV, écriture MP4, intégration WebCodecs, TypeScript |
| Encodage | **WebCodecs** (VideoEncoder/Decoder, AudioEncoder) | Accélération matérielle dans le navigateur |
| Repli client | **ffmpeg.wasm** (single-thread par défaut) | Codecs non pris en charge par WebCodecs |
| Serveur de secours | **Node 22 + Fastify 5 + ffmpeg 7** dans Docker | Simple, robuste |
| File d'attente serveur | En mémoire + limite de concurrence (p-limit) ; Redis/BullMQ si montée en charge | Simplicité v1 |
| Reverse proxy | **Caddy 2** (HTTPS automatique) — ou Nginx existant sur le serveur | Voir `06-DEPLOIEMENT.md` |
| CI/CD | **GitHub Actions** → images GHCR → déploiement SSH | Standard open source |
| Tests | Vitest, Playwright (WebKit + Chromium), scripts VMAF | Voir `08-TESTS-QUALITE.md` |

> **Règle pour Claude Code** : toute bibliothèque marquée « candidat » doit être validée par un spike documenté (`docs/spikes/Sxx-*.md`) avant d'être adoptée. Si elle échoue, on documente l'alternative retenue.

## 3. Arborescence du dépôt

```
whatmedia/
├─ apps/
│  ├─ web/                    # Astro : landing, pages, docs publiques ; sert aussi /app
│  │  ├─ src/pages/           # index.astro, comment-ca-marche, mesures, confidentialite, mentions, en/...
│  │  ├─ src/components/
│  │  └─ public/              # icônes, og-image, robots.txt
│  ├─ app/                    # React PWA (base: /app/)
│  │  ├─ src/
│  │  │  ├─ screens/          # Home, Analyze, Settings, Processing, Result
│  │  │  ├─ components/
│  │  │  ├─ worker/           # media.worker.ts (Comlink)
│  │  │  ├─ store/
│  │  │  ├─ i18n/
│  │  │  └─ lib/              # share.ts, install.ts, capabilities.ts
│  │  └─ vite.config.ts
│  └─ api/                    # Fastify, serveur de secours
│     ├─ src/
│     │  ├─ routes/jobs.ts
│     │  ├─ ffmpeg/           # construction des commandes à partir des presets
│     │  ├─ cleanup.ts
│     │  └─ server.ts
│     └─ Dockerfile
├─ packages/
│  ├─ core/                   # @whatmedia/core
│  │  ├─ src/
│  │  │  ├─ probe.ts
│  │  │  ├─ plan.ts           # MediaInfo + Preset → Plan (segments, débit, filtres)
│  │  │  ├─ presets.ts        # importe config/presets.json
│  │  │  ├─ engines/webcodecs.ts
│  │  │  ├─ engines/ffmpeg-wasm.ts
│  │  │  ├─ hdr.ts
│  │  │  ├─ image.ts
│  │  │  └─ index.ts
│  │  └─ test/
│  └─ config/                 # presets.json, whatsapp-limits.json (source unique de vérité)
├─ tools/
│  └─ quality/                # scripts de mesure VMAF/SSIM, corpus, rapports
├─ deploy/                    # docker-compose.yml, Caddyfile, nginx alternative, .env.example
├─ docs/                      # ce dossier
├─ .github/                   # workflows, modèles d'issues/PR
├─ CLAUDE.md
├─ README.md
└─ LICENSE
```

## 4. Le moteur `@whatmedia/core`

API publique (stable à partir de la v1.0) :

```ts
export interface MediaInfo {
  kind: 'video' | 'image';
  container: string;          // 'mp4' | 'mov' | 'jpeg' | 'heic' ...
  durationSec?: number;
  width: number; height: number;   // après rotation
  rotation: 0 | 90 | 180 | 270;
  fps?: number;
  videoCodec?: string;        // 'hvc1' | 'avc1' ...
  audioCodec?: string;        // 'mp4a.40.2' ...
  hdr: 'none' | 'hlg' | 'pq' | 'dolby-vision';
  sizeBytes: number;
}

export interface Plan {
  preset: PresetId;
  engine: 'webcodecs' | 'ffmpeg-wasm' | 'server';
  segments: { startSec: number; endSec: number; targetBytes: number }[];
  video?: { width: number; height: number; fps: number; bitrate: number; codec: string; toneMap: boolean };
  audio?: { mode: 'passthrough' | 'encode'; bitrate?: number };
  image?: { width: number; height: number; quality: number };
}

export function probe(file: File | Blob): Promise<MediaInfo>;
export function detectCapabilities(): Promise<Capabilities>;
export function plan(info: MediaInfo, preset: PresetId, caps: Capabilities, overrides?: Partial<PlanOverrides>): Plan;
export function run(file: File, plan: Plan, opts: { signal?: AbortSignal; onProgress?: (p: Progress) => void }): Promise<OutputFile[]>;
```

Principes :
- **Pur et testable** : `plan()` est une fonction pure, testée exhaustivement (aucune dépendance navigateur).
- **Moteurs interchangeables** : même interface `Engine.run(file, plan)`.
- **Config unique** : `packages/config/presets.json` est lu par le client ET par l'API serveur (qui en dérive les commandes ffmpeg). Pas de duplication de paramètres.

## 5. Sélection du moteur

```
detectCapabilities()
  ├─ VideoDecoder.isConfigSupported(codec source) ?
  ├─ VideoEncoder.isConfigSupported(avc1 cible, résolution, débit) ?
  └─ HDR source → tone-mapping possible en local ? (voir 03 §5)

si tout OK                → 'webcodecs'
sinon si wasm possible    → 'ffmpeg-wasm' (avertir : plus lent)
sinon si serveur activé   → proposer 'server' (consentement)
sinon                     → message d'erreur clair + conseils
```

## 6. Données et stockage côté client

- **OPFS** (Origin Private File System) pour les fichiers intermédiaires et les segments : évite de garder des centaines de Mo en RAM (crucial sur iOS).
- Nettoyage de l'OPFS au démarrage de l'app et après partage/enregistrement.
- **localStorage** (dans try/catch) uniquement pour : langue, dernier preset, bandeau d'installation déjà vu.
- Aucune autre persistance.

## 7. Déploiement (résumé)

Trois services Docker derrière Caddy : `web` (fichiers statiques landing + app), `api` (optionnel, profil Compose `api`), `caddy`. Détails complets : `06-DEPLOIEMENT.md`.

## 8. En-têtes HTTP importants

| Chemin | En-tête | Raison |
|---|---|---|
| `/app/*` | `Cross-Origin-Opener-Policy: same-origin` et `Cross-Origin-Embedder-Policy: require-corp` | Nécessaires **seulement** si ffmpeg.wasm multi-thread (SharedArrayBuffer). À activer uniquement si le spike S3 le justifie. |
| `/app/sw.js` | `Cache-Control: no-cache` | Mises à jour du service worker |
| `/app/assets/*` | `Cache-Control: public, max-age=31536000, immutable` | Fichiers hashés |
| tous | CSP, `Referrer-Policy`, `Permissions-Policy` | Voir `07-SECURITE-VIE-PRIVEE.md` |

## 9. Décisions d'architecture (ADR)

Les décisions se notent dans `docs/adr/NNNN-titre.md` (format : Contexte / Décision / Conséquences). ADR initiales à créer :
- 0001 — Monorepo pnpm + Turborepo
- 0002 — Local-first avec WebCodecs, serveur uniquement en secours consenti
- 0003 — Presets dans un JSON partagé client/serveur
- 0004 — Licence MIT
