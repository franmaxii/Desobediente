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

## Editar el contenido: el panel (`/admin`)

Todo el contenido (fotos, textos, música, videoclips, actriz, libro, bio, redes y datos para Google) se edita desde **https://desobediente.franmaxi.lol/admin**, sin tocar código:

- **Galerías:** subir fotos (se achican y se les borran los datos ocultos, como la ubicación), ordenar arrastrando, descripción y crédito de cada foto, pasar fotos de una galería a otra. Muestra si la grilla queda completa.
- **Videoclips:** se pega el link de YouTube y la miniatura se busca sola.
- **Canción destacada:** se puede cambiar el mp3; la duración se calcula sola.
- **Publicar:** guarda todo en un commit en GitHub → Cloudflare reconstruye el sitio (1–2 minutos). El panel avisa cuando ya está online.
- **Historial:** cada publicación queda guardada y se puede volver a cualquier versión (recupera también las fotos borradas).

**Por qué no se puede romper:** las reglas de `src/content/esquema.ts` se aplican tres veces: en el panel mientras se edita (no deja publicar si algo está mal y dice qué), en el servidor antes de guardar, y en el build. Si aun así el build fallara, Cloudflare sigue mostrando la versión anterior.

El contenido vive en `src/content/sitio.json` y `src/content/galerias.json`. También se pueden editar a mano (respetando las reglas); `src/data/*.ts` los carga para los componentes.

Links dentro de los textos: `[texto](https://…)` o, a una sección de la página, `[texto](#videoclips)`.

### Entrar al panel

Usuario **`desobediente`** y contraseña (se generan con `npm run contrasena`, ver abajo).

Opcionalmente se puede sumar **Cloudflare Access** (entrada con mail + código): si está configurado, también deja entrar.

### Seguridad del panel

1. **Contraseña:** nunca se guarda; en Cloudflare solo está su versión cifrada (PBKDF2 con sal). La sesión es una cookie firmada, `HttpOnly`, `Secure` y `SameSite=Strict`, que dura 30 días. Cambiar la contraseña cierra todas las sesiones abiertas.
2. **Contra intentos de adivinarla:** 5 intentos fallidos por persona cada 15 minutos y 30 en total por hora (se cuentan en D1). Superado eso, se bloquea por un rato.
3. **Cada pedido a `/api/admin/*`** vuelve a verificar la sesión (o el token de Access) en `functions/api/admin/_middleware.ts`. Sin eso, rechaza todo, también en la copia de `*.pages.dev`.
4. Los cambios solo se aceptan desde el propio sitio, y los archivos subidos se controlan (tipo real y tamaño).
5. El token de GitHub vive como secreto en Cloudflare y solo puede escribir en este repositorio.

### Puesta en marcha (una sola vez)

**1. Token de GitHub** — github.com → Settings → Developer settings → *Fine-grained tokens* → *Generate new token*:
- *Repository access:* **Only select repositories** → `franmaxii/Desobediente`.
- *Permissions → Repository → Contents:* **Read and write** (nada más).
- Elegí un vencimiento (por ejemplo 1 año) y anotá cuándo vence.

**2. Contraseña** — `npm run contrasena` inventa una (4 palabras + número) y muestra su versión cifrada (`PANEL_CONTRASENA_HASH=…`). Para elegirla vos: `npm run contrasena -- "tu frase de al menos 12 letras"`.

**3. Base D1** — la misma `DB` del contador de corazones (ver más abajo). El login la usa para contar intentos; sin ella no deja entrar.

**4. Variables del proyecto** — Workers & Pages → desobediente → Settings → *Variables and Secrets* (Production):

| Variable | Valor |
| --- | --- |
| `GITHUB_TOKEN` | el token del paso 1 (tipo **Secret**) |
| `GITHUB_REPO` | `franmaxii/Desobediente` |
| `GITHUB_BRANCH` | `main` |
| `PANEL_CONTRASENA_HASH` | lo que mostró `npm run contrasena` (tipo **Secret**) |
| `PANEL_USUARIO` | opcional; si no está, es `desobediente` |

**5.** Volver a desplegar (un push a `main`) y entrar a `/admin`.

**Cambiar la contraseña:** `npm run contrasena`, reemplazar `PANEL_CONTRASENA_HASH` en Cloudflare y volver a desplegar.

**Opcional, Cloudflare Access** — Zero Trust → *Access → Applications → Self-hosted* para `desobediente.franmaxi.lol/admin` y `/api/admin`, con login *One-time PIN* y una política *Allow* por mail. Después sumá las variables `ACCESS_TEAM_DOMAIN` (ej. `tuequipo.cloudflareaccess.com`), `ACCESS_AUD` (el *Application Audience Tag*) y `ADMIN_EMAILS` (mails separados por coma).

### Probarlo en la compu

```bash
npm run build
npx wrangler pages dev ./dist --d1 DB -b PANEL_DESARROLLO=1 -b GITHUB_TOKEN=… -b GITHUB_REPO=usuario/repo-de-prueba
```

`PANEL_DESARROLLO=1` deja entrar sin contraseña **solo** en `localhost`. Usá un repo de prueba: publicar hace commits de verdad.

## Estructura

```
src/
  admin/        el panel (Svelte): galerías, formularios, publicar, historial
  assets/       imágenes y audio (Astro los optimiza en el build)
  components/   una sección por componente, con sus estilos
  content/      contenido editable (JSON) y sus reglas (esquema.ts)
  data/         carga el contenido para los componentes
  layouts/      <head>, fuentes, navegación y pie
  pages/        la página, la 404, /admin y /version.json
  styles/       tokens de color, tipografía, botones y «la mecha»
functions/      API en Cloudflare: corazones y /api/admin/*
servidor/       código compartido de la API (Access, GitHub)
public/         favicon, imagen para compartir, robots y headers
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
