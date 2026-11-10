# Spike S1 : Entrée iOS `<input type="file">` & Mediabunny

## Objectif
Valider le comportement d'un iPhone réel (iOS 17+) lors de la sélection d'une vidéo HEVC / HDR via `<input type="file" accept="video/*,image/*">` et vérifier si la bibliothèque **Mediabunny** parvient à demuxer le conteneur QuickTime MOV / MP4 sans perte de flux.

## Méthodologie
1. Test de sélection sur Safari iOS avec une vidéo 4K HDR tournée avec l'appareil photo iPhone.
2. Vérification des propriétés transmises à l'objet `File` (`file.name`, `file.type`, `file.size`).
3. Analyse du décodage via `Input` et `Conversion` de Mediabunny.

## Résultats & Observations
- Sur iOS Safari, `<input type="file">` fournit directement le fichier original `.mov` sans transcodage préalable par le système si l'attribut `accept` est ciblé.
- Le flux vidéo contient les codecs `hvc1` (HEVC) avec métadonnées de transfert `arib-std-b67` (HLG) ou Dolby Vision 8.4.
- Mediabunny lit avec succès les pistes vidéo et audio du conteneur Apple MOV.
- Les dimensions réelles doivent être récupérées via `.displayWidth` et `.displayHeight` de la piste vidéo pour prendre en compte l'éventuelle rotation EXIF/QuickTime Matrix.

## Décision Technique
- Conserver Mediabunny comme demuxer et muxer MP4 officiel pour le pipeline client.
- Détecter la rotation native et appliquer l'orientation correcte lors de la phase de planification.

