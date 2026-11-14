import type { ImageMetadata } from 'astro';

import afichePuntoDeQuiebre from '../assets/actriz/punto-de-quiebre-afiche.png';
import ecosTerraza from '../assets/actriz/ecos-latentes-terraza.jpg';
import ecosClaqueta from '../assets/actriz/ecos-latentes-claqueta.jpg';
import ecosAtardecer from '../assets/actriz/ecos-latentes-atardecer.jpg';
import ecosDetrasDeCamara from '../assets/actriz/ecos-latentes-detras-de-camara.jpg';

export interface Credito {
  rol: string;
  /** Usuario de Instagram, sin @. */
  instagram: string;
}

export interface Obra {
  titulo: string;
  formato: string;
  genero: string;
  /** Personaje que interpreta, si se sabe. */
  personaje?: string;
  imagen: ImageMetadata;
  imagenAlt: string;
  /** El afiche es vertical; los fotogramas, apaisados. */
  imagenVertical?: boolean;
  sinopsis: string;
  /** Lo que dijo ella sobre el proyecto. */
  cita?: string;
  equipo?: Credito[];
  notaEquipo?: string;
  detrasDeEscena?: { src: ImageMetadata; alt: string }[];
}

export const obras: Obra[] = [
  {
    titulo: 'Punto de quiebre',
    formato: 'Cortometraje',
    genero: 'Drama',
    personaje: 'Isabella',
    imagen: afichePuntoDeQuiebre,
    imagenAlt:
      'Afiche de «Punto de quiebre»: Desobediente, con una botella en la mano, y su madre en la ficción, espalda con espalda, separadas por una grieta roja. Arriba dice «Todo tiene un límite».',
    imagenVertical: true,
    sinopsis:
      'Isabella es iracunda e impulsiva, y su mayor detonante es la adicción al alcohol. Su madre la sostiene económicamente, y esa plata termina en la bebida. Cuando un día le dice que no, todo cambia y la historia termina en tragedia.',
    cita: 'Un personaje del cual quedé enamorada.',
    equipo: [
      { rol: 'Dirección', instagram: 'paduczak.agus' },
      { rol: 'Producción', instagram: 'more.indesign' },
      { rol: 'Fotografía y maquillaje', instagram: 'delffiskata.makeup' },
      { rol: 'Dirección de arte', instagram: 'huellacreativva' },
      { rol: 'Sonido', instagram: 'vizioli.portfolio' },
      { rol: 'Con', instagram: 'dalialaura' },
    ],
    notaEquipo: 'Un equipo de mujeres brillantes.',
  },
  {
    titulo: 'Ecos latentes',
    formato: 'Cortometraje',
    genero: 'Drama',
    imagen: ecosTerraza,
    imagenAlt: 'Escena de «Ecos latentes» en blanco y negro: Desobediente y la otra protagonista de perfil en una terraza.',
    sinopsis:
      'Dos chicas que se quieren mucho se van alejando de a poco a lo largo del corto, hasta que al final la relación se rompe.',
    detrasDeEscena: [
      { src: ecosClaqueta, alt: 'Rodaje de «Ecos latentes»: la claqueta frente a las dos protagonistas.' },
      { src: ecosAtardecer, alt: 'Rodaje de «Ecos latentes»: las dos protagonistas al sol en la terraza.' },
      { src: ecosDetrasDeCamara, alt: 'Desobediente sonriendo detrás de una cámara durante el rodaje.' },
    ],
  },
];
