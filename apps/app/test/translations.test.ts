import { describe, it, expect } from 'vitest';
import { translations } from '../src/i18n/translations';
import { translate } from '../src/i18n/useTranslation';

describe('translations', () => {
  it('has both FR and EN configurations', () => {
    expect(translations.fr).toBeDefined();
    expect(translations.en).toBeDefined();
  });

  it('defines exactly the same keys in FR and EN, all non-empty', () => {
    const frKeys = Object.keys(translations.fr).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(enKeys).toEqual(frKeys);
    for (const k of frKeys) {
      expect(translations.fr[k as keyof typeof translations.fr], `fr.${k}`).not.toBe('');
      expect(translations.en[k as keyof typeof translations.en], `en.${k}`).not.toBe('');
    }
  });

  it('uses the same placeholders in FR and EN', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const k of Object.keys(translations.fr) as (keyof typeof translations.fr)[]) {
      expect(vars(translations.en[k]), k).toEqual(vars(translations.fr[k]));
    }
  });

  it('contains required WhatsApp non-affiliation disclaimer', () => {
    expect(translations.fr.disclaimer).toContain('WhatsApp');
    expect(translations.fr.disclaimer).toContain('Meta');
    expect(translations.en.disclaimer).toContain('WhatsApp');
  });

  it('never promises to bypass WhatsApp compression', () => {
    const all = JSON.stringify(translations).toLowerCase();
    for (const word of ['contourn', 'bypass', 'désactiv', 'disable compression']) {
      expect(all).not.toContain(word);
    }
  });

  it('fills placeholders', () => {
    expect(translate('fr', 'processingPart', { i: 2, n: 3 })).toBe('Partie 2 sur 3');
    expect(translate('en', 'processingPart', { i: 2, n: 3 })).toBe('Part 2 of 3');
  });
});
