# ADR 0004: Serveur de Secours Durci Fastify 5 & Ffmpeg

## Statut
Accepté & Implémenté

## Contexte
Certains appareils anciens ou navigateurs restreints ne disposent pas de l'API WebCodecs ou de l'encodeur matériel AVC. Afin de ne laisser aucun utilisateur bloqué, un serveur de traitement distant optionnel est nécessaire.

## Décision
1. **Consentement explicite obligatoire** : L'API rejette avec HTTP 400 toute requête ne fournissant pas explicitement `consent: "true"`.
2. **Conteneur Docker Alpine durci** : Exécution sous l'utilisateur non-root `node:node`, volume `/data/jobs` dédié et isolé.
3. **Purge automatique éphémère** : Un cron applicatif supprime automatiquement tout fichier source ou encodé après 15 minutes. Le client ordonne également une suppression immédiate (`DELETE /jobs/:jobId`) dès le téléchargement terminé.
4. **Rate-limiting & protection DoS** : Limite stricte de créations de jobs par IP et taille de fichier plafonnée à 1 Go avec stream direct vers disque sans saturation RAM.

## Conséquences
- Zéro stockage permanent de données privées sur le serveur.
- Infrastructure résiliente face aux abus ou aux pics de charge.
- Respect rigoureux du RGPD et des standards de sécurité.

