import { describe, it, expect } from 'vitest';
import { presetsMapSchema, whatsappLimitsSchema, measurementsSchema } from '../src/schemas.js';
import presetsJson from '../src/presets.json' with { type: 'json' };
import whatsappLimitsJson from '../src/whatsapp-limits.json' with { type: 'json' };
import measurementsJson from '../src/measurements.json' with { type: 'json' };

describe('presets.json', () => {
  it('validates against the Zod schema', () => {
    const result = presetsMapSchema.safeParse(presetsJson);
    expect(result.success).toBe(true);
  });

  it('has a default preset', () => {
    const presets = presetsMapSchema.parse(presetsJson);
    const defaults = Object.values(presets).filter(
      (p) => 'default' in p && p.default === true,
    );
    expect(defaults.length).toBe(1);
  });

  it('has status-hd as the default', () => {
    const presets = presetsMapSchema.parse(presetsJson);
    const statusHd = presets['status-hd'];
    expect(statusHd).toBeDefined();
    expect('default' in statusHd! && statusHd.default).toBe(true);
  });

  it('never has video bitrate below minBps', () => {
    const presets = presetsMapSchema.parse(presetsJson);
    for (const preset of Object.values(presets)) {
      if (preset.kind === 'video') {
        expect(preset.video.targetBps).toBeGreaterThanOrEqual(preset.video.minBps);
      }
    }
  });
});

describe('whatsapp-limits.json', () => {
  it('validates against the Zod schema', () => {
    const result = whatsappLimitsSchema.safeParse(whatsappLimitsJson);
    expect(result.success).toBe(true);
  });

  it('has safetyMarginBytes less than maxMediaBytes', () => {
    const limits = whatsappLimitsSchema.parse(whatsappLimitsJson);
    expect(limits.safetyMarginBytes).toBeLessThan(limits.maxMediaBytes);
  });
});

describe('measurements.json', () => {
  it('validates against the measurements schema', () => {
    const result = measurementsSchema.safeParse(measurementsJson);
    expect(result.success).toBe(true);
  });

  it('never publishes results without a real WhatsApp round-trip', () => {
    const data = measurementsSchema.parse(measurementsJson);
    if (data.status === 'pending') {
      expect(data.results).toHaveLength(0);
      expect(data.summary).toBeNull();
    } else {
      expect(data.method).toBe('whatsapp-roundtrip');
      expect(data.whatsappVersion).toBeTruthy();
    }
  });

  it('rejects "published" data that lacks its provenance', () => {
    const r = measurementsSchema.safeParse({
      status: 'published',
      method: null,
      timestamp: null,
      whatsappVersion: null,
      environment: null,
      summary: null,
      results: [],
    });
    expect(r.success).toBe(false);
  });
});
