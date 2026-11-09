# 05 — UI, UX et landing page

## 1. Identité visuelle

**Concept** : « la netteté ». Une marque claire, contrastée, qui évoque la précision optique — sans jamais imiter WhatsApp (pas de vert WhatsApp, pas de bulle, pas d'icône téléphone).

| Token | Valeur | Usage |
|---|---|---|
| `--wm-ink` | `#0B0F1A` | Texte, fond sombre |
| `--wm-paper` | `#F7F7F2` | Fond clair |
| `--wm-signal` | `#FF5A1F` | Couleur principale (orange signal) — boutons, accents |
| `--wm-focus` | `#3D5AFE` | Liens, focus, états actifs |
| `--wm-ok` | `#12B76A` | Succès (≠ vert WhatsApp `#25D366`) |
| `--wm-warn` | `#F79009` | Avertissements |
| `--wm-muted` | `#667085` | Texte secondaire |
| Rayon | 14 px (cartes), 999 px (boutons) | |
| Typo titres | **Space Grotesk** (auto-hébergée) | |
| Typo texte | **Inter** (auto-hébergée) | |
| Mono | **JetBrains Mono** | Chiffres techniques |

Mode sombre complet (`prefers-color-scheme`), contraste AA vérifié.

**Logo** : un carré aux coins arrondis contenant une mire de mise au point (deux crochets d'angle + point central), en orange signal. Wordmark « WhatMedia » en Space Grotesk Bold. Fournir : SVG, icônes PWA 192/512, `maskable` 512, `apple-touch-icon` 180, favicon SVG + ICO.

## 2. Écrans de l'app (`/app`)

### A. Accueil
- Titre : « Prépare ton statut »
- Grande zone : **« Choisir une vidéo ou une photo »** (bouton plein, orange)
- En dessous : 3 pastilles « 100 % sur ton téléphone · Gratuit · Open source »
- Bandeau d'installation iOS (si non installé, une fois par semaine maximum)

### B. Analyse (automatique, < 2 s)
Carte média : vignette, durée, résolution, taille, badges (`HDR`, `4K`, `60 i/s`, `HEVC`). Phrase de diagnostic en langage simple : « Vidéo HDR en 4K de 2 min 14 : WhatsApp va fortement la compresser. On la prépare en 3 parties de 45 s. »

### C. Réglages
- Sélecteur de preset (cartes radio) avec phrase d'explication par preset.
- Durée de segment : contrôle segmenté 30 / 60 / 90 s, avec aide « Plus court = plus net ».
- « Avancé » replié.
- Bouton **« Optimiser »**.

### D. Traitement
- Anneau de progression, % et temps restant.
- Ligne « Traitement sur ton téléphone » (ou « sur le serveur WhatMedia »).
- Liste des segments qui se cochent au fur et à mesure.
- Bouton « Annuler ».
- Conseil affiché : « Garde l'écran allumé » (+ Screen Wake Lock API si disponible).

### E. Résultat
- Lecteur d'aperçu du segment sélectionné.
- Liste : `Partie 1/3 — 0:45 — 11,8 Mo — [Partager]`.
- **« Partager la partie 1 »** en bouton principal, qui passe à la partie suivante après chaque partage.
- Lien « Tout enregistrer dans Fichiers ».
- Encart unique : « Astuce : dans WhatsApp, Réglages → Stockage et données → Qualité de chargement → HD. »

### F. Consentement serveur (modale)
« Ton téléphone ne peut pas traiter ce fichier ici. Veux-tu l'envoyer au serveur WhatMedia ? Il est traité puis supprimé sous 15 minutes. Rien n'est conservé ni analysé. » → [Envoyer] [Annuler] + lien vers `/confidentialite`.

### Micro-interactions
- Retour haptique (`navigator.vibrate`, Android) à la fin.
- Transitions de 150–250 ms, désactivées si `prefers-reduced-motion`.
- Les états vides et d'erreur ont toujours une action suivante.

## 3. Landing page (`/`)

Objectif : faire comprendre en 5 secondes, puis convertir vers `/app`. Une seule page, rapide, sans dépendance JS lourde.

### Structure et textes (FR)

**1. Hero**
- Surtitre : `OPEN SOURCE · GRATUIT · SANS COMPTE`
- H1 : **Tes statuts WhatsApp, enfin nets.**
- Sous-titre : « WhatMedia prépare tes vidéos et tes photos pour qu'elles survivent à la compression de WhatsApp. Directement sur ton téléphone. Rien n'est envoyé. »
- CTA principal : **Ouvrir WhatMedia** → `/app`
- CTA secondaire : « Voir le code sur GitHub »
- Visuel : comparateur avant/après **interactif** (curseur glissant) sur une image réellement mesurée (« Publication directe » vs « Avec WhatMedia »), avec la mention du score VMAF.

**2. Le problème — 3 cartes**
- « Floue » — WhatsApp réduit fortement le débit des vidéos lourdes.
- « Délavée » — Les vidéos HDR de l'iPhone perdent leurs couleurs.
- « Coupée » — Les vidéos longues sont tronquées.

**3. Comment ça marche — 3 étapes**
1. Choisis ta vidéo. 2. WhatMedia l'optimise sur ton téléphone. 3. Partage-la dans « Mon statut ».
(+ courte vidéo de démo en boucle, muette, < 1 Mo, `poster` en AVIF)

**4. Les chiffres** — bloc alimenté par `packages/config/measurements.json` : gain VMAF moyen, nombre de clips testés, date de la dernière mesure, lien vers `/mesures`.

**5. Confidentialité** — « Ta vidéo ne quitte pas ton téléphone. » Explication en 3 lignes, lien vers le code.

**6. Installer sur l'écran d'accueil** — instructions illustrées iPhone (Safari → Partager → Sur l'écran d'accueil) et Android.

**7. Pour les développeurs** — `npm i @whatmedia/core`, snippet de 6 lignes, lien vers l'API auto-hébergeable.

**8. FAQ**
- *WhatMedia supprime-t-il la compression de WhatsApp ?* Non, personne ne le peut. WhatMedia prépare le fichier pour que la compression l'abîme le moins possible.
- *C'est gratuit ?* Oui, et open source (MIT).
- *Mes vidéos sont-elles envoyées quelque part ?* Non par défaut. Le serveur n'est utilisé que si ton téléphone ne peut pas traiter un fichier, et seulement si tu acceptes.
- *Faut-il un compte ?* Non.
- *Pourquoi découper ma vidéo ?* WhatsApp limite la durée et la taille d'un statut ; des parties plus courtes gardent plus de netteté.
- *Est-ce lié à WhatsApp ?* Non. WhatMedia est un projet indépendant.

**9. Pied de page** — Projet Nealix · GitHub · Confidentialité · Mentions légales · Langue FR/EN · avertissement de non-affiliation · version.

### SEO / partage social
- `<title>` : « WhatMedia — Statuts WhatsApp nets, gratuit et open source »
- `meta description` (≈ 150 caractères), Open Graph + Twitter Card avec image 1200×630.
- Données structurées JSON-LD `SoftwareApplication` (`applicationCategory: MultimediaApplication`, `offers.price: 0`, `operatingSystem: iOS, Android, Web`).
- `hreflang` fr/en, `sitemap.xml`, `robots.txt`.
- Mots-clés ciblés : « statut WhatsApp flou », « vidéo statut WhatsApp qualité », « WhatsApp status HD iPhone ».

## 4. Pages secondaires
- `/comment-ca-marche` — explication technique accessible (débit, HDR, segments), avec schémas.
- `/mesures` — tableaux et graphiques de `measurements.json`, méthodologie, lien vers les scripts.
- `/confidentialite` — politique claire (voir `07`).
- `/mentions` — éditeur (Roger Gnanih / Nealix), hébergeur, contact, non-affiliation.
- `/en/...` — versions anglaises.
