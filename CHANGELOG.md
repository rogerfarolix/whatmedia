# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versions : [SemVer](https://semver.org/lang/fr/)

## [Unreleased]

### Design
- Nouveau design du site, mobile d’abord : typographie système Apple (SF Pro sur iPhone, iPad et Mac, Inter ailleurs), sans italique, vraies captures de l’app en WebP dans des cadres de téléphone, carrousel horizontal sur mobile, sections sombres, boutons pilule, apparitions au défilement en CSS seul (désactivées si l’utilisateur limite les animations).
- Application harmonisée avec le site (logo, polices).
- **Installation** : bouton « Installer » toujours visible dans l’en-tête de l’app. Il ouvre la fenêtre native du navigateur (Chrome, Edge, Android) ou explique la marche à suivre (Safari iPhone, autres navigateurs, navigateurs intégrés de WhatsApp ou Instagram avec copie du lien). Le signal d’installation du navigateur est désormais capté dès le chargement (il était souvent perdu). Captures ajoutées au manifeste.

### Fiabilité
- Vidéos très détaillées (eau, confettis, grain) : l’encodeur du navigateur peut ignorer le débit demandé. Le moteur réessaie avec un débit plus bas, puis une image plus petite, et en dernier recours redécoupe la partie en parties plus courtes, toujours sous 16 Mo. La barre de progression ne recule plus et un message explique l’ajustement.

### Projet open source
- README et CONTRIBUTING réécrits, guide de déploiement aligné sur la production, code de conduite officiel (Contributor Covenant 2.1).
- Fichiers obsolètes retirés : kit de lancement aux chiffres non mesurés, configurations de déploiement inutilisées, polices et scripts non utilisés.

### Site public (landing)
- Site reconstruit avec un contenu factuel FR/EN : accueil (résumé et bouton visibles sans défiler), pages Fonctionnalités et une page par service (statut vidéo, photo, discussion, serveur de secours), FAQ, À propos, Contact, Conditions d’utilisation, page 404 dédiée.
- Corrections factuelles : hébergeur réel (Contabo, pas Cloudflare/Vercel), politique de confidentialité exacte (serveur de secours, journaux), suppression des promesses impossibles (« WhatsApp ne dégrade plus… »), exemple de code réel (l’API `createPipeline` n’existait pas), plus de commande `npm install` pour un paquet non publié.
- SEO : titres et descriptions uniques, canonical et hreflang générés, sitemap XML généré depuis la table des routes, JSON-LD (WebSite, Organization, WebApplication, FAQPage, HowTo, BreadcrumbList), aperçu de lien en PNG 1200×630 (le SVG n’est pas lu par WhatsApp ni Facebook), `robots.txt` excluant `/api/`, balise Search Console optionnelle (`GOOGLE_SITE_VERIFICATION`).
- Design : plus de dégradés ni de tirets cadratins, contrastes AA, cibles tactiles conformes, aucun script en ligne (CSP `script-src 'self'`).

### Mesures
- Les chiffres VMAF publiés étaient simulés : `measurements.json` est remis à l’état « en attente » et `/mesures` affiche « Mesures en cours ». Le schéma refuse désormais toute publication sans aller-retour réel par WhatsApp ; le banc mensuel produit un artefact de simulation, jamais publié.
- Spikes S1 à S5 rouverts (chiffres non mesurés retirés, protocole iPhone ajouté).

### Application
- **Sélection multiple automatique** : jusqu’à 20 photos et vidéos choisies d’un coup, réglées une seule fois (format vidéo, durée des parties ; les photos passent en « Photo statut »), puis traitées l’une après l’autre sans intervention. Écran de résultats groupé ; un fichier en échec n’arrête pas le lot et peut être relancé seul (avec le serveur de secours si besoin).
- **« Tout partager »** : une seule feuille de partage avec tous les fichiers (lot ou parties d’une vidéo), en plus du partage un par un.
- Traitement vidéo dans un Web Worker (PRD US-04), avec repli sur le fil principal si WebCodecs n’y est pas disponible.

### Exploitation
- CI réparée (Playwright lancé depuis l’app, ffmpeg installé pour les tests API de bout en bout) ; workflow de déploiement aligné sur le serveur réel, désactivé tant que `DEPLOY_ENABLED` et les secrets ne sont pas définis.
- Rotation des journaux Docker (3 × 10 Mo), 404 réelles pour les fichiers absents sous `/app/`.

### Corrigé
- **Moteur vidéo local inutilisable** : `plan()` fournissait largeur *et* hauteur sans `fit`, ce que Mediabunny refuse (`TypeError`) — toute vidéo basculait vers le serveur. Dimensions désormais calculées en conservant le ratio (vidéos horizontales comprises), sans agrandissement, avec `fit` toujours défini.
- **Limite de 16 Mo** : le débit audio réel (passthrough) est budgété, chaque partie est vérifiée après encodage et réencodée à débit réduit si elle dépasse la limite ; les vidéos « Discussion » trop longues sont découpées.
- **Serveur de secours** : le téléchargement ouvrait le fichier résultat en *écriture* (fichier vidé) et n'exigeait pas le jeton ; seules les 60 premières secondes étaient traitées, sans découpage ni respect des 16 Mo ; les photos et le HDR n'étaient pas gérés. L'API utilise maintenant `ffprobe` + le même `plan()` que le client, tone-mapping HDR de référence, pipeline photo (HEIC, transparence), file d'attente bornée, vérification de signature binaire (415), comparaison du jeton à temps constant, progression réelle, suppression de la source dès la fin du traitement.
- **API inaccessible en production** (`/api/v1/*` → 404) : le conteneur `web` relaie désormais `/api/v1` vers l'API.
- La langue anglaise n'était jamais choisie automatiquement ; le bouton de langue n'avait pas de nom accessible.
- Liens GitHub morts sur la landing (`github.com/nealix/…` → `github.com/rogerfarolix/…`).
- Les fichiers de sortie portaient tous le même nom (collisions en lot) ; ils reprennent le nom de la source.
- Photos PNG/WebP transparentes : fond blanc au lieu de noir.

### Ajouté
- Choix de la durée des parties (30 / 60 / 90 s) et changement de preset sur l'écran d'analyse ; résumé de la sortie prévue (résolution, i/s, débit) et explications (720p imposé, découpage, « 30 s = plus net »).
- Messages d'erreur clairs (fichier non pris en charge, trop gros, format illisible) au lieu d'`alert()` ; serveur de secours proposé seulement s'il répond.
- Écran de traitement : voie réelle (téléphone ou serveur), temps restant estimé, maintien de l'écran allumé (Screen Wake Lock), avertissement avant de quitter la page.
- Résultats : aperçus, bouton « Enregistrer » par partie, marque « Partagée », partage du fichier seul (sans texte), « Tout enregistrer » espacé.
- Bandeau d'installation : bouton « Installer » natif (Android/desktop), masqué une fois l'app installée.
- Moteur chargé à la demande : JS initial de `/app` ramené de 261 Ko à 100 Ko gzip.

### Sécurité / exploitation
- CSP stricte sur `/app`, CSP sur la landing, `Cache-Control: no-cache` pour le service worker, suppression du doublon contradictoire `X-Frame-Options`.
- Conteneurs `web` et `api` en lecture seule, capacités retirées, `no-new-privileges`, limites CPU/mémoire/PID.
- Vraie IP client pour la limite de débit (10 tâches/heure/IP), CORS fermé par défaut, purge des tâches orphelines au démarrage.

### Accessibilité
- Contrastes AA (texte sur orange, gris en mode sombre), cibles tactiles ≥ 44 px, sélecteurs en groupes radio, zone de dépôt utilisable au clavier, modale `<dialog>` native, lien d'évitement, barre de progression annoncée.

## [1.0.0] - 2026-11-09

### Ajouté
- **Moteur local WebCodecs** (`@whatmedia/core`) : transcodage matériel AVC/H.264 et remuxage MP4 in-browser sans transfert réseau.
- **Support des photos calibrées** : recadrage et redimensionnement non destructif sans étirement, respect de l'orientation EXIF, nettoyage des métadonnées privées et sortie JPEG sRGB.
- **Détection HDR & Conversion BT.709** : détection HLG, PQ et Dolby Vision, tone-mapping pour éliminer le délavage de WhatsApp.
- **PWA React 19 installable** (`apps/app`) : hors-ligne, manifest standalone, icônes adaptatives, bandeau d'installation iOS, sélecteur de presets, découpage intelligent multi-segments, partage natif via Web Share API (`navigator.share`).
- **Serveur de secours Fastify 5** (`apps/api`) : transcodage distant sécurisé avec ffmpeg sous Docker durci (Alpine non-root), consentement utilisateur explicite, purge automatique sous 15 minutes, rate limiting.
- **Landing Page Astro 5** (`apps/web`) : design moderne Tailwind CSS 4, polices auto-hébergées, bilingue FR/EN, comparateur interactif avant/après.
- **Banc d'essai scientifique VMAF / SSIM** (`tools/quality`) : évaluation réelle image par image avec Netflix libvmaf, scores certifiés publiés sur `/mesures` et `/en/measurements`.
- **Infrastructure Docker & Nginx** : stack Caddy + Fastify multi-stage déployée sur `https://whatmedia.nealix.org`.
