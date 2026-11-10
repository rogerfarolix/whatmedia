<div align="center">

# WhatMedia

**Tes statuts WhatsApp, enfin nets.**
*Sharp WhatsApp statuses — free, open source, on-device.*

[Ouvrir l'app](https://whatmedia.nealix.org/app) · [Site](https://whatmedia.nealix.org) · [Mesures](https://whatmedia.nealix.org/mesures) · [Contribuer](CONTRIBUTING.md)

![licence MIT](https://img.shields.io/badge/licence-MIT-orange) ![PWA](https://img.shields.io/badge/PWA-iOS%20%7C%20Android-blue) ![local-first](https://img.shields.io/badge/100%25-local--first-green)

</div>

---

## Pourquoi

Une vidéo nette dans ta galerie devient floue une fois publiée en statut WhatsApp. WhatsApp réencode tout, et les fichiers modernes (4K, HDR, HEVC, 60 i/s) sont exactement ceux qu'il abîme le plus.

**WhatMedia ne « désactive » pas la compression de WhatsApp — personne ne le peut.** Il prépare ton fichier pour qu'elle l'abîme le moins possible :

- 🎯 **Presets mesurés** — format, résolution et débit calibrés avec des mesures objectives (VMAF/SSIM) publiées dans ce dépôt
- 🎨 **Correction HDR** — les vidéos HDR de l'iPhone gardent des couleurs naturelles
- ✂️ **Découpage automatique** — les vidéos longues deviennent des parties numérotées, à la bonne durée
- 🔒 **100 % sur ton téléphone** — rien n'est envoyé, grâce à WebCodecs
- 📲 **Partage direct** vers WhatsApp → Mon statut
- 📴 **Hors ligne**, installable, gratuit, sans compte, sans pub

## Utiliser

1. Ouvre **https://whatmedia.nealix.org/app** dans Safari (iPhone) ou Chrome (Android)
2. *(Optionnel)* Installe-la : Partager → **Sur l'écran d'accueil**
3. Choisis une vidéo → **Optimiser** → **Partager** → WhatsApp → **Mon statut**

## Pour les développeurs

```bash
npm i @whatmedia/core
```
```ts
import { probe, detectCapabilities, plan, run } from '@whatmedia/core';

const info = await probe(file);
const p = plan(info, 'status-hd', await detectCapabilities());
const outputs = await run(file, p, { onProgress: (x) => console.log(x.ratio) });
```

### Développer localement
```bash
git clone https://github.com/rogerfarolix/whatmedia && cd whatmedia
pnpm i
pnpm dev
```
Structure, choix techniques et feuille de route : [`docs/`](docs/).

### Auto-héberger
```bash
cd deploy && cp .env.example .env   # éditer
docker compose up -d                 # + --profile api pour le serveur de secours
```
Guide complet : [`docs/06-DEPLOIEMENT.md`](docs/06-DEPLOIEMENT.md).

## English

WhatMedia is a free, open-source PWA that prepares your videos and photos so they survive WhatsApp's status compression. It runs entirely on your device (WebCodecs), fixes iPhone HDR colours, splits long videos into correctly-sized parts and hands them to WhatsApp through the native share sheet. It does **not** bypass WhatsApp's compression — it minimises the damage, and we publish the measurements to prove it.

## Licence

Code : [MIT](LICENSE) · Documentation : CC BY 4.0
Un projet [Nealix](https://roger.nealix.org) par Roger Gnanih.

> WhatMedia n'est ni affilié, ni approuvé, ni sponsorisé par WhatsApp LLC ou Meta Platforms, Inc. WhatsApp est une marque de WhatsApp LLC.
