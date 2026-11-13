/**
 * Site map and shared strings for the landing, in French (default) and English.
 * Every page is declared once here: navigation, language switch, hreflang, canonical URLs and the
 * XML sitemap are all derived from this table, so a page can never be missing from one of them.
 */
export type Lang = 'fr' | 'en';

export const SITE_URL = 'https://whatmedia.nealix.org';
export const REPO_URL = 'https://github.com/rogerfarolix/whatmedia';
export const CONTACT_EMAIL = 'contact@nealix.org';

export const routes = {
  home: { fr: '/', en: '/en/' },
  features: { fr: '/fonctionnalites/', en: '/en/features/' },
  howItWorks: { fr: '/comment-ca-marche/', en: '/en/how-it-works/' },
  measurements: { fr: '/mesures/', en: '/en/measurements/' },
  statistics: { fr: '/statistiques/', en: '/en/statistics/' },
  faq: { fr: '/faq/', en: '/en/faq/' },
  about: { fr: '/a-propos/', en: '/en/about/' },
  contact: { fr: '/contact/', en: '/en/contact/' },
  privacy: { fr: '/confidentialite/', en: '/en/privacy/' },
  legal: { fr: '/mentions/', en: '/en/legal/' },
  terms: { fr: '/conditions/', en: '/en/terms/' },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof routes;
export type Alternates = Record<Lang, string>;

export const absolute = (path: string) => new URL(path, SITE_URL).href;

export const ui = {
  fr: {
    skip: 'Aller au contenu',
    navLabel: 'Navigation principale',
    menuOpen: 'Ouvrir le menu',
    openApp: 'Ouvrir l’app',
    switchTo: 'English version',
    newTab: '(nouvel onglet)',
    breadcrumbHome: 'Accueil',
    nav: {
      features: 'Fonctionnalités',
      howItWorks: 'Comment ça marche',
      faq: 'FAQ',
      about: 'À propos',
      contact: 'Contact',
    },
    footer: {
      tagline:
        'Outil gratuit et open source qui prépare tes vidéos et photos pour les statuts WhatsApp, directement sur ton téléphone.',
      product: 'Produit',
      project: 'Projet',
      legalCol: 'Informations légales',
      measurements: 'Mesures',
      statistics: 'Statistiques',
      privacy: 'Confidentialité',
      legal: 'Mentions légales',
      terms: 'Conditions d’utilisation',
      source: 'Code source',
      disclaimer:
        'WhatMedia est un projet indépendant. Il n’est ni affilié, ni sponsorisé, ni validé par WhatsApp LLC ou Meta Platforms, Inc. WhatsApp est une marque de Meta Platforms, Inc.',
      credit: 'Un projet Nealix, conçu par Roger Gnanih. Licence MIT.',
    },
  },
  en: {
    skip: 'Skip to content',
    navLabel: 'Main navigation',
    menuOpen: 'Open menu',
    openApp: 'Open the app',
    switchTo: 'Version française',
    newTab: '(new tab)',
    breadcrumbHome: 'Home',
    nav: {
      features: 'Features',
      howItWorks: 'How it works',
      faq: 'FAQ',
      about: 'About',
      contact: 'Contact',
    },
    footer: {
      tagline:
        'Free, open source tool that prepares your videos and photos for WhatsApp status, right on your phone.',
      product: 'Product',
      project: 'Project',
      legalCol: 'Legal',
      measurements: 'Measurements',
      statistics: 'Statistics',
      privacy: 'Privacy',
      legal: 'Legal notice',
      terms: 'Terms of use',
      source: 'Source code',
      disclaimer:
        'WhatMedia is an independent project. It is not affiliated with, sponsored or endorsed by WhatsApp LLC or Meta Platforms, Inc. WhatsApp is a trademark of Meta Platforms, Inc.',
      credit: 'A Nealix project, built by Roger Gnanih. MIT License.',
    },
  },
} as const;
