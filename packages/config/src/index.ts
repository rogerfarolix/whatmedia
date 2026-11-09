export {
  whatsappLimitsSchema,
  presetSchema,
  presetsMapSchema,
  type WhatsAppLimits,
  type VideoPreset,
  type ImagePreset,
  type Preset,
  type PresetsMap,
  type PresetId,
} from './schemas.js';

import presetsJson from './presets.json' with { type: 'json' };
import whatsappLimitsJson from './whatsapp-limits.json' with { type: 'json' };
import { presetsMapSchema, whatsappLimitsSchema } from './schemas.js';

/** Validated presets — single source of truth */
export const presets = presetsMapSchema.parse(presetsJson);

/** Validated WhatsApp limits — single source of truth */
export const whatsappLimits = whatsappLimitsSchema.parse(whatsappLimitsJson);

