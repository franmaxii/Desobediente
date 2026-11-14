# Desobediente — sitio oficial

Sitio de una sola página hecho con [Astro](https://astro.build). Es estático: el build genera HTML, CSS y JS que se pueden subir a cualquier hosting.

## Comandos

| Comando           | Qué hace                                        |
| ----------------- | ----------------------------------------------- |
| `npm install`     | Instala las dependencias                        |
| `npm run dev`     | Servidor local con recarga en `localhost:4321`  |
| `npm run build`   | Genera el sitio final en `dist/`                |
| `npm run preview` | Sirve `dist/` para revisarlo antes de publicar  |
| `npm run preview:cf` | Igual que en Cloudflare: sitio + contador de corazones con una base local, en `localhost:8788` |
| `npm run check`   | Revisa errores de tipos en el sitio y en `functions/` |

Con `npm run dev` el botón de corazones anima pero no muestra el número: la API solo existe en Cloudflare (o con `preview:cf`).

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

## Contador de corazones

Botón flotante (`src/components/Reacciones.astro`) con un contador global que guarda una Pages Function (`functions/api/reacciones.ts`) en una base **D1** de Cloudflare. Las tablas se crean solas la primera vez.

- Cada pedido suma como máximo 25 y cada visitante como máximo 60 por minuto (se identifica con un hash de la IP que cambia todos los días; no se guardan IPs).
- Solo acepta pedidos desde el propio sitio.

**Puesta en marcha (una sola vez), en el panel de Cloudflare:**

1. **Storage & Databases → D1 → Create**: crear una base, por ejemplo `desobediente-reacciones`.
2. **Workers & Pages → desobediente → Settings → Bindings → Add → D1 database**: nombre de variable `DB`, elegir la base creada. Hacerlo para *Production* (y *Preview* si querés probar en ramas).
3. Volver a desplegar (un push a `main` alcanza).

Mientras no esté configurada, el botón anima igual pero no muestra el número.

## SEO

- Dominio canónico: `https://desobediente.franmaxi.lol` (en `astro.config.mjs` → `site`).
- Palabra clave principal: **Desobediente 13**, solo en lo que lee Google (título, descripción y datos estructurados); no aparece en el texto visible. Los alias están en `src/data/artista.ts`.
- `sitemap-index.xml` y `robots.txt` se generan/publican solos.
- Datos estructurados (schema.org) en `src/utils/seo.ts`: sitio, artista, persona, temas y libro.
- `public/_headers` evita que Google indexe la copia en `*.pages.dev`.
- La 404 devuelve un 404 real y no se indexa.

## Publicar

El proyecto está conectado a **Cloudflare Pages** desde GitHub: cada push a `main` construye (`npm run build`, salida `dist/`) y publica en `desobediente.franmaxi.lol`, incluida la carpeta `functions/`.
