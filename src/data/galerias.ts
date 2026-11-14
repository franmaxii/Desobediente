import type { ImageMetadata } from 'astro';
import { galeriasDatos, imagen } from '../lib/contenido';

/**
 * Galerías de fotos. El contenido (fotos, orden, descripciones, fotógrafos) se edita desde
 * el panel (/admin) y vive en src/content/galerias.json.
 */

export interface Fotografo {
  nombre: string;
  url: string;
}

export interface Foto {
  src: ImageMetadata;
  alt: string;
  fotografo?: Fotografo;
}

export type GaleriaId = keyof typeof galeriasDatos.galerias;

const PREFIJOS: Record<GaleriaId, string> = {
  modelo: 'Desobediente, foto de modelaje',
  'en-vivo': 'Desobediente en vivo',
};

const fotografos = new Map<string, Fotografo>(
  galeriasDatos.fotografos.map((f) => [f.id, { nombre: f.nombre, url: `https://www.instagram.com/${f.instagram}` }]),
);

const armar = (id: GaleriaId): Foto[] =>
  galeriasDatos.galerias[id].fotos.map((f) => ({
    src: imagen(f.imagen),
    alt: `${PREFIJOS[id]}: ${f.descripcion}`,
    fotografo: f.fotografo ? fotografos.get(f.fotografo) : undefined,
  }));

/** Textos de cada galería (título, encabezado y botón). */
export const galerias = galeriasDatos.galerias;

export const fotosModelo = armar('modelo');
export const fotosEnVivo = armar('en-vivo');

/** Fotógrafos que aparecen en una galería, sin repetir (para los créditos). */
export const creditos = (fotos: Foto[]): Fotografo[] => [
  ...new Map(fotos.filter((f) => f.fotografo).map((f) => [f.fotografo!.url, f.fotografo!])).values(),
];
