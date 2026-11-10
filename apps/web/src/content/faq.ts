import type { Lang } from '../i18n/site';

export interface FaqItem {
  q: string;
  a: string;
}

export const faq: Record<Lang, FaqItem[]> = {
  fr: [
    {
      q: 'WhatMedia supprime-t-il la compression de WhatsApp ?',
      a: 'Non, personne ne le peut : WhatsApp réencode toujours ce qui est publié. WhatMedia prépare le fichier en amont (taille, débit, découpage, couleurs) pour que tu partes de la meilleure base possible.',
    },
    {
      q: 'C’est vraiment gratuit ?',
      a: 'Oui. WhatMedia est gratuit, sans publicité, sans compte et sans filigrane. Le code est publié sous licence MIT.',
    },
    {
      q: 'Mes vidéos sont-elles envoyées sur un serveur ?',
      a: 'Non par défaut : le traitement se fait dans ton navigateur, sur ton téléphone. Le serveur de secours n’est proposé que si ton appareil ne peut pas traiter le fichier, et seulement après ton accord explicite. Le fichier y est supprimé au plus tard 15 minutes après.',
    },
    {
      q: 'Faut-il installer une application ?',
      a: 'Non. WhatMedia s’ouvre dans Safari ou Chrome. Tu peux l’ajouter à ton écran d’accueil pour l’ouvrir comme une app, et elle fonctionne ensuite hors ligne (sauf le serveur de secours).',
    },
    {
      q: 'Pourquoi découper ma vidéo en plusieurs parties ?',
      a: 'Chaque statut a une durée maximale et un fichier envoyé ne doit pas dépasser 16 Mo. Avec des parties plus courtes, chaque seconde de vidéo dispose de plus de débit, donc d’une image plus nette.',
    },
    {
      q: 'Quelle durée de partie choisir ?',
      a: '30 secondes pour la meilleure netteté, 60 ou 90 secondes pour publier moins de statuts. L’écran d’analyse t’indique la résolution et le débit obtenus pour chaque choix.',
    },
    {
      q: 'Ma vidéo d’iPhone paraît délavée sur WhatsApp. Pourquoi ?',
      a: 'Les iPhone récents filment en HDR. Publiées telles quelles, ces vidéos sont souvent affichées délavées. WhatMedia détecte le HDR et convertit les couleurs en SDR standard (BT.709).',
    },
    {
      q: 'Quels formats sont acceptés ?',
      a: 'Vidéos MP4 et MOV (H.264 ou HEVC selon ton appareil), photos JPEG, PNG, WebP et HEIC. Jusqu’à 2 Go par fichier sur le téléphone.',
    },
    {
      q: 'Sur quels appareils WhatMedia fonctionne-t-il ?',
      a: 'iPhone et iPad avec iOS 16.4 ou plus récent (Safari), Android avec Chrome récent, et les navigateurs d’ordinateur récents. Si ton navigateur ne sait pas encoder la vidéo, le serveur de secours prend le relais avec ton accord.',
    },
    {
      q: 'WhatMedia est-il lié à WhatsApp ou à Meta ?',
      a: 'Non. WhatMedia est un projet open source indépendant, ni affilié, ni sponsorisé, ni validé par WhatsApp LLC ou Meta Platforms, Inc.',
    },
  ],
  en: [
    {
      q: 'Does WhatMedia remove WhatsApp compression?',
      a: 'No, nobody can: WhatsApp always re-encodes what is posted. WhatMedia prepares the file beforehand (size, bitrate, splitting, colours) so you start from the best possible base.',
    },
    {
      q: 'Is it really free?',
      a: 'Yes. WhatMedia is free, with no ads, no account and no watermark. The code is published under the MIT license.',
    },
    {
      q: 'Are my videos sent to a server?',
      a: 'Not by default: processing happens in your browser, on your phone. The fallback server is only offered if your device cannot process the file, and only after your explicit consent. The file is deleted there within 15 minutes at the latest.',
    },
    {
      q: 'Do I need to install an app?',
      a: 'No. WhatMedia opens in Safari or Chrome. You can add it to your home screen to open it like an app, and it then works offline (except for the fallback server).',
    },
    {
      q: 'Why split my video into several parts?',
      a: 'Each status has a maximum duration and a sent file must not exceed 16 MB. With shorter parts, each second of video gets more bitrate, so a sharper picture.',
    },
    {
      q: 'Which part length should I choose?',
      a: '30 seconds for the best sharpness, 60 or 90 seconds to post fewer statuses. The analysis screen shows the resolution and bitrate you get for each choice.',
    },
    {
      q: 'My iPhone video looks washed out on WhatsApp. Why?',
      a: 'Recent iPhones record in HDR. Posted as is, these videos are often displayed washed out. WhatMedia detects HDR and converts the colours to standard SDR (BT.709).',
    },
    {
      q: 'Which formats are supported?',
      a: 'MP4 and MOV videos (H.264, or HEVC depending on your device), JPEG, PNG, WebP and HEIC photos. Up to 2 GB per file on the phone.',
    },
    {
      q: 'Which devices does WhatMedia work on?',
      a: 'iPhone and iPad on iOS 16.4 or later (Safari), Android with a recent Chrome, and recent desktop browsers. If your browser cannot encode video, the fallback server takes over with your consent.',
    },
    {
      q: 'Is WhatMedia related to WhatsApp or Meta?',
      a: 'No. WhatMedia is an independent open source project, not affiliated with, sponsored or endorsed by WhatsApp LLC or Meta Platforms, Inc.',
    },
  ],
};
