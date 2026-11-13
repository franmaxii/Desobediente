export const artista = {
  nombre: 'Desobediente',
  nombreReal: 'Milena García',
  origen: 'Buenos Aires, Argentina',
  anioNacimiento: 2006,
  lema: 'Fijate de qué lado de la mecha te encontrás.',
  descripcion:
    'Desobediente (Milena García): cantante, actriz, escritora y guitarrista de Buenos Aires. Pop rock, rebeldía y crítica social. Escuchá «Tik Tak», mirá los videoclips y leé «Este libro fue escrito por uno o más locos».',
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

export type RedId = 'youtube' | 'instagram' | 'wattpad';

export interface Red {
  id: RedId;
  nombre: string;
  url: string;
  handle: string;
  detalle: string;
}

export const redes: Red[] = [
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
    id: 'wattpad',
    nombre: 'Wattpad',
    url: 'https://www.wattpad.com/user/DESOBEDIENTE',
    handle: '@DESOBEDIENTE',
    detalle: 'el libro',
  },
];

export const redPorId = (id: RedId): Red => redes.find((r) => r.id === id)!;
