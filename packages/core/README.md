# @whatmedia/core

In-browser media engine behind [WhatMedia](https://whatmedia.nealix.org): it prepares videos and photos for WhatsApp status and chats with WebCodecs, Mediabunny and Canvas, without uploading anything.

## What it does

- **Analysis**: duration, resolution, rotation, frame rate, codecs, audio bitrate, HDR (HLG, PQ, Dolby Vision).
- **Planning** (`plan()`, a pure function): splits videos into 30, 60 or 90 second parts and computes the highest bitrate that keeps each part under the 16 MB WhatsApp limit, falling back to 720p when needed. Never upscales.
- **Encoding**: H.264 + AAC in a fast-start MP4 through the browser's hardware encoder. Every part is checked after encoding and re-encoded with a lower bitrate, a smaller picture or shorter parts if it is still over 16 MB.
- **HDR to SDR**: frames are converted to BT.709 colours before encoding.
- **Photos**: proportional downscaling in steps, EXIF orientation applied, all metadata removed, sRGB JPEG output.

All compression values come from [`@whatmedia/config`](../config/src) (`presets.json`, `whatsapp-limits.json`).

## Installation

The package is not published on npm yet. Use it from the monorepo (pnpm workspace):

```json
{ "dependencies": { "@whatmedia/core": "workspace:*" } }
```

## Usage

```ts
import { probe, plan, run, detectCapabilities } from '@whatmedia/core';

const caps = await detectCapabilities();
const info = await probe(file);
const p = plan(info, 'status-hd', caps, { segmentDurationSec: 30 });

const parts = await run(file, p, {
  onProgress: (x) => console.log(`Part ${x.segmentIndex}/${x.segmentCount}: ${Math.round(x.ratio * 100)}%`),
});
// parts: OutputFile[] ({ file, index, totalSegments, durationSec, sizeBytes }), each under 16 MB
```

Errors are thrown as `MediaError` with a `code` (`E_UNSUPPORTED_CODEC`, `E_UNSUPPORTED_IMAGE`, `E_TOO_LARGE`, `E_ABORTED`…) and, when relevant, the `partialOutputs` already produced.

## Browser support

Safari 16.4+ (iOS, iPadOS, macOS) and recent Chrome, Edge and Android browsers with WebCodecs H.264 encoding. Use `detectCapabilities()` to check before running.

## License

[MIT](../../LICENSE), Roger Gnanih / Nealix.
