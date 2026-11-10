import type { Lang } from '../i18n/site';

/**
 * The four "services" of WhatMedia. Every number below comes from packages/config
 * (presets.json, whatsapp-limits.json) or from the code; nothing is a quality claim.
 */
export interface FeatureText {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  forWho: string;
  what: string[];
  steps: string[];
  limits: string[];
}

export interface Feature {
  id: 'status-video' | 'status-photo' | 'chat-video' | 'fallback-server';
  icon: 'video' | 'photo' | 'chat' | 'server';
  fr: FeatureText;
  en: FeatureText;
}

export const features: Feature[] = [
  {
    id: 'status-video',
    icon: 'video',
    fr: {
      slug: 'statut-video',
      title: 'Vidéos pour le statut',
      metaTitle: 'Préparer une vidéo pour le statut WhatsApp',
      metaDescription:
        'Découpe ta vidéo en parties de 30, 60 ou 90 s, chacune sous 16 Mo, en H.264 1080p avec couleurs HDR converties. Gratuit, sur ton téléphone.',
      summary:
        'Ta vidéo est découpée en parties de la durée choisie, et chaque partie est encodée pour tenir sous la limite de 16 Mo avec le débit le plus élevé possible.',
      forWho: 'Pour publier une vidéo de plus d’une minute en plusieurs statuts, ou une vidéo filmée en HDR sur iPhone.',
      what: [
        'Découpage en parties de 30, 60 ou 90 secondes, sans dernière partie minuscule (moins de 5 s : les parties sont équilibrées).',
        'Chaque partie vérifiée après encodage : si elle dépasse 16 Mo, elle est réencodée à un débit plus bas.',
        'Statut HD : jusqu’à 1080 × 1920 (ou 1920 × 1080 à l’horizontale). Statut léger : jusqu’à 720 × 1280.',
        '30 images par seconde au maximum, jamais plus que la source ; jamais d’agrandissement.',
        'H.264 et AAC dans un MP4 prêt à la lecture en continu, image clé toutes les 2 secondes.',
        'Vidéo HDR (HLG, PQ, Dolby Vision) convertie en couleurs standard BT.709.',
        'Option de recadrage 9:16 plein écran pour les vidéos horizontales.',
      ],
      steps: [
        'Choisis la vidéo dans ta galerie (plusieurs fichiers possibles, traités l’un après l’autre).',
        'Vérifie l’analyse : durée, résolution, nombre de parties et sortie prévue.',
        'Choisis la durée des parties : plus courte, chaque partie reçoit plus de débit.',
        'Lance l’optimisation, puis partage chaque partie dans ton statut, dans l’ordre.',
      ],
      limits: [
        'WhatsApp réencode toujours ce que tu publies. WhatMedia prépare le fichier, il ne désactive pas cette compression.',
        'Le rendu final dépend aussi de ta connexion et de l’option HD de WhatsApp.',
        'Jusqu’à 2 Go par fichier en local ; au-delà de 500 Mo, le traitement peut être long sur téléphone.',
      ],
    },
    en: {
      slug: 'status-video',
      title: 'Videos for status',
      metaTitle: 'Prepare a video for WhatsApp status',
      metaDescription:
        'Split your video into 30, 60 or 90 s parts, each under 16 MB, as 1080p H.264 with HDR colours converted. Free, on your phone.',
      summary:
        'Your video is split into parts of the length you choose, and each part is encoded to stay under the 16 MB limit with the highest possible bitrate.',
      forWho: 'To post a video longer than a minute as several statuses, or an HDR video shot on an iPhone.',
      what: [
        'Split into 30, 60 or 90 second parts, without a tiny last part (under 5 s, parts are balanced).',
        'Every part is checked after encoding: if it is over 16 MB, it is re-encoded at a lower bitrate.',
        'Status HD: up to 1080 × 1920 (or 1920 × 1080 in landscape). Status Light: up to 720 × 1280.',
        '30 frames per second at most, never more than the source; never upscaled.',
        'H.264 and AAC in a streaming-ready MP4, with a keyframe every 2 seconds.',
        'HDR video (HLG, PQ, Dolby Vision) converted to standard BT.709 colours.',
        'Optional full-screen 9:16 crop for landscape videos.',
      ],
      steps: [
        'Pick the video from your gallery (several files allowed, processed one after another).',
        'Check the analysis: duration, resolution, number of parts and planned output.',
        'Choose the part length: shorter parts get more bitrate each.',
        'Start the optimization, then share each part to your status, in order.',
      ],
      limits: [
        'WhatsApp always re-encodes what you post. WhatMedia prepares the file; it does not turn that compression off.',
        'The final result also depends on your connection and on the WhatsApp HD option.',
        'Up to 2 GB per file locally; above 500 MB, processing can be slow on a phone.',
      ],
    },
  },
  {
    id: 'status-photo',
    icon: 'photo',
    fr: {
      slug: 'photo-statut',
      title: 'Photos pour le statut',
      metaTitle: 'Préparer une photo pour le statut WhatsApp',
      metaDescription:
        'Redimensionne ta photo sans la déformer, supprime les métadonnées privées et convertis-la en JPEG sRGB. HEIC, PNG et WebP acceptés.',
      summary:
        'La photo est réduite à une taille adaptée aux statuts sans être déformée, ses métadonnées sont supprimées et elle est enregistrée en JPEG sRGB.',
      forWho: 'Pour publier une photo d’iPhone (HEIC) ou une capture d’écran sans perdre en netteté ni partager sa position GPS.',
      what: [
        'Côté long jusqu’à 2560 px et côté court jusqu’à 1440 px, proportions conservées, jamais d’agrandissement.',
        'Réduction en plusieurs paliers pour éviter le crénelage.',
        'Orientation de l’appareil photo appliquée, puis toutes les métadonnées supprimées (dont la position GPS).',
        'JPEG en couleurs sRGB, qualité 90 %.',
        'Les zones transparentes des PNG et WebP deviennent blanches au lieu de noires.',
      ],
      steps: [
        'Choisis la photo : le format « Photo statut » est sélectionné automatiquement.',
        'Lance l’optimisation : c’est presque instantané.',
        'Partage la photo dans ton statut ou enregistre-la.',
      ],
      limits: [
        'Le HEIC est lu par Safari. Sur d’autres navigateurs, le serveur de secours peut le convertir, avec ton accord.',
        'WhatsApp recompresse aussi les photos à la publication.',
      ],
    },
    en: {
      slug: 'status-photo',
      title: 'Photos for status',
      metaTitle: 'Prepare a photo for WhatsApp status',
      metaDescription:
        'Resize your photo without distortion, remove private metadata and convert it to sRGB JPEG. HEIC, PNG and WebP supported.',
      summary:
        'The photo is resized to a status-friendly size without distortion, its metadata is removed and it is saved as an sRGB JPEG.',
      forWho: 'To post an iPhone photo (HEIC) or a screenshot without losing sharpness or sharing your GPS location.',
      what: [
        'Long side up to 2560 px and short side up to 1440 px, aspect ratio kept, never upscaled.',
        'Downscaled in several steps to avoid aliasing.',
        'Camera orientation applied, then all metadata removed (GPS location included).',
        'JPEG in sRGB colours, 90% quality.',
        'Transparent areas of PNG and WebP become white instead of black.',
      ],
      steps: [
        'Pick the photo: the “Status Photo” format is selected automatically.',
        'Start the optimization: it is almost instant.',
        'Share the photo to your status or save it.',
      ],
      limits: [
        'HEIC is read by Safari. On other browsers, the fallback server can convert it, with your consent.',
        'WhatsApp also recompresses photos when you post them.',
      ],
    },
  },
  {
    id: 'chat-video',
    icon: 'chat',
    fr: {
      slug: 'video-discussion',
      title: 'Vidéos pour les discussions',
      metaTitle: 'Envoyer une vidéo nette dans une discussion WhatsApp',
      metaDescription:
        'Prépare une vidéo pour une discussion WhatsApp : un seul fichier sous 16 Mo quand c’est possible, sinon des parties égales. Version HD ou compacte.',
      summary:
        'Pour une conversation, la vidéo reste en un seul fichier tant qu’elle tient sous 16 Mo avec un débit correct. Sinon, elle est coupée en parties égales.',
      forWho: 'Pour envoyer une vidéo à un contact ou un groupe, en bonne qualité ou en version légère pour les réseaux lents.',
      what: [
        'Discussion HD : jusqu’à 1920 px sur le côté long, débit visé 6 Mbit/s.',
        'Discussion compacte : jusqu’à 720 × 1280, débit visé 1,5 Mbit/s, pour les réseaux 3G et 4G.',
        'Un seul fichier quand la vidéo est assez courte, sinon des parties égales, chacune sous 16 Mo.',
        'Même encodage que pour les statuts : H.264, AAC, MP4 prêt à la lecture.',
      ],
      steps: [
        'Choisis la vidéo puis le format « Discussion HD » ou « Discussion compacte ».',
        'Lance l’optimisation.',
        'Partage le fichier dans la conversation de ton choix.',
      ],
      limits: [
        'Plus la vidéo est longue, plus le débit par seconde baisse pour rester sous 16 Mo.',
        'WhatsApp peut réencoder la vidéo à l’envoi selon ses propres réglages.',
      ],
    },
    en: {
      slug: 'chat-video',
      title: 'Videos for chats',
      metaTitle: 'Send a sharp video in a WhatsApp chat',
      metaDescription:
        'Prepare a video for a WhatsApp chat: one file under 16 MB when possible, otherwise equal parts. HD or compact version.',
      summary:
        'For a conversation, the video stays in a single file as long as it fits under 16 MB at a reasonable bitrate. Otherwise it is split into equal parts.',
      forWho: 'To send a video to a contact or a group, in good quality or as a light version for slow networks.',
      what: [
        'Chat HD: up to 1920 px on the long side, 6 Mbit/s target bitrate.',
        'Chat Compact: up to 720 × 1280, 1.5 Mbit/s target bitrate, for 3G and 4G networks.',
        'A single file when the video is short enough, otherwise equal parts, each under 16 MB.',
        'Same encoding as for statuses: H.264, AAC, streaming-ready MP4.',
      ],
      steps: [
        'Pick the video, then the “Chat HD” or “Chat Compact” format.',
        'Start the optimization.',
        'Share the file to the conversation of your choice.',
      ],
      limits: [
        'The longer the video, the lower the bitrate per second needed to stay under 16 MB.',
        'WhatsApp may re-encode the video when sending, according to its own settings.',
      ],
    },
  },
  {
    id: 'fallback-server',
    icon: 'server',
    fr: {
      slug: 'serveur-de-secours',
      title: 'Serveur de secours',
      metaTitle: 'Serveur de secours WhatMedia : quand et comment',
      metaDescription:
        'Si ton téléphone ne peut pas traiter un fichier, WhatMedia peut le faire sur son serveur, uniquement avec ton accord. Fichier supprimé sous 15 minutes.',
      summary:
        'Quand ton appareil ne sait pas traiter un fichier (format non lu, encodeur absent), WhatMedia te propose de le faire sur son serveur. Rien n’est envoyé sans ton accord.',
      forWho: 'Pour les téléphones anciens, les navigateurs sans encodeur vidéo, les photos HEIC hors Safari, ou pour la conversion HDR de référence.',
      what: [
        'Accord demandé pour chaque fichier, avant tout envoi.',
        'Transfert chiffré en HTTPS vers whatmedia.nealix.org.',
        'Le fichier d’origine est supprimé dès la fin du traitement ; les résultats sont supprimés dès que tu les as récupérés, et au plus tard 15 minutes après.',
        'Mêmes règles que sur le téléphone : découpage, limite de 16 Mo, couleurs HDR converties (tone-mapping de référence).',
        'Aucun compte, aucun nom de fichier dans les journaux. Chaque tâche est protégée par un jeton secret.',
      ],
      steps: [
        'Le traitement local échoue, ou tu choisis « Utiliser le serveur de secours ».',
        'Tu lis la fenêtre d’information et tu acceptes (ou non) l’envoi de ce fichier.',
        'Le fichier est traité, téléchargé dans l’app, puis supprimé du serveur.',
      ],
      limits: [
        'Jusqu’à 500 Mo et 10 minutes de vidéo par fichier.',
        'Jusqu’à 10 fichiers par heure et par connexion, pour garder le service disponible pour tous.',
        'Le serveur peut être indisponible : l’app continue alors de fonctionner en local.',
      ],
    },
    en: {
      slug: 'fallback-server',
      title: 'Fallback server',
      metaTitle: 'WhatMedia fallback server: when and how',
      metaDescription:
        'If your phone cannot process a file, WhatMedia can do it on its server, only with your consent. File deleted within 15 minutes.',
      summary:
        'When your device cannot process a file (unreadable format, no encoder), WhatMedia offers to do it on its server. Nothing is sent without your consent.',
      forWho: 'For older phones, browsers without a video encoder, HEIC photos outside Safari, or for the reference HDR conversion.',
      what: [
        'Consent asked for each file, before anything is sent.',
        'Encrypted HTTPS transfer to whatmedia.nealix.org.',
        'The original file is deleted as soon as processing ends; results are deleted as soon as you retrieve them, and within 15 minutes at the latest.',
        'Same rules as on the phone: splitting, 16 MB limit, HDR colours converted (reference tone mapping).',
        'No account, no file names in logs. Every job is protected by a secret token.',
      ],
      steps: [
        'Local processing fails, or you choose “Use the fallback server”.',
        'You read the information window and accept (or not) sending this file.',
        'The file is processed, downloaded into the app, then deleted from the server.',
      ],
      limits: [
        'Up to 500 MB and 10 minutes of video per file.',
        'Up to 10 files per hour per connection, to keep the service available for everyone.',
        'The server may be unavailable: the app then keeps working locally.',
      ],
    },
  },
];

export const featurePath = (f: Feature, lang: Lang) =>
  lang === 'fr' ? `/fonctionnalites/${f.fr.slug}/` : `/en/features/${f.en.slug}/`;
