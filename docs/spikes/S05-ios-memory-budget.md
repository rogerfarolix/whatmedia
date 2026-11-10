# Spike S5 : Budget Mémoire & Prévention des Crashs Safari iOS

> **Statut (10 novembre 2026) : à valider sur appareil réel.** Ce spike n'a pas encore été exécuté sur iPhone. Le moteur local ne fonctionnait pas avant le correctif du 10/11/2026 (`plan()` sans `fit`), donc aucune mesure locale antérieure n'est possible. Les chiffres qui figuraient ici ont été retirés ; seules les décisions de conception restent, comme hypothèses.

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
- *(mesure retirée : non vérifiée sur appareil réel)*



## Protocole à exécuter
Vidéo 4K de 3 min sur iPhone 12/13 : traitement complet en « Statut HD », noter si l'onglet est rechargé, et le pic mémoire (Safari > Développement > Chronologies) depuis un Mac.
