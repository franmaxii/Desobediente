export const artista = {
  nombre: 'Desobediente',
  /** Cómo la buscan: la palabra clave principal es «Desobediente 13». */
  alias: ['Desobediente 13', 'Desobediente13', '13desobediente'],
  nombreReal: 'Milena García',
  origen: 'Buenos Aires, Argentina',
  anioNacimiento: 2006,
  lema: 'Fijate de qué lado de la mecha te encontrás.',
  titulo: 'Desobediente 13 — Milena García, pop rock de Buenos Aires',
  descripcion:
    'Sitio oficial de Desobediente 13 (Milena García): pop rock, rebeldía y crítica social desde Buenos Aires. Escuchá «Tik Tak», mirá los videoclips del EP y leé su libro.',
  oficios: [
    'Cantante',
    'actriz',
    'modelo',
    'escritora',
    'guitarrista',
    'editora audiovisual',
    'community manager',
    'perforadora',
  ],
} as const;

export type RedId = 'spotify' | 'youtube' | 'instagram' | 'tiktok' | 'twitch' | 'wattpad';

export interface Red {
  id: RedId;
  nombre: string;
  url: string;
  handle: string;
  detalle: string;
}

export const redes: Red[] = [
  {
    id: 'spotify',
    nombre: 'Spotify',
    url: 'https://open.spotify.com/artist/7BlOG10FGKFBCKQ8mKC8iU',
    handle: 'DESOBEDIENTE',
    detalle: 'escuchala',
  },
  {
    id: 'youtube',
    nombre: 'YouTube',
    url: 'https://www.youtube.com/@Desobediente13',
    handle: '@Desobediente13',
    detalle: 'videoclips',
  },
  {
    id: 'instagram',
    nombre: 'Instagram',
    url: 'https://www.instagram.com/13desobediente_',
    handle: '@13desobediente_',
    detalle: 'shows y novedades',
  },
  {
    id: 'tiktok',
    nombre: 'TikTok',
    url: 'https://www.tiktok.com/@desobediente113',
    handle: '@desobediente113',
    detalle: 'videos',
  },
  {
    id: 'twitch',
    nombre: 'Twitch',
    url: 'https://www.twitch.tv/desobed1ent3',
    handle: 'desobed1ent3',
    detalle: 'en vivo',
  },
  {
    id: 'wattpad',
    nombre: 'Wattpad',
    url: 'https://www.wattpad.com/user/DESOBEDIENTE',
    handle: '@DESOBEDIENTE',
    detalle: 'el libro',
  },
];

export const redPorId = (id: RedId): Red => redes.find((r) => r.id === id)!;
