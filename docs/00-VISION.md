# WhatMedia — Document de vision

> **Tes statuts WhatsApp, enfin nets.**
> Une application web open source, installable sur iPhone et Android, qui prépare photos et vidéos pour qu'elles résistent à la compression de WhatsApp — sans que tes fichiers quittent ton téléphone.

| | |
|---|---|
| **Produit** | WhatMedia |
| **URL** | https://whatmedia.nealix.org |
| **Porteur** | Roger Gnanih — écosystème Nealix |
| **Licence** | MIT (code) · CC BY 4.0 (documentation) |
| **Statut** | v0 — conception |
| **Version du document** | 1.0 — novembre 2026 |

---

## 1. Le problème

Chaque jour, des centaines de millions de personnes publient des statuts WhatsApp. Pour beaucoup — commerçants, créateurs, églises, artistes, entrepreneurs en Afrique de l'Ouest et ailleurs — **le statut WhatsApp est la principale vitrine**, bien avant Instagram ou TikTok.

Le problème est le même pour tout le monde : une vidéo nette dans la galerie devient floue, pixelisée, saccadée une fois publiée.

Les causes sont connues :

1. **WhatsApp réencode tout.** L'app réduit la résolution, le débit et parfois la cadence d'images pour économiser bande passante et stockage.
2. **Les fichiers d'origine sont mal adaptés.** Un iPhone filme par défaut en HEVC, souvent en HDR (Dolby Vision / HLG), parfois en 4K à 60 i/s. WhatsApp doit alors tout transformer d'un coup : c'est là que la qualité s'effondre (et que les couleurs HDR ressortent délavées).
3. **Les limites sont floues.** Durée maximale d'un statut, taille maximale, option « HD » : ces règles changent selon les versions et ne sont pas documentées officiellement.
4. **Les solutions existantes** sont des apps natives fermées, souvent avec publicité, jetons payants ou envoi des médias vers des serveurs tiers.

## 2. La solution

WhatMedia part d'un principe simple et honnête :

> **On ne peut pas désactiver la compression de WhatsApp. On peut lui donner un fichier qu'elle n'a presque plus besoin de toucher.**

Concrètement, en trois gestes :

1. **Choisir** une vidéo ou une photo.
2. **Optimiser** : WhatMedia la convertit au format que WhatsApp attend (H.264, SDR BT.709, 9:16, 30 i/s, débit calibré, < 16 Mo), corrige le HDR, et découpe les vidéos longues en segments à la bonne durée.
3. **Partager** : le menu de partage natif s'ouvre, on choisit WhatsApp → « Mon statut ». Fini.

Tout se passe **dans le navigateur, sur le téléphone**, grâce à WebCodecs. Un serveur de secours, optionnel et auto-hébergeable, prend le relais seulement pour les cas que l'appareil ne sait pas traiter — et seulement avec l'accord explicite de l'utilisateur.

## 3. Ce qui rend WhatMedia différent

| | Apps natives existantes | Compresseurs en ligne | **WhatMedia** |
|---|---|---|---|
| Installation | App Store / Play Store | Aucune | **PWA : un tap depuis le navigateur** |
| Confidentialité | Variable, souvent cloud | Fichiers envoyés à un serveur | **100 % local par défaut** |
| Spécialisé statut WhatsApp | Oui | Non | **Oui, presets mesurés** |
| Correction HDR iPhone | Rarement | Rarement | **Oui** |
| Découpage auto des longues vidéos | Parfois | Non | **Oui, segments numérotés** |
| Partage direct vers WhatsApp | Oui | Non (téléchargement) | **Oui (Web Share API)** |
| Open source / auditable | Non | Non | **Oui (MIT)** |
| Prix | Jetons, pub, abonnement | Pub | **Gratuit** |
| Hors ligne | Oui | Non | **Oui (service worker)** |

### Les quatre piliers d'innovation

1. **Local-first** — le traitement vidéo avec accélération matérielle (WebCodecs) se fait directement dans Safari et Chrome mobiles. Pas d'upload, pas d'attente réseau, aucune donnée exposée.
2. **Presets mesurés, pas supposés** — chaque preset est validé par un protocole de mesure objectif (VMAF/SSIM) sur le fichier *réellement publié* par WhatsApp (voir `08-TESTS-QUALITE.md`). Les résultats sont publiés dans le dépôt, ce qui fait de WhatMedia aussi une **référence ouverte** sur le comportement de WhatsApp.
3. **`@whatmedia/core`** — le moteur est une bibliothèque TypeScript indépendante, publiée sur npm, réutilisable par d'autres projets (bots, outils CMS, apps).
4. **Dégradation gracieuse** — WebCodecs → ffmpeg.wasm → serveur de secours : l'app choisit automatiquement la meilleure voie selon l'appareil, et le dit clairement.

## 4. Promesse et limites (honnêteté produit)

WhatMedia **promet** :
- une qualité visiblement meilleure que la publication directe d'un fichier brut, mesurée et publiée ;
- des couleurs correctes pour les vidéos HDR d'iPhone ;
- des vidéos longues publiables sans coupure arbitraire ;
- zéro collecte de médias.

WhatMedia **ne promet pas** :
- de « contourner » ou « désactiver » la compression de WhatsApp — c'est impossible, et nous le disons ;
- d'améliorer une vidéo au-delà de sa qualité d'origine ;
- une compatibilité éternelle : si WhatsApp change ses règles, les presets sont remesurés et mis à jour (c'est prévu dans la roadmap).

Cette honnêteté est un argument : c'est ce qui distingue WhatMedia des apps qui annoncent du « 4K sur statut ».

## 5. Pour qui

| Persona | Besoin | Ce que WhatMedia change |
|---|---|---|
| **Aïcha, vendeuse de tissus à Cotonou** | Montrer ses pagnes en vidéo chaque matin | Les motifs et couleurs restent nets → plus de commandes |
| **Kevin, vidéaste événementiel** | Publier des extraits de mariage en qualité pro | Couleurs HDR corrigées, clips de 2 min découpés automatiquement |
| **Paroisse / association** | Diffuser des annonces vidéo | Gratuit, sans compte, sans pub |
| **Développeur** | Intégrer l'optimisation dans son bot ou son CMS | `@whatmedia/core` sur npm, API auto-hébergeable |

## 6. Positionnement et marque

- **Nom** : WhatMedia — « ce dont ton média a besoin ».
- **Ton** : direct, chaleureux, technique quand il le faut. Bilingue FR / EN dès la v1.
- **Avertissement juridique obligatoire** : *« WhatMedia n'est ni affilié, ni approuvé, ni sponsorisé par WhatsApp LLC ou Meta Platforms, Inc. WhatsApp est une marque de WhatsApp LLC. »* Aucun logo WhatsApp, aucune reprise de sa charte graphique (bulle verte, icône téléphone).
- **Écosystème** : WhatMedia est un projet Nealix, aux côtés de CodeBox (codebox.nealix.org) et de roger.nealix.org.

## 7. Indicateurs de réussite

| Horizon | Indicateur | Cible |
|---|---|---|
| Lancement (M+1) | Gain VMAF médian vs publication directe | ≥ +10 points sur le corpus de test |
| Lancement | Traitement local réussi sur iPhone récent (iOS 17+) | ≥ 95 % des fichiers du corpus |
| M+3 | Étoiles GitHub | 500 |
| M+3 | Installations PWA (événements anonymes agrégés, optionnels) | 5 000 |
| M+6 | Contributeurs externes | 10 |
| M+6 | Langues | FR, EN + 2 communautaires |

## 8. Modèle

- **Gratuit et open source.** Pas de publicité, pas de compte.
- Soutien via GitHub Sponsors / Open Collective.
- Possibilités futures sans trahir le cœur : API hébergée pour les entreprises (quotas élevés), intégration WhatsApp Business.

## 9. Feuille de route résumée

| Phase | Contenu |
|---|---|
| **v0.1 — Fondations** | Monorepo, CI, landing page, PWA installable, sélection + partage d'un fichier |
| **v0.2 — Moteur vidéo local** | WebCodecs, presets, découpage, audio en passthrough |
| **v0.3 — HDR & photos** | Conversion HDR → SDR, preset photo statut |
| **v0.4 — Serveur de secours** | API ffmpeg optionnelle, tone-mapping serveur |
| **v1.0 — Lancement public** | Presets mesurés et publiés, i18n FR/EN, docs, annonce |
| **v1.x** | Recadrage 9:16 intelligent, sous-titres, file d'attente, `@whatmedia/core` stable |

Détails : `09-ROADMAP-TACHES.md`.

---

*La suite du dossier : `01-PRD.md` (spécifications fonctionnelles), `02-ARCHITECTURE.md`, `03-PIPELINE-MEDIA.md`, `04-API.md`, `05-UI-UX-LANDING.md`, `06-DEPLOIEMENT.md`, `07-SECURITE-VIE-PRIVEE.md`, `08-TESTS-QUALITE.md`, `09-ROADMAP-TACHES.md`.*
