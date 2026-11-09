import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://whatmedia.nealix.org',
  vite: {
    plugins: [tailwindcss()],
  },
});
