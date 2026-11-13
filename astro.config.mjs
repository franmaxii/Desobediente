// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Cuando haya dominio, completalo acá (ej. 'https://tudominio.com').
  // Se usa para las URLs absolutas de la vista previa al compartir (og:image).
  // site: 'https://…',

  // Las fuentes se descargan en el build y se sirven desde el propio sitio.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'UnifrakturCook',
      cssVariable: '--font-gothic',
      weights: [700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Grenze Gotisch',
      cssVariable: '--font-title',
      weights: [900],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Barlow Condensed',
      cssVariable: '--font-cond',
      weights: [500, 600, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Barlow',
      cssVariable: '--font-body',
      weights: [400, 500],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
});
