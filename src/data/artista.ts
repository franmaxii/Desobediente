import { sitio } from '../lib/contenido';
import type { RedId } from '../content/esquema';

export type { RedId };

export const artista = sitio.artista;
export const inicio = sitio.inicio;
export const bio = sitio.bio;

export type Red = (typeof sitio.redes)[number];
export const redes: Red[] = sitio.redes;

export const redPorId = (id: RedId): Red => {
  const red = redes.find((r) => r.id === id);
  if (!red) throw new Error(`Falta la red «${id}» en el contenido.`);
  return red;
};
