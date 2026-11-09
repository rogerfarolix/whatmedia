import { describe, it, expect } from 'vitest';
import { translations } from '../src/i18n/translations';

describe('translations', () => {
  it('has both FR and EN configurations', () => {
    expect(translations.fr).toBeDefined();
    expect(translations.en).toBeDefined();
  });

  it('contains matching non-empty keys for every section', () => {
    const frKeys = Object.keys(translations.fr);
    const enKeys = Object.keys(translations.en);
    expect(frKeys.length).toBeGreaterThan(0);
    expect(enKeys.length).toBe(frKeys.length);
  });

  it('contains required WhatsApp non-affiliation disclaimer', () => {
    expect(translations.fr.footer.disclaimer).toContain('WhatsApp');
    expect(translations.fr.footer.disclaimer).toContain('Meta');
    expect(translations.en.footer.disclaimer).toContain('WhatsApp');
  });
});
