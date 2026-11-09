import { describe, it, expect } from 'vitest';
import { presets, whatsappLimits } from '../src/index.js';

describe('@whatmedia/core basic sanity', () => {
  it('exports presets and limits from config', () => {
    expect(presets['status-hd']).toBeDefined();
    expect(whatsappLimits.maxMediaBytes).toBe(16000000);
  });
});

