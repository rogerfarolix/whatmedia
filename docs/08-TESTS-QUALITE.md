# 08 — Tests et mesure de la qualité

## 1. Pyramide de tests

| Niveau | Outil | Couverture |
|---|---|---|
| Unitaires | Vitest | `plan()`, calcul de débit, découpage, détection HDR à partir de métadonnées, schémas Zod — **objectif 95 % sur `packages/core/src/plan.ts`** |
| Intégration navigateur | Vitest browser mode / Playwright | Pipeline complet sur clips de test (Chromium + WebKit) : sortie lisible, durée, taille < budget, tags couleur BT.709 |
| API | Vitest + `fastify.inject` | Validation, 413/415/429, consentement obligatoire, suppression, purge |
| E2E | Playwright | Parcours complet `/app` (WebKit mobile émulé iPhone + Chromium Android émulé), mode hors ligne, partage mocké |
| Appareil réel | Checklist manuelle | iPhone (iOS 17, 18, 26), Android milieu de gamme |
| Performance | Lighthouse CI | Landing ≥ 95 ; budget JS `/app` |
| Accessibilité | axe-core dans Playwright | 0 violation sérieuse |

## 2. Corpus de test (`tools/quality/corpus/`)

Clips libres de droits ou tournés par l'équipe (jamais de contenu tiers protégé) :
- `iphone-hdr-4k60-hevc.mov` (HLG + Dolby Vision)
- `iphone-sdr-1080p30-h264.mp4`
- `android-1080p30-h264.mp4`
- `screen-recording.mp4`
- `low-light-noisy.mp4` (bruit = cas difficile)
- `fast-motion-sport.mp4`
- `talking-head-vertical.mp4`
- `long-3min.mp4`
- `rotated-90.mov`
- photos : `heic-portrait.heic`, `jpeg-12mp.jpg`, `png-screenshot.png`

Les fichiers lourds sont stockés via Git LFS ou en asset de release ; le dépôt contient un `corpus.json` (nom, URL, sha256, licence).

## 3. Protocole de mesure WhatsApp (la preuve)

But : savoir ce que WhatsApp fait **réellement** et calibrer les presets.

1. Pour chaque clip du corpus et chaque variante (A = fichier brut, B = chaque preset WhatMedia) :
2. Publier en statut depuis un iPhone de test (compte dédié), réglage « Qualité de chargement : HD » activé et désactivé.
3. Récupérer le fichier tel que diffusé : depuis un second compte de test qui voit le statut (enregistrement du média reçu), ou via WhatsApp Web (fichier média reçu). Documenter la méthode exacte utilisée dans le rapport.
4. Calculer avec ffmpeg (`libvmaf`) contre l'**original** :
```bash
ffmpeg -i received.mp4 -i original_sdr_ref.mp4 \
  -lavfi "[0:v]scale=1080:1920:flags=bicubic,setpts=PTS-STARTPTS[d];[1:v]scale=1080:1920:flags=bicubic,setpts=PTS-STARTPTS[r];[d][r]libvmaf=model=version=vmaf_v0.6.1:log_fmt=json:log_path=vmaf.json:n_threads=4" -f null -
```
   + SSIM, résolution reçue, débit reçu, i/s reçu.
5. Pour les sources HDR, la référence est une version SDR de l'original produite par la chaîne de référence serveur (`03 §5`).
6. Agréger dans `packages/config/measurements.json` :
```json
{
  "campaign": "2026-11",
  "whatsappVersion": { "ios": "x.y.z" },
  "results": [
    { "clip": "iphone-hdr-4k60-hevc", "variant": "raw", "uploadHd": true, "vmaf": 0, "ssim": 0, "receivedRes": "720x1280", "receivedKbps": 0 },
    { "clip": "iphone-hdr-4k60-hevc", "variant": "status-hd", "uploadHd": true, "vmaf": 0, "ssim": 0, "receivedRes": "", "receivedKbps": 0 }
  ]
}
```
7. Décision : un preset n'est conservé que s'il améliore le VMAF médian **et** n'est jamais pire de plus de 2 points sur un clip. On cherche aussi le « point fixe » : le format que WhatsApp ne réencode plus (débit reçu ≈ débit envoyé).
8. Rejouer la campagne à chaque mise à jour majeure de WhatsApp (tâche mensuelle dans la roadmap) ; la page `/mesures` affiche la date.

> Les scores du tableau d'exemple ci-dessus sont des zéros volontaires : **aucun chiffre n'est publié avant d'être mesuré.**

## 4. Checklist appareil réel (avant chaque release)

- [ ] Installation PWA iOS : icône, nom « WhatMedia », écran de lancement, pas de barre Safari
- [ ] Vidéo HDR 4K 60 i/s de 2 min → 2 à 4 segments, couleurs correctes, partage → WhatsApp → Mon statut OK
- [ ] Verrouillage de l'écran en plein traitement → reprise propre
- [ ] Mode avion après installation → l'app s'ouvre et traite en local
- [ ] Photo HEIC → JPEG correcte, orientation correcte
- [ ] Fichier non pris en charge → message clair + proposition serveur
- [ ] VoiceOver : parcours complet possible
