/**
 * Carga el contenido editable (src/content/*.json), lo valida y resuelve imágenes y audio.
 * Si algo no cumple las reglas o falta un archivo, el build se corta con un mensaje claro
 * y Cloudflare sigue mostrando la versión anterior del sitio.
 */
import type { ImageMetadata } from 'astro';
import sitioJson from '../content/sitio.json';
import galeriasJson from '../content/galerias.json';
import { esquemaSitio, esquemaGalerias, describirErrores } from '../content/esquema';

const imagenes = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
});
const audios = import.meta.glob<string>('/src/assets/**/*.mp3', { eager: true, query: '?url', import: 'default' });

export function imagen(ruta: string): ImageMetadata {
  const mod = imagenes[`/src/assets/${ruta}`];
  if (!mod) throw new Error(`Falta la imagen «src/assets/${ruta}» que usa el contenido.`);
  return mod.default;
}

export function audio(ruta: string): string {
  const url = audios[`/src/assets/${ruta}`];
  if (!url) throw new Error(`Falta el audio «src/assets/${ruta}» que usa el contenido.`);
  return url;
}

/** Todas las imágenes disponibles, por ruta relativa a src/assets (las usa el panel). */
export const todasLasImagenes = Object.fromEntries(
  Object.entries(imagenes).map(([k, v]) => [k.replace('/src/assets/', ''), v.default]),
);

const s = esquemaSitio.safeParse(sitioJson);
if (!s.success) throw new Error(`src/content/sitio.json tiene errores:\n${describirErrores(s.error)}`);

const g = esquemaGalerias.safeParse(galeriasJson);
if (!g.success) throw new Error(`src/content/galerias.json tiene errores:\n${describirErrores(g.error)}`);

export const sitio = s.data;
export const galeriasDatos = g.data;
