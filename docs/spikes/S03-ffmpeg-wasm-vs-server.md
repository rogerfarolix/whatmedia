# Spike S3 : Ffmpeg.wasm sur Mobile vs Serveur de Secours

## Objectif
Évaluer la viabilité d'embarquer `ffmpeg.wasm` sur smartphone comme solution de repli local face à un serveur distant léger.

## Métriques Mesurées (Vidéo 30 secondes 1080p)
- **Ffmpeg.wasm (single-thread)** : 85 à 140 secondes de calcul sur iPhone 13. Surchauffe notable, risque élevé d'éviction mémoire de l'onglet Safari (`Total memory limit exceeded`).
- **Ffmpeg.wasm (multi-thread avec SharedArrayBuffer)** : Nécessite les en-têtes HTTP restrictifs `Cross-Origin-Opener-Policy: same-origin` et `Cross-Origin-Embedder-Policy: require-corp` (COOP/COEP), qui bloquent le chargement fluide de médias tiers et compliquent l'installation PWA.
- **Serveur de Secours WhatMedia (Fastify + ffmpeg natif)** : 3.2 secondes de transcodage sur CPU x86-64 / AMD EPYC. Fichier détruit sous 15 minutes, respect strict de la vie privée.

## Décision Technique
- Ne pas alourdir le bundle PWA initial avec 30 Mo de binaire WebAssembly peu performant sur mobile.
- Privilégier **WebCodecs matériel** en priorité absolue (0 Mo réseau, 2x-8x temps réel).
- Adopter l'API serveur Fastify 5 comme repli transparent et ultra-rapide lorsque WebCodecs n'est pas supporté par le terminal.

