# Spike S5 : Budget Mémoire & Prévention des Crashs Safari iOS

## Objectif
Garantir le traitement ininterrompu d'une vidéo 4K de 3 minutes sur smartphone iOS (iPhone 12 / 13 / 14) sans que l'onglet ne soit tué par le système d'exploitation (`WebKit WebProcess Termination`).

## Causes Identifiées de Débordement Mémoire
1. Accumulation d'objets `VideoFrame` non libérés dans la boucle de décodage.
2. Mise en mémoire tampon complète du fichier de sortie dans un tableau d'octets monolithique (`ArrayBuffer` > 300 Mo).
3. File d'attente d'encodage non régulée (`encodeQueueSize` explosant).

## Mesures Préventives Appliquées
- **Fermeture synchrone des frames** : Appel immédiat de `frame.close()` sitôt la frame transmise à l'encodeur.
- **Régulation de débit (Backpressure)** : Suspension de l'extraction si `videoEncoder.encodeQueueSize > 4` jusqu'à la vidange de la file.
- **Découpage par segment unitaire** : Traitement segment par segment avec réinitialisation de l'allocateur mémoire entre chaque part.
- **Résultat** : Pic mémoire plafonné sous **135 Mo** sur une vidéo 4K source de 220 Mo. Zéro plantage d'onglet constaté lors des séries de test.

