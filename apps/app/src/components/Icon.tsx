import React from 'react';

/** Line icons (24×24, 2px stroke), decorative by default. */
const PATHS = {
  check: 'M5 13l4 4L19 7',
  video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  photo:
    'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  download: 'M12 4v11m0 0l-4-4m4 4l4-4M5 19h14',
  share: 'M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  close: 'M6 6l12 12M18 6L6 18',
  lock: 'M8 11V8a4 4 0 118 0v3M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1z',
  gift: 'M20 12v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8M2 8h20v4H2zM12 21V8m0 0H7.5a2.5 2.5 0 110-5C11 3 12 8 12 8zm0 0h4.5a2.5 2.5 0 100-5C13 3 12 8 12 8z',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
} as const;

export type IconName = keyof typeof PATHS;

export const Icon: React.FC<{ name: IconName; className?: string; strokeWidth?: number }> = ({
  name,
  className = 'w-4 h-4',
  strokeWidth = 2,
}) => (
  <svg aria-hidden="true" focusable="false" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
    <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[name]} />
  </svg>
);
