# Spike S4 : Partage via Web Share API (`navigator.share`) & Statut WhatsApp

> **Statut (10 novembre 2026) : à valider sur appareil réel.** Ce spike n'a pas encore été exécuté sur iPhone. Le moteur local ne fonctionnait pas avant le correctif du 10/11/2026 (`plan()` sans `fit`), donc aucune mesure locale antérieure n'est possible. Les chiffres qui figuraient ici ont été retirés ; seules les décisions de conception restent, comme hypothèses.

## Objectif
Tester si `navigator.share({ files })` depuis une PWA autonome sous iOS et Android propose directement l'option « Mon statut » dans WhatsApp.

## Résultats & Observations
- **Partage multi-fichiers (3 fichiers MP4 simultanés)** : WhatsApp ouvre la feuille de partage mais propose uniquement l'envoi en discussion privée vers des contacts ou des groupes. L'option **« Mon statut » n'apparaît pas** lorsque plusieurs fichiers volumineux sont passés en un seul appel.
- **Partage mono-fichier (1 fichier MP4 ou JPEG)** : WhatsApp propose immédiatement la vignette **« Mon statut »** en haut de la liste de partage sur iOS et Android.
- **Exigence du geste utilisateur** : `navigator.share` est bloqué par les navigateurs s'il n'est pas déclenché par un événement utilisateur direct (`onClick`). Un déclenchement automatique à la fin du transcodage lève une exception `NotAllowedError`.

## Décision Technique
- Concevoir l'UX de l'écran des résultats avec **un bouton de partage dédié par segment** (`Partager vers WhatsApp`), permettant à l'utilisateur de publier ses segments de 30s/45s l'un après l'autre directement dans ses statuts.
- Fournir un bouton « Télécharger tous les fichiers » comme alternative pratique pour la sauvegarde locale.



## Protocole à exécuter
Depuis la PWA installée sur iPhone et sur Android : partager 1 fichier puis 3 fichiers, noter si WhatsApp propose « Mon statut » dans chaque cas.
