# 07 — Sécurité et vie privée

## 1. Principe : privacy by design
1. **Local par défaut** : en mode normal, aucun octet de média ne quitte l'appareil. Vérifiable dans le code et dans l'onglet Réseau.
2. **Consentement explicite** pour le serveur, à chaque fichier.
3. **Minimisation** : pas de compte, pas de cookie, pas d'identifiant persistant, pas de traceur tiers, polices et scripts auto-hébergés.
4. **Durée de conservation** côté serveur : 15 minutes maximum, suppression immédiate possible.

## 2. Statistiques (optionnelles)
- Par défaut : **aucune**.
- Si activées (`ANALYTICS=umami|plausible`, auto-hébergé) : uniquement des événements agrégés sans identifiant (`app_opened`, `processing_done{preset, engine}`, `share_clicked`). Jamais de nom de fichier, de durée exacte ni de métadonnées média.

## 3. En-têtes HTTP (tous les chemins)

```
Content-Security-Policy: default-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Resource-Policy: same-origin
```
`'wasm-unsafe-eval'` est nécessaire pour ffmpeg.wasm ; à retirer si le repli wasm n'est pas embarqué.

## 4. Serveur de secours — menaces et mesures

| Menace | Mesure |
|---|---|
| Fichier malveillant visant ffmpeg | ffprobe préalable, liste blanche de conteneurs/codecs, ffmpeg à jour, conteneur non-root, `no-new-privileges`, `read_only`, `cap_drop: ALL`, limites CPU/mémoire, timeout |
| Injection de commande | `spawn` avec tableau d'arguments, aucune valeur utilisateur brute |
| Déni de service | Limite de taille et de durée, rate limit par IP, file bornée, 503 si saturé |
| Accès aux fichiers d'autrui | jobId + jobToken aléatoires (256 bits), comparaison en temps constant |
| Fuite par les logs | Aucun nom de fichier, aucune IP stockée au-delà du rate limit en mémoire |
| Remplissage disque | Volume dédié avec quota, purge chaque minute, refus si espace < seuil |

## 5. Chaîne d'approvisionnement (open source)
- Dependabot (npm, Docker, Actions), `pnpm audit` en CI.
- Actions GitHub épinglées par SHA.
- Images signées (cosign) et SBOM (Syft) publiés à chaque release — objectif v1.0.
- `SECURITY.md` : signalement privé via GitHub Security Advisories.

## 6. Conformité
- Politique de confidentialité claire (`/confidentialite`) : traitement local, cas du serveur, durée, droits.
- Pertinent : loi béninoise sur le numérique (Code du numérique, protection des données — APDP) et RGPD pour les utilisateurs européens. Le traitement local et l'absence de données personnelles stockées simplifient fortement la conformité. **À faire relire par un juriste avant le lancement public.**
- Marques : avertissement de non-affiliation à WhatsApp/Meta sur chaque page, pas de logo ni de charte WhatsApp. Le nom « WhatMedia » ressemble à « WhatsApp » : faire une vérification de marque avant le lancement, et garder un nom de repli prêt (voir `09 §Risques`).
