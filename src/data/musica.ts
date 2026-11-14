import type { ImageMetadata } from 'astro';
import { sitio, imagen, audio } from '../lib/contenido';

export interface Videoclip {
  titulo: string;
  youtubeId: string;
  /** Fecha de publicación, formato ISO (AAAA-MM-DD). */
  fecha: string;
  miniatura: ImageMetadata;
  /** Texto corto. Admite links con [texto](url). */
  texto: string;
}

export interface ParteEP extends Videoclip {
  parte: string;
}

/** El single que suena en el reproductor. */
export const single = {
  ...sitio.single,
  audio: audio(sitio.single.audio),
  portada: imagen(sitio.single.portada),
};

export const ep = {
  ...sitio.ep,
  partes: sitio.ep.partes.map((p): ParteEP => ({ ...p, miniatura: imagen(p.miniatura) })),
};

export const videoclipsTitulo = sitio.videoclips.titulo;

export const videoclips: Videoclip[] = sitio.videoclips.items.map((v) => ({ ...v, miniatura: imagen(v.miniatura) }));
