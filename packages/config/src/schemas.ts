import { z } from 'zod';

// --- WhatsApp Limits Schema ---

export const whatsappLimitsSchema = z.object({
  measuredAt: z.string().nullable(),
  maxStatusVideoSec: z.number().int().positive(),
  allowedStatusVideoSec: z.array(z.number().int().positive()),
  maxMediaBytes: z.number().int().positive(),
  safetyMarginBytes: z.number().int().nonnegative(),
});

export type WhatsAppLimits = z.infer<typeof whatsappLimitsSchema>;

// --- Color Schema ---

const colorSchema = z.object({
  primaries: z.enum(['bt709']),
  transfer: z.enum(['bt709']),
  matrix: z.enum(['bt709']),
  range: z.enum(['limited', 'full']),
});

// --- Video Preset Schema ---

const videoConfigSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().int().positive(),
  codec: z.string(),
  profile: z.enum(['high', 'main', 'baseline']),
  level: z.string(),
  targetBps: z.number().int().positive(),
  minBps: z.number().int().positive(),
  keyframeIntervalSec: z.number().positive(),
});

const audioConfigSchema = z.object({
  bitrate: z.number().int().positive(),
  sampleRate: z.number().int().positive(),
  channels: z.number().int().positive(),
});

const imageConfigSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  quality: z.number().min(0).max(1),
  format: z.enum(['jpeg']),
});

const i18nString = z.object({
  fr: z.string(),
  en: z.string(),
});

const videoPresetSchema = z.object({
  id: z.string(),
  label: i18nString,
  description: i18nString,
  kind: z.literal('video'),
  default: z.boolean().optional(),
  video: videoConfigSchema,
  audio: audioConfigSchema,
  color: colorSchema,
  segmentSec: z.number().int().positive().nullable(),
});

const imagePresetSchema = z.object({
  id: z.string(),
  label: i18nString,
  description: i18nString,
  kind: z.literal('image'),
  default: z.boolean().optional(),
  image: imageConfigSchema,
  color: colorSchema,
});

export const presetSchema = z.discriminatedUnion('kind', [videoPresetSchema, imagePresetSchema]);

export const presetsMapSchema = z.record(z.string(), presetSchema);

export type VideoPreset = z.infer<typeof videoPresetSchema>;
export type ImagePreset = z.infer<typeof imagePresetSchema>;
export type Preset = z.infer<typeof presetSchema>;
export type PresetsMap = z.infer<typeof presetsMapSchema>;
export type PresetId = 'status-hd' | 'status-light' | 'chat-hd' | 'chat-compact' | 'status-photo';

export const measurementItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  durationSec: z.number(),
  metrics: z.object({
    directUpload: z.object({
      vmaf: z.number(),
      ssim: z.number(),
      psnr: z.number(),
      bitrateKbps: z.number(),
    }),
    whatmedia: z.object({
      vmaf: z.number(),
      ssim: z.number(),
      psnr: z.number(),
      bitrateKbps: z.number(),
    }),
    gain: z.object({
      vmafDelta: z.number(),
      vmafPercent: z.number(),
      ssimDelta: z.number(),
    }),
  }),
});

export const measurementsSchema = z.object({
  timestamp: z.string(),
  environment: z.object({
    ffmpegVersion: z.string(),
    platform: z.string(),
    protocol: z.string(),
  }),
  summary: z.object({
    medianVmafDirect: z.number(),
    medianVmafWhatMedia: z.number(),
    medianGainPercent: z.number(),
    p95GainPercent: z.number(),
  }),
  results: z.array(measurementItemSchema),
});

export type MeasurementItem = z.infer<typeof measurementItemSchema>;
export type Measurements = z.infer<typeof measurementsSchema>;


