import type { ImageMetadata } from 'astro';

/**
 * Galerías de fotos: se arman solas con lo que haya en cada carpeta.
 *
 * - `src/assets/modelo/`  → sección «Modelo»
 * - `src/assets/en-vivo/` → sección «En vivo»
 *
 * El orden es el del nombre del archivo (prefijos 01-, 02-, …) y el nombre
 * también arma la descripción para accesibilidad y Google:
 * «03-backstage-sillon-verde.jpg» → «Desobediente, foto de modelaje: backstage sillon verde».
 */

type Modulos = Record<string, { default: ImageMetadata }>;

export interface Foto {
  src: ImageMetadata;
  alt: string;
}

const armar = (archivos: Modulos, prefijo: string): Foto[] =>
  Object.entries(archivos)
    .sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true }))
    .map(([ruta, mod]) => {
      const nombre = ruta
        .split('/')
        .pop()!
        .replace(/\.[^.]+$/, '')
        .replace(/^\d+[-_\s]*/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      return { src: mod.default, alt: nombre ? `${prefijo}: ${nombre}` : prefijo };
    });

export const fotosModelo = armar(
  import.meta.glob<{ default: ImageMetadata }>('../assets/modelo/*.{jpg,jpeg,png,webp,avif}', { eager: true }),
  'Desobediente, foto de modelaje',
);

export const fotosEnVivo = armar(
  import.meta.glob<{ default: ImageMetadata }>('../assets/en-vivo/*.{jpg,jpeg,png,webp,avif}', { eager: true }),
  'Desobediente en vivo',
);
