import type { ImageMetadata } from 'astro';

import tikTakAudio from '../assets/audio/tik-tak.mp3?url';
import tikTakPortada from '../assets/img/tik-tak-cover.jpg';
import epTikTak from '../assets/img/ep-tik-tak.jpg';
import epVeoVeo from '../assets/img/ep-veo-veo.jpg';
import epLeroLero from '../assets/img/ep-lero-lero.jpg';
import retruco from '../assets/img/retruco.jpg';
import soloUnBesoMas from '../assets/img/solo-un-beso-mas.jpg';
import laRepresentante from '../assets/img/la-representante-del-quilombo.jpg';
import felicesDanados from '../assets/img/felices-danados.jpg';
import falloPaterno from '../assets/img/fallo-paterno.jpg';

export interface Videoclip {
  titulo: string;
  youtubeId: string;
  /** Fecha de publicación, formato ISO (AAAA-MM-DD). */
  fecha: string;
  miniatura: ImageMetadata;
  /** Texto corto. Admite HTML simple (links). */
  texto: string;
}

export interface ParteEP extends Videoclip {
  parte: string;
}

/** El single que suena en el reproductor. */
export const single = {
  titulo: 'Tik Tak',
  fecha: '2026-04-13',
  sello: 'CR Musik',
  isrc: 'QZHN92652260',
  genero: 'Pop / Rock',
  duracionSeg: 200,
  audio: tikTakAudio,
  portada: tikTakPortada,
  etiqueta: 'Single · Parte 1 del EP',
  texto:
    'La canción más personal de Desobediente. Habla de un momento real de su adolescencia: las dos veces que estuvo internada en un psiquiátrico.',
};

export const ep = {
  titulo: 'Tres partes, tres videoclips',
  anio: 2026,
  bajada: 'Tik Tak, Veo Veo y Lero Lero. Salieron de abril a octubre, y las tres un día 13.',
  partes: [
    {
      parte: 'Parte 1',
      titulo: 'Tik Tak',
      youtubeId: 'wGsG_N0jwA0',
      fecha: '2026-04-13',
      miniatura: epTikTak,
      texto: 'La más personal. Un momento real de su adolescencia, contado sin anestesia.',
    },
    {
      parte: 'Parte 2',
      titulo: 'Veo Veo',
      youtubeId: '4rjd5XYuREY',
      fecha: '2026-06-13',
      miniatura: epVeoVeo,
      texto: 'Resiliencia y crecimiento. Para cantarles en la cara: «mirá de quién te burlaste».',
    },
    {
      parte: 'Parte 3 y final',
      titulo: 'Lero Lero',
      youtubeId: 'Laa1E7t7040',
      fecha: '2026-10-13',
      miniatura: epLeroLero,
      texto: 'Para la gente falsa, víbora y careta. Inspirada en el capítulo 1 de <a href="#libro">su libro</a>.',
    },
  ] satisfies ParteEP[],
};

/** Videoclips anteriores al EP, del más nuevo al más viejo. */
export const videoclips: Videoclip[] = [
  {
    titulo: 'Retruco',
    youtubeId: 'K0F8QytQfxU',
    fecha: '2026-01-13',
    miniatura: retruco,
    texto:
      'Arranca melódico y se transforma en rock nacional. Memoria, verdad y justicia; el truco, el tango, la hinchada y las tres estrellas.',
  },
  {
    titulo: 'Solo un beso más',
    youtubeId: 'xt45ocddwpo',
    fecha: '2025-08-22',
    miniatura: soloUnBesoMas,
    texto: 'La primera canción que produjo, a los 17. Salió después de otras, pero fue la que empezó todo.',
  },
  {
    titulo: 'La representante del quilombo',
    youtubeId: 'mTlFTfJ4AAI',
    fecha: '2025-01-12',
    miniatura: laRepresentante,
    texto: 'El videoclip más visto del canal.',
  },
  {
    titulo: 'Felices Dañados',
    youtubeId: 'gGWIgKTENvA',
    fecha: '2024-08-28',
    miniatura: felicesDanados,
    texto: 'Para quien perdió a alguien importante. Dedicada a su abuela y a su prima.',
  },
  {
    titulo: 'Fallo Paterno',
    youtubeId: 'zZjT_pBgst4',
    fecha: '2024-08-15',
    miniatura: falloPaterno,
    texto: '«Canción apta para gente sin padre (la mitad de la población).»',
  },
];
