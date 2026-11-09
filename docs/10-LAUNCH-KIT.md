# 🚀 WhatMedia — Kit de Lancement & Communication (v1.0)

Ce document fournit l'ensemble des contenus prêts à l'emploi pour le lancement officiel de WhatMedia v1.0.

---

## 1. Annonce X (Twitter) — Thread

### Tweet 1 (Accroche)
> Vos vidéos de statut WhatsApp ressortent floues, délavées ou coupées brutalement ?
> 
> WhatsApp compresse et tronque vos médias avec un algorithme agressif.
> 
> Pour régler ça définitivement, nous lançons **WhatMedia** : 100% open-source, local-first et gratuit.
> 
> 🧵👇 https://whatmedia.nealix.org

### Tweet 2 (Le problème technique)
> Pourquoi les statuts sont si laids ?
> 1. Débit bridé brutalement sous ~1.2 Mbps
> 2. Coupure sèche au-delà de 30 secondes
> 3. Couleurs HDR (Dolby Vision / HLG des iPhone) délavées en grisâtre
> 
> WhatMedia calibre votre média en amont pour que WhatsApp n'ait presque rien à dégrader.

### Tweet 3 (Comment ça marche)
> ⚡ WebCodecs matériel : transcodage 2x à 8x le temps réel directement dans Safari / Chrome.
> 🔒 Confidentialité totale : vos vidéos ne quittent jamais votre smartphone. Zéro serveur nécessaire dans 95% des cas.
> ✂️ Découpage intelligent : segments parfaits sans fin tronquée.
> 🎨 Tone-mapping propre : fin des visages blanchâtres.

### Tweet 4 (Preuve par les chiffres VMAF)
> Chez WhatMedia, zéro chiffre marketing inventé.
> 
> Nous avons mesuré image par image avec l'algorithme Netflix `libvmaf` :
> - Score moyen WhatMedia : **97.3 / 100**
> - Jusqu'à **+56.8% de fidélité** sur les vidéos HDR
> 
> Tout le banc d'essai est public : https://whatmedia.nealix.org/mesures/

### Tweet 5 (Call to action & GitHub)
> 📲 Essayez maintenant (sans compte, installable en PWA) : https://whatmedia.nealix.org/app/
> ⭐ Code source complet sur GitHub : https://github.com/rogerfarolix/whatmedia
> 
> Créé avec ❤️ au sein de l'écosystème Nealix.

---

## 2. Annonce LinkedIn

**Titre : Vos vidéos WhatsApp méritent d'être vues avec leur vraie qualité.**

Si vous partagez régulièrement du contenu sur les statuts WhatsApp (démos produits, coulisses d'entreprises, créations vidéo ou moments de vie), vous avez sans doute constaté ce massacre :
- Couleurs ternes et blanchâtres (les vidéos HDR des iPhone récents ne sont pas correctement converties par WhatsApp)
- Pixellisation et artefacts de compression
- Vidéos tronquées arbitrairement au milieu d'une phrase

Aujourd'hui, nous rendons public **WhatMedia v1.0**, un outil web open-source conçu pour préparer et calibrer vos vidéos et photos spécifiquement pour l'algorithme de WhatsApp.

**Ce qui rend WhatMedia unique :**
1. **Local-first & Ultra rapide :** Grâce aux API modernes du Web (WebCodecs + accélération matérielle), le traitement s'effectue directement sur votre téléphone. Vos vidéos de 50 Mo ne sont pas envoyées dans les nuages : elles restent sur votre appareil.
2. **Respect absolu de la vie privée :** Zéro tracking, zéro cookie tiers, zéro revente de données.
3. **Découpage intelligent en segments :** Fini les coupures brutales, vos vidéos longues sont fractionnées en chapitres fluides et prêts à être publiés d'un geste.
4. **Honnêteté scientifique :** Pas de promesses creuses. Nos gains de qualité sont mesurés scientifiquement avec le moteur Netflix `libvmaf` (+12% à +56% de fidélité mesurée).

👉 Tester gratuitement sans créer de compte : https://whatmedia.nealix.org/app/
⭐ Découvrir le code source sur GitHub : https://github.com/rogerfarolix/whatmedia

---

## 3. Scénario du Statut WhatsApp de Démonstration (Story en 3 parties)

Réalisé et découpé avec WhatMedia lui-même !

- **Segment 1 (0:00 - 0:30) :**
  - *Visuel* : Écran divisé montrant la même vidéo envoyée directement (floue, couleurs plates) vs passée par WhatMedia (contrastée, nette, 1080p).
  - *Texte incrusté* : « Tu as remarqué comme WhatsApp détruit la qualité de tes statuts ? »
- **Segment 2 (0:30 - 1:00) :**
  - *Visuel* : Démonstration de l'interface WhatMedia sur smartphone (choix du preset, barre de progression fluide, 0 octet envoyé sur le réseau).
  - *Texte incrusté* : « WhatMedia calibre la vidéo directement sur ton téléphone. 100% gratuit et sans pub. »
- **Segment 3 (1:00 - 1:30) :**
  - *Visuel* : Résultat final éclatant avec le bouton de partage WhatsApp en un clic.
  - *Texte incrusté* : « Lien en bio / whatmedia.nealix.org »

---

## 4. Soumission aux Annuaires Open Source

- **Product Hunt** :
  - *Tagline* : Free, local-first PWA to make your WhatsApp Status videos crisp and uncompressed.
  - *Topics* : Video, Open Source, Privacy, PWA.
- **Hacker News (Show HN)** :
  - *Title* : Show HN: WhatMedia – In-browser WebCodecs tool to beat WhatsApp video compression
  - *Pitch* : We got tired of WhatsApp washing out iPhone HDR videos and crushing bitrates to 1.2 Mbps. We built a local-first PWA using WebCodecs + Mediabunny that encodes calibrated 1080p BT.709 H.264 streams on-device. Certified VMAF benchmarks included.
- **F-Droid / PWA Directories** (FindPWA, AppScope, PWA Today).

