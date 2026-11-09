export interface SectionTranslations {
  [key: string]: string;
}

export interface StructuredTranslations {
  app: SectionTranslations;
  hero: SectionTranslations;
  fileCard: SectionTranslations;
  share: SectionTranslations;
  footer: SectionTranslations;
  pills: SectionTranslations;
  accessibility: SectionTranslations;
  header: SectionTranslations;
}

export const fr = {
  appTitle: 'WhatMedia',
  heroTitle: 'Prépare ton statut',
  heroSubtitle: 'Photos et vidéos nettes sur WhatsApp, traitées 100% sur ton téléphone.',
  chooseMedia: 'Choisir une vidéo ou une photo',
  dragDropHint: 'ou glisse-dépose ton fichier ici',
  analyzingMedia: 'Analyse du fichier...',
  analysisResult: 'Analyse terminée',
  duration: 'Durée',
  resolution: 'Résolution',
  fileSize: 'Taille',
  targetSegments: 'Découpage prévu',
  parts: 'parties',
  singlePart: '1 seule partie',
  changeFile: 'Changer de fichier',
  startOptimization: 'Optimiser maintenant',
  optimizing: 'Optimisation en cours...',
  processingPart: 'Traitement de la partie',
  processingMedia: 'Traitement de la vidéo...',
  localProcessingNotice: 'Traitement 100% local — tes fichiers ne quittent jamais ton téléphone.',
  cancel: 'Annuler',
  readyToPost: 'Fichiers prêts pour ton statut !',
  partsGenerated: 'parties prêtes à être partagées',
  onePartGenerated: 'Vidéo optimisée et calibrée',
  part: 'Partie',
  sharing: 'Partage...',
  shareToStatus: 'Partager',
  saveAllFiles: 'Tout télécharger',
  optimizeAnother: 'Optimiser un autre média',
  presetStatusHd: 'Statut HD (1080p)',
  presetStatusLight: 'Statut Léger (720p)',
  presetChatHd: 'Discussion HD',
  presetStatusPhoto: 'Photo Statut',
  disclaimer: 'WhatMedia n\'est pas affilié à WhatsApp ou Meta Platforms, Inc.',
  installPrompt: 'Installe WhatMedia sur ton écran d\'accueil',
  installInstructions: 'Sur Safari : Appuie sur Partager puis Sur l\'écran d\'accueil.',
  dismiss: 'Ignorer',
  pill1: '100 % sur ton téléphone',
  pill2: 'Gratuit',
  pill3: 'Open source',
  selectedFiles: 'Fichier sélectionné',
  remove: 'Supprimer',
  shareDirectly: 'Partager directement',
  footer: {
    disclaimer: 'WhatMedia n\'est pas affilié à WhatsApp ou Meta Platforms, Inc. Un projet open source Nealix.',
  },
};

export const en = {
  appTitle: 'WhatMedia',
  heroTitle: 'Prepare your status',
  heroSubtitle: 'Sharp photos and videos on WhatsApp, processed 100% on your device.',
  chooseMedia: 'Choose a video or photo',
  dragDropHint: 'or drag and drop your file here',
  analyzingMedia: 'Analyzing media...',
  analysisResult: 'Analysis complete',
  duration: 'Duration',
  resolution: 'Resolution',
  fileSize: 'File size',
  targetSegments: 'Planned split',
  parts: 'parts',
  singlePart: '1 single part',
  changeFile: 'Change file',
  startOptimization: 'Optimize now',
  optimizing: 'Optimization in progress...',
  processingPart: 'Processing part',
  processingMedia: 'Processing video...',
  localProcessingNotice: '100% on-device processing — your files never leave your phone.',
  cancel: 'Cancel',
  readyToPost: 'Ready for your status!',
  partsGenerated: 'parts ready to be shared',
  onePartGenerated: 'Video calibrated and optimized',
  part: 'Part',
  sharing: 'Sharing...',
  shareToStatus: 'Share',
  saveAllFiles: 'Download all',
  optimizeAnother: 'Optimize another media',
  presetStatusHd: 'Status HD (1080p)',
  presetStatusLight: 'Status Light (720p)',
  presetChatHd: 'Chat HD',
  presetStatusPhoto: 'Status Photo',
  disclaimer: 'WhatMedia is not affiliated with WhatsApp or Meta Platforms, Inc.',
  installPrompt: 'Install WhatMedia on your home screen',
  installInstructions: 'On Safari: Tap Share then Add to Home Screen.',
  dismiss: 'Dismiss',
  pill1: '100% on-device',
  pill2: 'Free',
  pill3: 'Open source',
  selectedFiles: 'Selected file',
  remove: 'Remove',
  shareDirectly: 'Share directly',
  footer: {
    disclaimer: 'WhatMedia is not affiliated with WhatsApp or Meta Platforms, Inc. Open source by Nealix.',
  },
};

export type Translations = typeof fr;

export const translations = {
  fr,
  en,
};
