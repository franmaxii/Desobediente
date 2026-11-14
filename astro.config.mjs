// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  // Dominio oficial: se usa para la URL canónica, el sitemap y la vista previa al compartir.
  site: 'https://desobediente.franmaxi.lol',

  integrations: [
    // el panel de edición (/admin) está hecho con Svelte; el sitio público no carga nada de esto
    svelte(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/admin') && !page.includes('version.json'),
    }),
  ],

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
