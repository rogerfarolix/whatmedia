import { describe, it, expect } from 'vitest';
import { translations } from '../src/i18n/translations';

describe('translations', () => {
  it('has both FR and EN configurations', () => {
    expect(translations.fr).toBeDefined();
    expect(translations.en).toBeDefined();
  });

  it('contains matching non-empty keys for every section', () => {
    const frSections = Object.keys(translations.fr) as (keyof typeof translations.fr)[];
    const enSections = Object.keys(translations.en) as (keyof typeof translations.en)[];

    expect(frSections.sort()).toEqual(enSections.sort());

    for (const section of frSections) {
      const frObj = translations.fr[section];
      const enObj = translations.en[section];

      const frKeys = Object.keys(frObj);
      const enKeys = Object.keys(enObj);

      expect(frKeys.sort()).toEqual(enKeys.sort());

      for (const k of frKeys) {
        const frVal = (frObj as Record<string, string>)[k];
        const enVal = (enObj as Record<string, string>)[k];

        expect(typeof frVal).toBe('string');
        expect(typeof enVal).toBe('string');
        expect(frVal!.length).toBeGreaterThan(0);
        expect(enVal!.length).toBeGreaterThan(0);
      }
    }
  });

  it('contains required WhatsApp non-affiliation disclaimer', () => {
    expect(translations.fr.footer.disclaimer).toContain('WhatsApp');
    expect(translations.fr.footer.disclaimer).toContain('Meta');
    expect(translations.en.footer.disclaimer).toContain('WhatsApp');
    expect(translations.en.footer.disclaimer).toContain('Meta');
  });
});
