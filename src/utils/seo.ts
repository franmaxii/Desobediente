import { artista, redes } from '../data/artista';
import { single, ep, videoclips } from '../data/musica';
import { libro } from '../data/libro';
import { obras } from '../data/actuacion';

/**
 * Datos estructurados (schema.org) para Google: quién es la artista,
 * cómo se la conoce («Desobediente 13»), sus redes, su música y su libro.
 */
export function datosEstructurados(sitio: URL) {
  const url = sitio.href;
  const id = (fragmento: string) => `${url}#${fragmento}`;
  const sameAs = [...redes.map((r) => r.url), libro.url];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': id('sitio'),
        url,
        name: artista.nombre,
        alternateName: artista.alias,
        inLanguage: 'es-AR',
        publisher: { '@id': id('artista') },
      },
      {
        '@type': 'WebPage',
        '@id': id('pagina'),
        url,
        name: artista.titulo,
        description: artista.descripcion,
        inLanguage: 'es-AR',
        isPartOf: { '@id': id('sitio') },
        about: { '@id': id('artista') },
        primaryImageOfPage: new URL('/og.jpg', sitio).href,
      },
      {
        '@type': 'MusicGroup',
        '@id': id('artista'),
        name: artista.nombre,
        alternateName: artista.alias,
        url,
        image: new URL('/og.jpg', sitio).href,
        description: artista.descripcion,
        genre: ['Pop rock', 'Rock nacional'],
        foundingLocation: { '@type': 'Place', name: artista.origen },
        member: { '@id': id('milena') },
        sameAs,
        track: [
          {
            '@type': 'MusicRecording',
            name: single.titulo,
            datePublished: single.fecha,
            duration: `PT${Math.floor(single.duracionSeg / 60)}M${single.duracionSeg % 60}S`,
            isrcCode: single.isrc,
            byArtist: { '@id': id('artista') },
          },
          ...[...ep.partes.slice(1), ...videoclips].map((v) => ({
            '@type': 'MusicRecording',
            name: v.titulo,
            datePublished: v.fecha,
            byArtist: { '@id': id('artista') },
            url: `https://www.youtube.com/watch?v=${v.youtubeId}`,
          })),
        ],
      },
      {
        '@type': 'Person',
        '@id': id('milena'),
        name: artista.nombreReal,
        alternateName: ['Milena García', artista.nombre, ...artista.alias],
        jobTitle: 'Cantante',
        birthDate: artista.nacimiento.fecha,
        birthPlace: {
          '@type': 'Place',
          name: `${artista.nacimiento.barrio}, ${artista.nacimiento.ciudad}, Argentina`,
        },
        homeLocation: { '@type': 'Place', name: artista.origen },
        sameAs,
      },
      ...obras.map((o) => ({
        '@type': 'Movie',
        name: o.titulo,
        genre: o.genero,
        description: o.sinopsis,
        inLanguage: 'es',
        actor: o.personaje
          ? { '@type': 'PerformanceRole', actor: { '@id': id('milena') }, characterName: o.personaje }
          : { '@id': id('milena') },
      })),
      {
        '@type': 'Book',
        name: libro.titulo,
        author: { '@id': id('milena') },
        url: libro.url,
        inLanguage: 'es',
        bookFormat: 'https://schema.org/EBook',
      },
    ],
  };
}
