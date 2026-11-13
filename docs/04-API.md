# 04 — API du serveur de secours

Le serveur est **optionnel**. Si `WHATMEDIA_API_ENABLED=false`, l'app masque l'option serveur et tout reste local.

Base : `https://whatmedia.nealix.org/api/v1`

## 1. Principes
- Aucun compte. Chaque tâche reçoit un **jeton secret** (`jobToken`, 32 octets aléatoires, base64url) renvoyé une seule fois, exigé pour lire ou supprimer la tâche.
- Fichiers stockés sur un volume temporaire (`/data/jobs/<jobId>/`), **supprimés au plus tard 15 minutes** après la fin du traitement, et immédiatement à la demande.
- Aucun journal ne contient de nom de fichier ni de contenu ; seulement jobId, taille, durée, preset, statut, durée de traitement.

## 2. Endpoints

### `GET /api/v1/health`
`200 { "status": "ok", "version": "1.0.0", "ffmpeg": "7.x", "queue": { "running": 1, "waiting": 0 } }`

### `GET /api/v1/config`
Renvoie presets et limites (les mêmes JSON que `packages/config`) + `maxUploadBytes`, `retentionMinutes`.

### `POST /api/v1/jobs`
`multipart/form-data` :
| Champ | Type | Obligatoire |
|---|---|---|
| `file` | binaire | oui (≤ `MAX_UPLOAD_BYTES`, défaut 1 Go) |
| `preset` | `status-hd` \| `status-light` \| `chat-hd` \| `status-photo` | oui |
| `segmentSec` | 30 \| 60 \| 90 | non |
| `consent` | `"true"` | **oui** — refus `400` sinon |

Réponse `202` :
```json
{ "jobId": "j_8f3k2...", "jobToken": "Zq9...", "status": "queued", "expiresAt": "2026-11-09T12:30:00Z" }
```
Erreurs : `400` (validation), `413` (trop gros), `415` (type refusé après détection par signature binaire, pas par extension), `429` (limite de débit), `503` (file pleine).

### `GET /api/v1/jobs/:jobId`
En-tête `Authorization: Bearer <jobToken>`.
```json
{
  "jobId": "j_8f3k2...",
  "status": "queued | processing | done | failed",
  "progress": 0.42,
  "outputs": [
    { "index": 1, "of": 3, "url": "/api/v1/jobs/j_8f3k2.../files/1", "bytes": 15123456, "durationSec": 60 }
  ],
  "error": null
}
```
Le client interroge toutes les 1,5 s (ou utilise `GET /api/v1/jobs/:jobId/events` en Server-Sent Events).

### `GET /api/v1/jobs/:jobId/files/:index`
Bearer requis. `Content-Type: video/mp4` ou `image/jpeg`, `Content-Disposition: attachment`.

### `DELETE /api/v1/jobs/:jobId`
Bearer requis. `204`. Supprime tout immédiatement. Le client l'appelle dès que les fichiers sont récupérés.

## 3. Limites et protection

| Paramètre (variable d'env.) | Défaut |
|---|---|
| `MAX_UPLOAD_BYTES` | 1 073 741 824 |
| `MAX_DURATION_SEC` | 600 |
| `CONCURRENCY` | nombre de cœurs / 2 |
| `QUEUE_MAX` | 20 |
| `RATE_LIMIT` | 10 tâches / heure / IP |
| `RETENTION_MINUTES` | 15 |
| `FFMPEG_TIMEOUT_SEC` | 900 |

- ffmpeg lancé avec `spawn` (jamais `exec` ni shell), arguments construits depuis une liste blanche issue de `presets.json`. Aucune valeur utilisateur brute dans les arguments.
- Validation de l'entrée avec `ffprobe` avant traitement (durée, flux, codecs connus).
- Conteneur non-root, système de fichiers en lecture seule sauf `/data`, limites CPU/mémoire Docker.

## 4. Schémas (Zod, partagés)
Les schémas de requête/réponse vivent dans `packages/core/src/api-schema.ts` et sont utilisés par l'API (validation) et par l'app (typage du client).

## 5. OpenAPI
Générer `apps/api/openapi.json` via `@fastify/swagger` ; publier la doc sur `/api/docs` en développement seulement.

## 6. Compteur anonyme d'utilisation

Aucun identifiant, aucune adresse IP, aucun nom de fichier n'est enregistré : seulement des totaux par jour, dans `STATS_FILE` (volume `stats_data`). Ces routes ne sont pas journalisées.

| Route | Rôle |
|---|---|
| `POST /api/v1/stats/event` | Corps `{ "kind": "video" ou "photo", "parts": 1 à 60 }`, réponse `204`. Envoyé par l'app après chaque fichier préparé, sauf si l'utilisateur a désactivé le comptage. Limite : 120 par heure et par adresse. |
| `GET /api/v1/stats` | `{ since, public, threshold, totals: { files, videos, photos, parts }, months: [{ month, files, parts }] }`. `public` est faux tant que `totals.files` est sous `STATS_PUBLIC_THRESHOLD` (100 par défaut) : le site masque alors les chiffres. |
| `GET /api/v1/stats/badge` | Format [Shields endpoint](https://shields.io/badges/endpoint-badge) pour le badge du README (`?lang=en` pour l'anglais). |
