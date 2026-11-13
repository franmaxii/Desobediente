# Desobediente — sitio oficial

Sitio de una sola página hecho con [Astro](https://astro.build). Es estático: el build genera HTML, CSS y JS que se pueden subir a cualquier hosting.

## Comandos

| Comando           | Qué hace                                        |
| ----------------- | ----------------------------------------------- |
| `npm install`     | Instala las dependencias                        |
| `npm run dev`     | Servidor local con recarga en `localhost:4321`  |
| `npm run build`   | Genera el sitio final en `dist/`                |
| `npm run preview` | Sirve `dist/` para revisarlo antes de publicar  |
| `npm run check`   | Revisa errores de tipos en componentes y datos  |

## Editar el contenido

Los textos y links están en `src/data/`, separados del diseño:

- `artista.ts`: nombre, lema, oficios y redes sociales.
- `musica.ts`: el single del reproductor, las 3 partes del EP y los videoclips.
- `libro.ts`: título, sinopsis, cita y link de Wattpad.

**Sumar un videoclip:** guardá la miniatura (16:9) en `src/assets/img/`, importala al principio de `musica.ts` y agregá un objeto a `videoclips` con `titulo`, `youtubeId` (lo que va después de `watch?v=`), `fecha` (`AAAA-MM-DD`), `miniatura` y `texto`.

**Cambiar la canción del reproductor:** reemplazá `src/assets/audio/tik-tak.mp3` (o importá otro archivo) y actualizá los datos de `single`.

## Estructura

```
src/
  assets/       imágenes y audio (Astro los optimiza en el build)
  components/   una sección por componente, con sus estilos
  data/         contenido editable
  layouts/      <head>, fuentes, navegación y pie
  styles/       tokens de color, tipografía, botones y «la mecha»
public/         favicon e imagen para compartir (og.jpg)
```

Las fuentes (UnifrakturCook, Grenze Gotisch, Barlow, Barlow Condensed, IBM Plex Mono) se configuran en `astro.config.mjs` y se descargan en el build: no dependen de Google Fonts.

## Publicar

Cuando haya dominio, completá `site` en `astro.config.mjs` para que la vista previa al compartir el link use una URL absoluta. Después, `npm run build` y subí `dist/` a Netlify, Cloudflare Pages, Vercel o GitHub Pages (todos detectan Astro solos).
