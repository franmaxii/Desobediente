import type { ImageMetadata } from 'astro';
import { sitio, imagen } from '../lib/contenido';

export interface Credito {
  rol: string;
  /** Usuario de Instagram, sin @. */
  instagram: string;
}

export interface Obra {
  titulo: string;
  formato: string;
  genero: string;
  personaje?: string;
  imagen: ImageMetadata;
  imagenAlt: string;
  imagenVertical: boolean;
  sinopsis: string;
  cita?: string;
  equipo: Credito[];
  notaEquipo?: string;
  detrasDeEscena: { src: ImageMetadata; alt: string }[];
}

export const actrizTitulo = sitio.actriz.titulo;

export const obras: Obra[] = sitio.actriz.obras.map((o) => ({
  ...o,
  personaje: o.personaje || undefined,
  cita: o.cita || undefined,
  notaEquipo: o.notaEquipo || undefined,
  imagen: imagen(o.imagen),
  detrasDeEscena: o.detrasDeEscena.map((d) => ({ src: imagen(d.imagen), alt: d.alt })),
}));
