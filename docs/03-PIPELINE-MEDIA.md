# 03 — Pipeline média (spécification détaillée)

C'est le cœur du projet. Toute valeur numérique de ce document est une **hypothèse de départ** : elle devient définitive seulement après validation par le protocole de `08-TESTS-QUALITE.md`. Les valeurs vivent dans `packages/config/*.json`, jamais en dur dans le code.

## 1. Ce que l'on sait (et ce que l'on ne sait pas) de WhatsApp

| Point | Connaissance | Source / statut |
|---|---|---|
| Taille max d'une vidéo envoyée en média | 16 Mo (historique, largement documenté) | À revérifier à chaque mesure |
| Durée max d'un statut vidéo | A évolué : 30 s → 60 s → jusqu'à 90 s selon les versions | **Variable** → configurable |
| Option « HD » pour statuts | Déployée progressivement | Dépend de la version de l'app |
| Réglage « Qualité de chargement : HD » | Réglages → Stockage et données | Conseillé à l'utilisateur |
| Algorithme exact de réencodage | **Inconnu, non documenté** | Mesuré empiriquement |

Fichier `packages/config/whatsapp-limits.json` (valeurs initiales) :

```json
{
  "$comment": "Hypothèses — à remesurer. Mettre à jour 'measuredAt' à chaque campagne.",
  "measuredAt": null,
  "maxStatusVideoSec": 60,
  "allowedStatusVideoSec": [30, 60, 90],
  "maxMediaBytes": 16000000,
  "safetyMarginBytes": 500000
}
```

## 2. Détection des capacités

Au démarrage du worker :

```ts
const caps = {
  webcodecs: 'VideoEncoder' in self && 'VideoDecoder' in self,
  decode: { hevc: await supportsDecode('hvc1.2.4.L153.B0'), avc: await supportsDecode('avc1.640028') },
  encode: {
    avc1080: await supportsEncode({ codec: 'avc1.640028', width: 1080, height: 1920, bitrate: 5_000_000, framerate: 30 }),
    avc720:  await supportsEncode({ codec: 'avc1.64001f', width: 720, height: 1280, bitrate: 2_500_000, framerate: 30 }),
    aac:     'AudioEncoder' in self && (await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 })).supported,
  },
  opfs: !!navigator.storage?.getDirectory,
  share: !!navigator.canShare?.({ files: [new File([], 'x.mp4', { type: 'video/mp4' })] }),
  wasm: typeof WebAssembly === 'object',
  sab: typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated,
};
```

Tout appel doit être dans un `try/catch` : certaines implémentations lèvent une exception au lieu de renvoyer `supported: false`.

## 3. Étapes du pipeline vidéo

```
1. probe        demux (Mediabunny) → MediaInfo, détection HDR (couleur primaries/transfer, boîtes dvcC/dvvC)
2. plan         preset + limites + capacités → Plan (segments, débit, filtres)
3. pour chaque segment :
   a. decode    VideoDecoder (frames du segment, seek sur keyframe précédente)
   b. transform rotation appliquée, scale vers cible (OffscreenCanvas / VideoFrame), tone-map si HDR
   c. encode    VideoEncoder H.264 High, débit calculé, keyframe toutes les 2 s
   d. audio     passthrough AAC si source AAC (cas iPhone) ; sinon AudioEncoder ; sinon ffmpeg.wasm
   e. mux       MP4, moov en tête (fast start), écrit dans l'OPFS
4. output       File[] nommés `whatmedia-<date>-<n>of<N>.mp4`
```

### 3.1 Découpage en segments

- Durée de segment `S` = choix utilisateur (défaut `maxStatusVideoSec`).
- Nombre de segments `N = ceil(durée / S)`.
- Équilibrage : si le dernier segment fait moins de 5 s, répartir la durée totale en `N` segments égaux (évite un segment final de 2 s).
- Les coupes se font aux frontières exactes (réencodage → pas de contrainte de keyframe source).

### 3.2 Calcul du débit

```
budgetBytes = maxMediaBytes - safetyMarginBytes
audioBps    = 128_000 (ou débit source si passthrough)
maxVideoBps = (budgetBytes * 8) / dureeSegmentSec - audioBps - overheadBps(≈ 1 %)
videoBps    = min(preset.targetVideoBps, maxVideoBps)
si videoBps < preset.minVideoBps → descendre au preset inférieur en résolution (1080 → 720) et le signaler
```

Exemple : segment de 60 s, budget 15,5 Mo → ≈ 2,07 Mbps max total → la vidéo 1080p sera plafonnée à ≈ 1,9 Mbps. C'est **pour cela** que des segments plus courts peuvent donner plus de netteté : le plan doit l'expliquer à l'utilisateur (« Segments de 30 s = image plus nette »).

## 4. Presets (hypothèses initiales)

`packages/config/presets.json` :

```json
{
  "status-hd": {
    "label": { "fr": "Statut HD", "en": "Status HD" },
    "kind": "video",
    "maxWidth": 1080, "maxHeight": 1920,
    "fps": 30,
    "codec": "avc1.640028",
    "targetVideoBps": 5000000,
    "minVideoBps": 1500000,
    "fallbackPreset": "status-light",
    "keyframeIntervalSec": 2,
    "audio": { "preferPassthrough": true, "bitrate": 128000 },
    "colour": "bt709-sdr"
  },
  "status-light": {
    "label": { "fr": "Statut léger", "en": "Status light" },
    "kind": "video",
    "maxWidth": 720, "maxHeight": 1280,
    "fps": 30,
    "codec": "avc1.64001f",
    "targetVideoBps": 2500000,
    "minVideoBps": 800000,
    "keyframeIntervalSec": 2,
    "audio": { "preferPassthrough": true, "bitrate": 96000 },
    "colour": "bt709-sdr"
  },
  "chat-hd": {
    "label": { "fr": "Discussion HD", "en": "Chat HD" },
    "kind": "video",
    "maxWidth": 1920, "maxHeight": 1920,
    "fps": 30,
    "codec": "avc1.640028",
    "targetVideoBps": 6000000,
    "minVideoBps": 1500000,
    "segmentSec": null,
    "audio": { "preferPassthrough": true, "bitrate": 128000 },
    "colour": "bt709-sdr"
  },
  "status-photo": {
    "label": { "fr": "Photo statut", "en": "Status photo" },
    "kind": "image",
    "maxWidth": 1440, "maxHeight": 2560,
    "format": "image/jpeg",
    "quality": 0.9,
    "colour": "srgb",
    "stripMetadata": true
  }
}
```

Règles :
- On **ne monte jamais** en résolution ni en i/s (pas d'upscale ; une source 24 i/s reste 24 i/s ; 60 → 30).
- Orientation : on respecte l'orientation de la source ; les presets « statut » ciblent le 9:16 vertical mais **ne recadrent pas** en v1 (recadrage = v1.x, opt-in).
- `colour: bt709-sdr` → sortie taguée `primaries=bt709, transfer=bt709, matrix=bt709, range=limited`.

## 5. HDR → SDR (point critique iPhone)

Les iPhone récents filment en HDR (HLG, souvent avec métadonnées Dolby Vision 8.4). Publiée telle quelle, la vidéo ressort délavée ou surexposée chez beaucoup de destinataires.

**Détection** : `transfer` = `arib-std-b67` (HLG) ou `smpte2084` (PQ), ou présence d'une configuration Dolby Vision.

**Conversion locale (à valider — spike S2)** :
1. Option A : peindre chaque `VideoFrame` dans un `OffscreenCanvas` 2D avec `colorSpace: 'srgb'` et vérifier si Safari applique un tone-mapping correct.
2. Option B : shader WebGL2/WebGPU avec courbe HLG → linéaire → tone-map (BT.2390 ou Hable) → gamma BT.709, en rec.2020 → rec.709 (matrice 3×3).
3. Le spike compare A, B et la référence serveur (ffmpeg `zscale` + `tonemap`) sur 10 clips iPhone, et mesure la différence de couleur (ΔE2000 moyen).

**Repli serveur (référence)** :
```
-vf "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
```
(nécessite ffmpeg compilé avec `libzimg`).

## 6. Commandes ffmpeg de référence (serveur et ffmpeg.wasm)

Statut HD, segment `i` de `S` secondes, débit `V` calculé :

```bash
ffmpeg -hide_banner -y -ss {start} -t {S} -i input \
  -map 0:v:0 -map 0:a:0? \
  -vf "scale='min(1080,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.0 -preset slow \
  -b:v {V} -maxrate {V*1.5} -bufsize {V*2} -g 60 -keyint_min 60 -sc_threshold 0 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -movflags +faststart -map_metadata -1 \
  out_{i}.mp4
```

Pour l'audio en passthrough : `-c:a copy` si la source est déjà en AAC.

## 7. Pipeline photo

1. Décodage : `createImageBitmap(file)` (gère HEIC sur Safari ; orientation via `imageOrientation: 'from-image'`).
2. Redimensionnement dans `OffscreenCanvas` (qualité `imageSmoothingQuality = 'high'`, ou réduction en paliers ×0,5 pour éviter le crénelage).
3. Encodage `canvas.convertToBlob({ type: 'image/jpeg', quality })`.
4. Sortie sans EXIF (le canvas n'en conserve pas) — orientation déjà appliquée.

## 8. Contraintes iOS à respecter absolument

| Contrainte | Conséquence pour le code |
|---|---|
| Mémoire limitée par onglet (l'onglet est tué sans prévenir) | Streamer frame par frame, `frame.close()` systématique, file d'encodage bornée (`encodeQueueSize < 8`), écrire dans l'OPFS au fil de l'eau |
| Mise en veille / arrière-plan suspend le JS | Sauvegarder l'avancement par segment terminé ; reprise au segment suivant |
| `navigator.share` exige un geste utilisateur | Un bouton par partage ; jamais de partage automatique après traitement |
| Le sélecteur Photos peut transcoder le fichier (« le plus compatible ») | Spike S1 : mesurer ce que reçoit réellement `<input type=file>` (codec, HDR conservé ?) et documenter |
| Pas de Web Share Target ni de `beforeinstallprompt` | Bandeau d'installation manuel ; pas de « Partager vers WhatMedia » depuis Photos en v1 |
| Quota de stockage, éviction possible | Nettoyer l'OPFS ; ne jamais compter sur une persistance longue |

## 9. Erreurs et messages

| Code | Cause | Message utilisateur (FR) |
|---|---|---|
| `E_UNSUPPORTED_CODEC` | Codec source non décodable en local | « Ton téléphone ne sait pas lire ce format ici. On peut le traiter sur le serveur WhatMedia (supprimé après 15 min). » |
| `E_MEMORY` | Onglet relancé pendant le traitement | « Le traitement a été interrompu. Essaie le preset Statut léger ou des segments de 30 s. » |
| `E_TOO_SHORT_BUDGET` | Débit sous le minimum même en 720p | « Ce segment est trop long pour rester net. Choisis des segments de 30 s. » |
| `E_SHARE_UNAVAILABLE` | Pas de Web Share fichiers | Téléchargement proposé automatiquement |
| `E_ABORTED` | Annulation | (silencieux) |
