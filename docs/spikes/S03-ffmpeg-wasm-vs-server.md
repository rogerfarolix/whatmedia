# Spike S3 : Ffmpeg.wasm sur Mobile vs Serveur de Secours

> **Statut (10 novembre 2026) : à valider sur appareil réel.** Ce spike n'a pas encore été exécuté sur iPhone. Le moteur local ne fonctionnait pas avant le correctif du 10/11/2026 (`plan()` sans `fit`), donc aucune mesure locale antérieure n'est possible. Les chiffres qui figuraient ici ont été retirés ; seules les décisions de conception restent, comme hypothèses.

## Objectif
Évaluer la viabilité d'embarquer `ffmpeg.wasm` sur smartphone comme solution de repli local face à un serveur distant léger.

## Hypothèses (vidéo 30 s 1080p, non mesurées)
- *(mesure retirée : non vérifiée sur appareil réel)*
- **Ffmpeg.wasm (multi-thread avec SharedArrayBuffer)** : Nécessite les en-têtes HTTP restrictifs `Cross-Origin-Opener-Policy: same-origin` et `Cross-Origin-Embedder-Policy: require-corp` (COOP/COEP), qui bloquent le chargement fluide de médias tiers et compliquent l'installation PWA.
- *(mesure retirée : non vérifiée sur appareil réel)*

## Décision Technique
- Ne pas alourdir le bundle PWA initial avec 30 Mo de binaire WebAssembly peu performant sur mobile.
- *(mesure retirée : non vérifiée sur appareil réel)*
- Adopter l'API serveur Fastify 5 comme repli transparent et ultra-rapide lorsque WebCodecs n'est pas supporté par le terminal.



## Protocole à exécuter
Mesurer, pour une vidéo 1080p de 30 s : durée du traitement serveur (journal `job finished`, champ `ms`) et, si ffmpeg.wasm est un jour réévalué, durée sur iPhone 13.
