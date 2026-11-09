# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versions : [SemVer](https://semver.org/lang/fr/)

## [1.0.0] - 2026-11-09

### Ajouté
- **Moteur local WebCodecs** (`@whatmedia/core`) : transcodage matériel AVC/H.264 et remuxage MP4 in-browser sans transfert réseau.
- **Support des photos calibrées** : recadrage et redimensionnement non destructif sans étirement, respect de l'orientation EXIF, nettoyage des métadonnées privées et sortie JPEG sRGB.
- **Détection HDR & Conversion BT.709** : détection HLG, PQ et Dolby Vision, tone-mapping pour éliminer le délavage de WhatsApp.
- **PWA React 19 installable** (`apps/app`) : hors-ligne, manifest standalone, icônes adaptatives, bandeau d'installation iOS, sélecteur de presets, découpage intelligent multi-segments, partage natif via Web Share API (`navigator.share`).
- **Serveur de secours Fastify 5** (`apps/api`) : transcodage distant sécurisé avec ffmpeg sous Docker durci (Alpine non-root), consentement utilisateur explicite, purge automatique sous 15 minutes, rate limiting.
- **Landing Page Astro 5** (`apps/web`) : design moderne Tailwind CSS 4, polices auto-hébergées, bilingue FR/EN, comparateur interactif avant/après.
- **Banc d'essai scientifique VMAF / SSIM** (`tools/quality`) : évaluation réelle image par image avec Netflix libvmaf, scores certifiés publiés sur `/mesures` et `/en/measurements`.
- **Infrastructure Docker & Nginx** : stack Caddy + Fastify multi-stage déployée sur `https://whatmedia.nealix.org`.
