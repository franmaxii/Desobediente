import { sitio, imagen } from '../lib/contenido';

export const libro = {
  ...sitio.libro,
  portada: imagen(sitio.libro.portada),
};
