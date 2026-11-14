import type { ImageMetadata } from 'astro';

/**
 * Galerías de fotos: se arman solas con lo que haya en cada carpeta.
 *
 * - `src/assets/modelo/`  → sección «Modelo»
 * - `src/assets/en-vivo/` → sección «En vivo»
 *
 * Orden: por el número del nombre (01-, 02-, …), aunque estén en subcarpetas distintas.
 * Descripción (accesibilidad y Google): sale del nombre, sin el número.
 * Crédito: si la foto está en una subcarpeta con el nombre de un fotógrafo de la lista
 * de abajo (ej. `modelo/ivo-barrios/`), se muestra su crédito.
 *
 * Para que la grilla quede pareja, conviene que la cantidad sea múltiplo de 4 (4, 8, 12…).
 */

export interface Fotografo {
  nombre: string;
  url: string;
}

export const fotografos: Record<string, Fotografo> = {
  'ivo-barrios': { nombre: 'Ivo Barrios', url: 'https://www.instagram.com/ivobarrios.fotos' },
  'dado-producciones': { nombre: 'Dado Producciones', url: 'https://www.instagram.com/dado.producciones' },
};

export interface Foto {
  src: ImageMetadata;
  alt: string;
  fotografo?: Fotografo;
}

type Modulos = Record<string, { default: ImageMetadata }>;

const armar = (archivos: Modulos, prefijo: string): Foto[] =>
  Object.entries(archivos)
    .map(([ruta, mod]) => {
      const partes = ruta.split('/');
      const archivo = partes.pop()!;
      const carpeta = partes.pop() ?? '';
      const nombre = archivo
        .replace(/\.[^.]+$/, '')
        .replace(/^\d+[-_\s]*/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      return {
        archivo,
        foto: {
          src: mod.default,
          alt: nombre ? `${prefijo}: ${nombre}` : prefijo,
          fotografo: fotografos[carpeta],
        } satisfies Foto,
      };
    })
    .sort((a, b) => a.archivo.localeCompare(b.archivo, 'es', { numeric: true }))
    .map(({ foto }) => foto);

/** Fotógrafos que aparecen en una galería, sin repetir (para los créditos). */
export const creditos = (fotos: Foto[]): Fotografo[] => [
  ...new Map(fotos.filter((f) => f.fotografo).map((f) => [f.fotografo!.url, f.fotografo!])).values(),
];

export const fotosModelo = armar(
  import.meta.glob<{ default: ImageMetadata }>('../assets/modelo/**/*.{jpg,jpeg,png,webp,avif}', { eager: true }),
  'Desobediente, foto de modelaje',
);

export const fotosEnVivo = armar(
  import.meta.glob<{ default: ImageMetadata }>('../assets/en-vivo/**/*.{jpg,jpeg,png,webp,avif}', { eager: true }),
  'Desobediente en vivo',
);
