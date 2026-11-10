import { describe, it, expect } from 'vitest';
import { sniffMediaType, toMediaInfo } from '../src/ffmpeg/probe.js';

const ftyp = (brand: string) =>
  Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from(`ftyp${brand}`), Buffer.alloc(16)]);

describe('sniffMediaType', () => {
  it('recognises containers by signature, not extension', () => {
    expect(sniffMediaType(ftyp('isom'))).toBe('video');
    expect(sniffMediaType(ftyp('qt  '))).toBe('video');
    expect(sniffMediaType(ftyp('heic'))).toBe('image');
    expect(sniffMediaType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array<number>(12).fill(0)]))).toBe('image');
    expect(sniffMediaType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('image');
    expect(sniffMediaType(Buffer.from('#!/bin/sh echo nope'))).toBeNull();
  });
});

describe('toMediaInfo', () => {
  it('reads an iPhone HLG portrait clip (rotation, HDR, audio bitrate)', () => {
    const info = toMediaInfo(
      {
        format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2', duration: '12.5' },
        streams: [
          {
            codec_type: 'video',
            codec_name: 'hevc',
            width: 3840,
            height: 2160,
            avg_frame_rate: '30000/1001',
            color_transfer: 'arib-std-b67',
            side_data_list: [{ side_data_type: 'Display Matrix', rotation: -90 }],
          },
          { codec_type: 'audio', codec_name: 'aac', bit_rate: '192000' },
        ],
      },
      100,
      'video',
    );
    expect(info).toMatchObject({
      kind: 'video',
      width: 2160,
      height: 3840,
      rotation: 270,
      hdr: 'hlg',
      fps: 30,
      audioBitrate: 192000,
    });
  });

  it('detects PQ HDR and still images', () => {
    expect(
      toMediaInfo(
        {
          format: { format_name: 'mov,mp4', duration: '3' },
          streams: [{ codec_type: 'video', width: 10, height: 10, color_transfer: 'smpte2084' }],
        },
        1,
        'video',
      ).hdr,
    ).toBe('pq');
    expect(
      toMediaInfo(
        { format: { format_name: 'png_pipe' }, streams: [{ codec_type: 'video', codec_name: 'png', width: 4, height: 2 }] },
        1,
        'image',
      ).kind,
    ).toBe('image');
  });

  it('throws when there is no picture at all', () => {
    expect(() => toMediaInfo({ streams: [{ codec_type: 'audio' }] }, 1, 'video')).toThrow();
  });
});
