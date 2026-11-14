import type { EnvAcceso } from './acceso';
import type { EnvGitHub } from './github';
import type { EnvSesion } from './sesion';
import { ErrorGitHub } from './github';

export type EnvPanel = EnvAcceso & EnvGitHub & EnvSesion;

export const RUTA_SITIO = 'src/content/sitio.json';
export const RUTA_GALERIAS = 'src/content/galerias.json';
export const RAIZ_ARCHIVOS = 'src/assets/';

/** Carpetas donde el panel puede borrar archivos que ya no se usan. */
export const CARPETAS_BORRABLES = ['src/assets/subidas/', 'src/assets/modelo/', 'src/assets/en-vivo/'];

/** Rutas que el panel puede crear: siempre dentro de src/assets/subidas/. */
export const rutaSubidaValida = (ruta: string) =>
  /^src\/assets\/subidas\/[a-z0-9-]+\/[a-z0-9][a-z0-9-]{0,80}\.(jpg|jpeg|png|webp|avif|mp3)$/.test(ruta);

export const json = (datos: unknown, estado = 200) =>
  Response.json(datos, {
    status: estado,
    headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });

export const error = (mensaje: string, estado = 400, extra: Record<string, unknown> = {}) =>
  json({ error: mensaje, ...extra }, estado);

/** Convierte cualquier error en una respuesta clara para el panel. */
export function manejarError(e: unknown): Response {
  if (e instanceof ErrorGitHub) {
    const estado = e.estado === 409 ? 409 : e.estado >= 500 ? 502 : 500;
    return error(e.message, estado);
  }
  console.error(e);
  return error('Algo salió mal en el servidor. Probá de nuevo en un rato.', 500);
}
