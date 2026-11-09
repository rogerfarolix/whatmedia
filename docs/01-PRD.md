# 01 — Spécifications fonctionnelles (PRD)

## 1. Périmètre v1.0

### Inclus
- Landing page publique (`/`), pages légales (`/confidentialite`, `/mentions`), page « Comment ça marche » (`/comment-ca-marche`), page résultats de mesure (`/mesures`).
- Application PWA (`/app`) installable sur iOS (Safari → « Sur l'écran d'accueil ») et Android (Chrome → « Installer »).
- Traitement **vidéo** : transcodage, conversion HDR → SDR, redimensionnement 9:16, découpage en segments.
- Traitement **photo** : redimensionnement, conversion sRGB, JPEG optimisé.
- Partage via Web Share API (fichiers), avec repli vers téléchargement.
- Serveur de secours optionnel (désactivable au déploiement), avec consentement explicite par fichier.
- Interface FR (par défaut) et EN.

### Exclu de la v1.0
- Publication automatique sur WhatsApp (impossible : aucune API publique pour les statuts).
- Comptes utilisateurs, historique cloud.
- Montage vidéo (texte, filtres, musique).
- Web Share Target (non pris en charge par Safari iOS).

## 2. Parcours principal

```
[Landing] → « Ouvrir l'app » → [/app Accueil]
   → Choisir un média (vidéo/photo, 1 ou plusieurs)
   → [Analyse] durée, résolution, codec, HDR ?, taille
   → [Réglages] preset (recommandé auto), durée de segment
   → [Traitement] barre de progression, voie utilisée (Local / Serveur)
   → [Résultat] aperçu, segments numérotés, taille, gain estimé
   → « Partager sur WhatsApp » (segment par segment) ou « Tout enregistrer »
```

## 3. User stories et critères d'acceptation

### US-01 — Choisir un média
*En tant qu'utilisateur, je choisis une vidéo ou une photo depuis ma galerie.*
- [ ] Bouton principal « Choisir une vidéo ou une photo » utilisant `<input type="file" accept="video/*,image/*" multiple>`.
- [ ] Glisser-déposer pris en charge sur ordinateur.
- [ ] Les formats MP4, MOV, HEVC, H.264, JPEG, HEIC, PNG, WebP sont acceptés ; sinon, message clair.
- [ ] Taille maximale traitée en local : 2 Go (avertissement au-delà de 500 Mo sur iOS).

### US-02 — Analyse automatique
- [ ] En moins de 2 s pour un fichier de 200 Mo, l'app affiche : durée, résolution, i/s, codec, HDR oui/non, taille, rotation.
- [ ] Si HDR détecté : badge « HDR — les couleurs seront corrigées ».
- [ ] Si la vidéo dépasse la durée de segment : « Sera découpée en N parties ».

### US-03 — Choisir un preset
- [ ] Preset recommandé présélectionné (voir `03-PIPELINE-MEDIA.md §4`).
- [ ] Presets disponibles : **Statut HD** (défaut), **Statut léger** (réseau faible), **Discussion HD**, **Photo statut**.
- [ ] Durée de segment : 30 s / 60 s / 90 s (défaut : valeur de `config/whatsapp-limits.json`).
- [ ] Mode « Avancé » repliable : résolution, débit cible, i/s. Valeurs bornées.

### US-04 — Traitement
- [ ] Le traitement tourne dans un Web Worker : l'interface ne se fige jamais.
- [ ] Progression en %, temps restant estimé, voie utilisée affichée (« Sur ton téléphone » / « Serveur WhatMedia »).
- [ ] Bouton Annuler opérationnel à tout moment.
- [ ] Si l'écran se verrouille ou l'app passe en arrière-plan sur iOS et que le traitement est interrompu : reprise proposée au retour, sans planter.
- [ ] Si la voie locale échoue : proposition du serveur de secours **avec consentement** (« Ta vidéo sera envoyée à whatmedia.nealix.org, traitée, puis supprimée sous 15 minutes. »). Jamais d'envoi automatique.

### US-05 — Résultat et partage
- [ ] Liste des segments : vignette, numéro (1/3, 2/3…), durée, taille.
- [ ] Bouton « Partager » par segment → `navigator.share({ files: [file] })`.
- [ ] Bouton « Tout partager » si `navigator.canShare({ files })` accepte plusieurs fichiers ; sinon partage séquentiel guidé (« Partie 2 sur 3 — Partager »).
- [ ] Repli si le partage n'est pas disponible : téléchargement (`<a download>`).
- [ ] Rappel affiché une fois : « Dans WhatsApp, active HD si l'option apparaît. »

### US-06 — Installer l'app
- [ ] Sur iOS Safari non installé : bandeau discret avec instructions illustrées (Partager → Sur l'écran d'accueil).
- [ ] Sur Android/Chrome : bouton « Installer » via `beforeinstallprompt`.
- [ ] L'app fonctionne hors ligne une fois installée (sauf le serveur de secours).

### US-07 — Photos
- [ ] Photo → 1080×1920 max (ou côté long ≤ 2560 en preset HD, à valider par mesure), sRGB, JPEG q≈0,9, métadonnées EXIF supprimées (sauf orientation appliquée).
- [ ] HEIC accepté (décodage natif Safari ; sinon serveur de secours).

### US-08 — Langue et accessibilité
- [ ] FR par défaut, EN selon `navigator.language`, sélecteur manuel.
- [ ] WCAG 2.2 AA : contraste, focus visible, libellés ARIA, cibles tactiles ≥ 44 px, respect de `prefers-reduced-motion`.

### US-09 — Transparence
- [ ] Page `/mesures` : tableau des résultats VMAF/SSIM par preset et par version de WhatsApp, date de mesure.
- [ ] Pied de page : version de l'app, lien GitHub, avertissement de non-affiliation.

## 4. Exigences non fonctionnelles

| Domaine | Exigence |
|---|---|
| Performance | Vidéo de 60 s en 4K HEVC → statut HD en < 60 s sur iPhone 13 ou plus récent (objectif, à mesurer) |
| Poids | JS initial de `/app` < 150 Ko gzip ; ffmpeg.wasm chargé à la demande seulement |
| Landing | Lighthouse ≥ 95 sur les 4 catégories, LCP < 1,5 s en 4G |
| Disponibilité | 99,5 % (statique) ; le serveur de secours peut être indisponible sans casser l'app |
| Vie privée | Aucun cookie, aucun traceur tiers ; statistiques optionnelles et anonymes (Plausible ou Umami auto-hébergé, ou rien) |
| Compatibilité | iOS/iPadOS 16.4+ Safari, Chrome Android 110+, Chrome/Edge/Firefox/Safari desktop récents |

## 5. Matrice de compatibilité attendue

| Capacité | Safari iOS 17+ | Chrome Android | Desktop Chrome | Firefox |
|---|---|---|---|---|
| VideoDecoder HEVC | Oui (matériel) | Selon appareil | Selon OS | Non |
| VideoEncoder H.264 | Oui | Oui | Oui | Oui (récent) |
| AudioEncoder AAC | À détecter | À détecter | Oui | Non → passthrough |
| Partage de fichiers | Oui | Oui | Partiel | Non → téléchargement |
| Installation PWA | Manuelle | Oui | Oui | Non |

**Règle** : aucune de ces capacités n'est supposée ; tout est détecté au démarrage avec `isConfigSupported()` / `canShare()` (voir `03-PIPELINE-MEDIA.md §2`).
