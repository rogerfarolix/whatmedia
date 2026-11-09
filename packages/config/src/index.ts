export {
  whatsappLimitsSchema,
  presetSchema,
  presetsMapSchema,
  measurementsSchema,
  measurementItemSchema,
  type WhatsAppLimits,
  type VideoPreset,
  type ImagePreset,
  type Preset,
  type PresetsMap,
  type PresetId,
  type MeasurementItem,
  type Measurements,
} from './schemas.js';

import presetsJson from './presets.json' with { type: 'json' };
import whatsappLimitsJson from './whatsapp-limits.json' with { type: 'json' };
import measurementsJson from './measurements.json' with { type: 'json' };
import { presetsMapSchema, whatsappLimitsSchema, measurementsSchema } from './schemas.js';

/** Validated presets — single source of truth */
export const presets = presetsMapSchema.parse(presetsJson);

/** Validated WhatsApp limits — single source of truth */
export const whatsappLimits = whatsappLimitsSchema.parse(whatsappLimitsJson);

/** Validated lab measurements — single source of truth */
export const measurements = measurementsSchema.parse(measurementsJson);


