/** Valida el contenido mientras se edita y traduce cada error a algo entendible. */
import { esquemaGalerias, esquemaSitio, type Galerias, type Sitio } from '../content/esquema';

const NOMBRES: Record<string, string> = {
  artista: 'Datos y Google',
  inicio: 'Inicio',
  redes: 'Redes',
  single: 'Canción destacada',
  ep: 'EP',
  partes: 'parte',
  videoclips: 'Videoclips',
  items: 'video',
  libro: 'Libro',
  bio: 'Bio',
  parrafos: 'párrafo',
  ficha: 'dato de la ficha',
  actriz: 'Actriz',
  obras: 'obra',
  equipo: 'persona del equipo',
  detrasDeEscena: 'foto de detrás de escena',
  galerias: '',
  modelo: 'Fotos de modelo',
  'en-vivo': 'Fotos en vivo',
  fotos: 'foto',
  fotografos: 'fotógrafo',
  titulo: 'título',
  texto: 'texto',
  descripcion: 'descripción',
  nombre: 'nombre',
  url: 'link',
  youtubeId: 'link de YouTube',
  fecha: 'fecha',
  bajada: 'bajada',
  sinopsis: 'sinopsis',
  instagram: 'Instagram',
  miniatura: 'imagen del video (se completa sola al pegar el link)',
  imagen: 'foto',
  audio: 'canción (mp3)',
  portada: 'portada',
};

export interface Problema {
  clave: string;
  texto: string;
}

function legible(raiz: string, ruta: PropertyKey[]): string {
  const partes: string[] = [];
  for (let i = 0; i < ruta.length; i++) {
    const p = ruta[i];
    if (typeof p === 'number') {
      if (partes.length) partes[partes.length - 1] += ` ${p + 1}`;
      continue;
    }
    const nombre = NOMBRES[String(p)];
    if (nombre !== '') partes.push(nombre ?? String(p));
  }
  return partes.join(' › ') || (raiz === 'sitio' ? 'Contenido' : 'Galerías');
}

export function validar(sitio: Sitio, galerias: Galerias): { mapa: Map<string, string>; lista: Problema[] } {
  const mapa = new Map<string, string>();
  const lista: Problema[] = [];
  for (const [raiz, resultado] of [
    ['sitio', esquemaSitio.safeParse(sitio)],
    ['galerias', esquemaGalerias.safeParse(galerias)],
  ] as const) {
    if (resultado.success) continue;
    for (const issue of resultado.error.issues) {
      const clave = [raiz, ...issue.path].join('.');
      if (!mapa.has(clave)) mapa.set(clave, issue.message);
      lista.push({ clave, texto: `${legible(raiz, issue.path)}: ${issue.message}` });
    }
  }
  return { mapa, lista };
}
