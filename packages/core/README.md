# @whatmedia/core

> Pure client-side media optimization engine powered by **WebCodecs**, **Mediabunny**, and **Canvas** for WhatsApp status and messaging formats.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- ⚡ **Hardware-Accelerated** : Uses in-browser `VideoDecoder` and `VideoEncoder` for blazing fast AVC/H.264 transcoding.
- 🔒 **Local-First & Private** : Zero network requests. Media stays on the user's device.
- 🎨 **HDR to SDR Tone-Mapping** : Detects HLG, PQ and Dolby Vision, avoiding washed-out colors.
- ✂️ **Smart Segmentation** : Calculates bitrate budgets and splits videos into calibrated 30s or 45s parts without awkward cutoffs.
- 📸 **Photo Optimization** : Non-destructive proportional downscaling, EXIF orientation correction and metadata stripping.

## Installation

```bash
npm install @whatmedia/core
# or
pnpm add @whatmedia/core
```

## Quick Start

```ts
import { probe, plan, run, detectCapabilities } from '@whatmedia/core';

// 1. Detect hardware capabilities
const caps = await detectCapabilities();

// 2. Probe input video/image
const info = await probe(file);

// 3. Generate optimal encoding plan
const encodingPlan = plan(info, 'status-hd', caps);

// 4. Run optimization pipeline
const outputFiles = await run(file, encodingPlan, {
  onProgress: (p) => {
    console.log(`Phase: ${p.phase}, Part ${p.segmentIndex}/${p.segmentCount}: ${Math.round(p.ratio * 100)}%`);
  },
});

console.log('Optimized segments:', outputFiles);
```

## License

MIT © [Roger Gnanih](https://github.com/rogerfarolix)

