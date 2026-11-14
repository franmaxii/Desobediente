/**
 * Reglas del contenido editable del sitio.
 *
 * Las usan:
 * - el build de Astro (si algo no cumple, el build falla y Cloudflare deja la versión anterior);
 * - el servidor del panel (/api/admin/publicar), que rechaza cambios inválidos antes de guardarlos.
 *
 * Este archivo no puede importar nada de Astro: lo comparten el sitio y las Functions.
 */
import { z } from 'zod';

const texto = (max: number) =>
  z.string().trim().min(1, 'No puede quedar vacío').max(max, `Máximo ${max} caracteres`);

const textoOpcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).optional();

const url = z
  .string()
  .trim()
  .max(400)
  .regex(/^https?:\/\/[^\s<>"]+$/, 'Tiene que ser un link completo, que empiece con https://');

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha con formato AAAA-MM-DD');

const youtubeId = z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'Pegá el link del video de YouTube');

const usuarioInstagram = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9._]{1,30}$/, 'Usuario de Instagram sin @ (solo letras, números, puntos y guiones bajos)');

/** Ruta de un archivo dentro de src/assets (sin «..», sin espacios raros). */
const ruta = (extensiones: string) =>
  z
    .string()
    .min(1, 'Falta el archivo')
    .regex(
      new RegExp(`^[a-z0-9][a-z0-9_-]*(\\/[a-z0-9][a-z0-9_.-]*)*\\.(${extensiones})$`, 'i'),
      'Archivo inválido',
    )
    .refine((r) => !r.includes('..'), 'Archivo inválido');

export const rutaImagen = ruta('jpe?g|png|webp|avif');
export const rutaAudio = ruta('mp3');

export const REDES = ['spotify', 'youtube', 'instagram', 'tiktok', 'twitch', 'wattpad'] as const;

const videoclip = z.object({
  titulo: texto(80),
  youtubeId,
  fecha,
  miniatura: rutaImagen,
  texto: texto(400),
});

const obra = z.object({
  titulo: texto(80),
  formato: texto(40),
  genero: texto(40),
  personaje: textoOpcional(60),
  imagen: rutaImagen,
  imagenAlt: texto(300),
  imagenVertical: z.boolean(),
  sinopsis: texto(800),
  cita: textoOpcional(300),
  equipo: z.array(z.object({ rol: texto(60), instagram: usuarioInstagram })).max(20),
  notaEquipo: textoOpcional(160),
  detrasDeEscena: z.array(z.object({ imagen: rutaImagen, alt: texto(200) })).max(6),
});

export const esquemaSitio = z.object({
  artista: z.object({
    nombre: texto(40),
    alias: z.array(texto(40)).max(10),
    nombreReal: texto(80),
    origen: texto(80),
    nacimiento: z.object({ fecha, barrio: texto(60), ciudad: texto(60) }),
    lema: texto(120),
    sueno: texto(200),
    oficios: z.array(texto(40)).min(1).max(15),
    titulo: texto(70),
    descripcion: texto(170),
  }),
  inicio: z.object({
    foto: rutaImagen,
    bajada: texto(200),
  }),
  redes: z
    .array(
      z.object({
        id: z.enum(REDES),
        nombre: texto(30),
        url,
        handle: texto(40),
        detalle: texto(40),
      }),
    )
    .min(1)
    .max(12)
    .refine((r) => new Set(r.map((x) => x.id)).size === r.length, 'Hay una red repetida')
    .refine((r) => r.some((x) => x.id === 'instagram'), 'Instagram no se puede sacar: lo usan otros botones')
    .refine((r) => r.some((x) => x.id === 'spotify'), 'Spotify no se puede sacar: lo usa el reproductor')
    .refine((r) => r.some((x) => x.id === 'youtube'), 'YouTube no se puede sacar: lo usan los videoclips'),
  single: z.object({
    titulo: texto(60),
    etiqueta: texto(60),
    texto: texto(500),
    fecha,
    sello: texto(60),
    isrc: textoOpcional(20),
    genero: texto(40),
    duracionSeg: z.number().int().min(1).max(3600),
    audio: rutaAudio,
    portada: rutaImagen,
  }),
  ep: z.object({
    titulo: texto(80),
    anio: z.number().int().min(2000).max(2100),
    bajada: texto(300),
    partes: z.array(videoclip.extend({ parte: texto(40) })).max(12),
  }),
  videoclips: z.object({
    titulo: texto(60),
    items: z.array(videoclip).max(40),
  }),
  libro: z.object({
    titulo: texto(120),
    estado: texto(60),
    url,
    portada: rutaImagen,
    pregunta: texto(400),
    sinopsis: texto(1200),
    cita: z.object({ texto: texto(400), fuente: texto(200) }),
  }),
  bio: z.object({
    titulo: texto(60),
    parrafos: z.array(texto(900)).min(1).max(12),
    ficha: z.array(z.object({ etiqueta: texto(30), valor: texto(200) })).max(12),
  }),
  actriz: z.object({
    titulo: texto(60),
    obras: z.array(obra).max(20),
  }),
});

const foto = z.object({
  imagen: rutaImagen,
  descripcion: texto(160),
  fotografo: z.string().optional(),
});

const galeria = z.object({
  eyebrow: texto(40),
  titulo: texto(60),
  cta: texto(60),
  fotos: z.array(foto).max(60),
});

export const esquemaGalerias = z
  .object({
    fotografos: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]{1,40}$/, 'Identificador inválido'),
          nombre: texto(60),
          instagram: usuarioInstagram,
        }),
      )
      .max(40),
    galerias: z.object({
      'en-vivo': galeria,
      modelo: galeria,
    }),
  })
  .superRefine((datos, ctx) => {
    const ids = new Set(datos.fotografos.map((f) => f.id));
    for (const [nombre, g] of Object.entries(datos.galerias)) {
      g.fotos.forEach((f, i) => {
        if (f.fotografo && !ids.has(f.fotografo)) {
          ctx.addIssue({
            code: 'custom',
            path: ['galerias', nombre, 'fotos', i, 'fotografo'],
            message: 'Ese fotógrafo no está en la lista',
          });
        }
      });
    }
  });

export type Sitio = z.infer<typeof esquemaSitio>;
export type Galerias = z.infer<typeof esquemaGalerias>;
export type RedId = (typeof REDES)[number];

/** Errores en castellano, una línea por problema. */
export const describirErrores = (error: z.ZodError) =>
  error.issues.map((i) => `• ${i.path.join(' › ') || 'contenido'}: ${i.message}`).join('\n');

/** Todas las rutas de archivos (imágenes y audio) que usa el contenido. */
export function archivosUsados(sitio: Sitio, galerias: Galerias): string[] {
  const rutas = new Set<string>([
    sitio.inicio.foto,
    sitio.single.audio,
    sitio.single.portada,
    sitio.libro.portada,
    ...sitio.ep.partes.map((p) => p.miniatura),
    ...sitio.videoclips.items.map((v) => v.miniatura),
    ...sitio.actriz.obras.flatMap((o) => [o.imagen, ...o.detrasDeEscena.map((d) => d.imagen)]),
    ...Object.values(galerias.galerias).flatMap((g) => g.fotos.map((f) => f.imagen)),
  ]);
  return [...rutas];
}
