export type Language = 'fr' | 'en';

export interface AppTranslations {
  app: {
    name: string;
    tagline: string;
  };
  header: {
    switchLanguage: string;
    currentLanguage: string;
  };
  hero: {
    title: string;
    subtitle: string;
  };
  pills: {
    local: string;
    free: string;
    openSource: string;
  };
  upload: {
    button: string;
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    formats: string;
    sizeLimit: string;
  };
  installBanner: {
    title: string;
    subtitle: string;
    instructionShare: string;
    shareWord: string;
    instructionAdd: string;
    addWord: string;
    dismiss: string;
    closeAria: string;
  };
  fileCard: {
    singleSelected: string;
    multipleSelected: string;
    changeFile: string;
    addFiles: string;
    clearAll: string;
    fileSize: string;
    fileType: string;
    videoLabel: string;
    imageLabel: string;
    otherLabel: string;
    originalFile: string;
  };
  presets: {
    title: string;
    current: string;
    recommended: string;
    selectLabel: string;
    changeButton: string;
  };
  share: {
    title: string;
    description: string;
    shareButton: string;
    shareMultipleButton: string;
    downloadButton: string;
    downloadMultipleButton: string;
    sharingInProgress: string;
    shareSuccess: string;
    shareCancelled: string;
    shareFailed: string;
    downloadSuccess: string;
    tipHd: string;
  };
  footer: {
    credits: string;
    github: string;
    privacy: string;
    howItWorks: string;
    disclaimer: string;
  };
  accessibility: {
    logoAria: string;
    openFileDialog: string;
  };
}

export const translations: Record<Language, AppTranslations> = {
  fr: {
    app: {
      name: 'WhatMedia',
      tagline: 'Tes statuts WhatsApp, enfin nets.',
    },
    header: {
      switchLanguage: 'Basculer en anglais',
      currentLanguage: 'FR',
    },
    hero: {
      title: 'Prépare ton statut',
      subtitle: 'Optimise tes vidéos et photos pour WhatsApp directement sur ton téléphone, sans perte inutile de netteté.',
    },
    pills: {
      local: '100 % sur ton téléphone',
      free: 'Gratuit',
      openSource: 'Open source',
    },
    upload: {
      button: 'Choisir une vidéo ou une photo',
      dropzoneTitle: 'Glisse-dépose tes fichiers ici',
      dropzoneSubtitle: 'ou clique pour parcourir tes dossiers',
      formats: 'Vidéos (MP4, MOV) et photos (JPEG, PNG, WebP, HEIC)',
      sizeLimit: 'Jusqu’à 2 Go traités localement',
    },
    installBanner: {
      title: 'Installe WhatMedia sur ton écran d’accueil',
      subtitle: 'Pour un accès instantané et une expérience plein écran.',
      instructionShare: '1. Appuie sur le bouton',
      shareWord: 'Partager',
      instructionAdd: '2. Fais défiler puis choisis',
      addWord: 'Sur l’écran d’accueil',
      dismiss: 'Ne plus afficher cette semaine',
      closeAria: 'Fermer le bandeau d’installation',
    },
    fileCard: {
      singleSelected: '1 fichier sélectionné',
      multipleSelected: '{count} fichiers sélectionnés',
      changeFile: 'Choisir un autre média',
      addFiles: 'Ajouter des fichiers',
      clearAll: 'Effacer la sélection',
      fileSize: 'Taille',
      fileType: 'Format',
      videoLabel: 'Vidéo',
      imageLabel: 'Photo',
      otherLabel: 'Média',
      originalFile: 'Fichier original',
    },
    presets: {
      title: 'Preset WhatsApp',
      current: 'Preset actuel',
      recommended: 'Recommandé',
      selectLabel: 'Choisir le profil d’optimisation',
      changeButton: 'Changer',
    },
    share: {
      title: 'Partage direct',
      description: 'Phase 1 : test du partage direct du fichier original vers WhatsApp.',
      shareButton: 'Partager sur WhatsApp',
      shareMultipleButton: 'Tout partager ({count})',
      downloadButton: 'Télécharger le fichier',
      downloadMultipleButton: 'Télécharger ({name})',
      sharingInProgress: 'Ouverture du partage...',
      shareSuccess: 'Fichier partagé avec succès !',
      shareCancelled: 'Partage annulé.',
      shareFailed: 'Le partage direct n’est pas disponible sur ce navigateur. Utilise le bouton de téléchargement ci-dessous.',
      downloadSuccess: 'Téléchargement lancé !',
      tipHd: 'Astuce : dans WhatsApp, active l’icône HD si elle s’affiche pour conserver la meilleure qualité.',
    },
    footer: {
      credits: 'Un outil libre conçu par Roger Gnanih · Nealix',
      github: 'Code source sur GitHub',
      privacy: 'Confidentialité',
      howItWorks: 'Comment ça marche',
      disclaimer: 'WhatMedia n’est ni affilié, ni sponsorisé, ni validé par WhatsApp ou Meta Platforms, Inc.',
    },
    accessibility: {
      logoAria: 'WhatMedia, accueil',
      openFileDialog: 'Ouvrir le sélecteur de fichiers',
    },
  },
  en: {
    app: {
      name: 'WhatMedia',
      tagline: 'Your WhatsApp statuses, finally crisp.',
    },
    header: {
      switchLanguage: 'Switch to French',
      currentLanguage: 'EN',
    },
    hero: {
      title: 'Prepare your status',
      subtitle: 'Optimize your videos and photos for WhatsApp directly on your phone, with no unnecessary quality loss.',
    },
    pills: {
      local: '100% on your phone',
      free: 'Free',
      openSource: 'Open source',
    },
    upload: {
      button: 'Choose a video or photo',
      dropzoneTitle: 'Drag and drop your files here',
      dropzoneSubtitle: 'or click to browse your folders',
      formats: 'Videos (MP4, MOV) and photos (JPEG, PNG, WebP, HEIC)',
      sizeLimit: 'Up to 2 GB processed locally',
    },
    installBanner: {
      title: 'Add WhatMedia to your Home Screen',
      subtitle: 'For instant access and a clean fullscreen experience.',
      instructionShare: '1. Tap the',
      shareWord: 'Share',
      instructionAdd: '2. Scroll down and tap',
      addWord: 'Add to Home Screen',
      dismiss: 'Dismiss for this week',
      closeAria: 'Close installation banner',
    },
    fileCard: {
      singleSelected: '1 file selected',
      multipleSelected: '{count} files selected',
      changeFile: 'Choose another media',
      addFiles: 'Add more files',
      clearAll: 'Clear selection',
      fileSize: 'Size',
      fileType: 'Format',
      videoLabel: 'Video',
      imageLabel: 'Photo',
      otherLabel: 'Media',
      originalFile: 'Original file',
    },
    presets: {
      title: 'WhatsApp Preset',
      current: 'Current preset',
      recommended: 'Recommended',
      selectLabel: 'Choose optimization profile',
      changeButton: 'Change',
    },
    share: {
      title: 'Direct share',
      description: 'Phase 1: testing direct sharing of original media file to WhatsApp.',
      shareButton: 'Share to WhatsApp',
      shareMultipleButton: 'Share all ({count})',
      downloadButton: 'Download file',
      downloadMultipleButton: 'Download ({name})',
      sharingInProgress: 'Opening share menu...',
      shareSuccess: 'File shared successfully!',
      shareCancelled: 'Sharing cancelled.',
      shareFailed: 'Direct sharing is not supported on this browser. Use the download button below.',
      downloadSuccess: 'Download started!',
      tipHd: 'Tip: in WhatsApp, tap the HD icon when sending to keep maximum quality.',
    },
    footer: {
      credits: 'An open-source tool built by Roger Gnanih · Nealix',
      github: 'Source code on GitHub',
      privacy: 'Privacy policy',
      howItWorks: 'How it works',
      disclaimer: 'WhatMedia is not affiliated with, endorsed, or sponsored by WhatsApp or Meta Platforms, Inc.',
    },
    accessibility: {
      logoAria: 'WhatMedia, home',
      openFileDialog: 'Open file picker dialog',
    },
  },
};
