# ADR 0002: Moteur Média Local via WebCodecs & Mediabunny

## Statut
Accepté & Implémenté

## Contexte
Le transcodage vidéo sur smartphone nécessite de traiter des fichiers vidéo 1080p ou 4K sans faire planter la mémoire de l'onglet Safari / Chrome (souvent limitée à 300-500 Mo sur mobile). L'utilisation exclusive de ffmpeg.wasm en mode software est trop lente sur mobile et consomme trop de batterie/RAM.

## Décision
1. Utiliser **WebCodecs** (`VideoDecoder`, `VideoEncoder`, `AudioEncoder`) pour exploiter l'accélération matérielle native (GPU/SoC) du smartphone.
2. Utiliser **Mediabunny** pour le demuxing MP4/MOV et le remuxing MP4 direct avec `fastStart: 'in-memory'`.
3. Traiter le flux vidéo frame par frame en fermant systématiquement les instances `VideoFrame` (`frame.close()`) pour maintenir un pic mémoire bas (< 150 Mo).
4. Découper intelligemment en segments de 30s ou 45s en évitant les segments résiduels orphelins de moins de 5 secondes.

## Conséquences
- Vitesse de transcodage de 2x à 8x le temps réel sur smartphone récent.
- Aucune bande passante mobile consommée pour l'envoi de fichiers volumineux.
- Zéro coût de serveur pour 95%+ des utilisateurs.
- Repli gracieux sur le serveur de secours en cas d'incompatibilité matérielle.

