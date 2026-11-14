/**
 * Estado del panel: el contenido que se está editando, las fotos subidas todavía sin publicar
 * y las miniaturas que el build ya generó para cada imagen del sitio.
 */
import type { Galerias, Sitio } from '../content/esquema';

export interface Subida {
  /** Archivo listo para subir (ya achicado). */
  blob?: Blob;
  /** sha en GitHub, una vez subido. */
  sha?: string;
  /** URL para mostrarlo en el panel. */
  vista: string;
}

export const contenido = $state({
  sitio: null as unknown as Sitio,
  galerias: null as unknown as Galerias,
});

export const app = $state({
  cargado: false,
  error: '',
  email: '',
  /** commit sobre el que se está editando */
  base: '',
  /** contenido tal como está publicado (para saber si hay cambios) */
  original: '',
  subidas: {} as Record<string, Subida>,
});

/** Miniaturas generadas en el build: ruta (relativa a src/assets) → URL. */
const miniaturas: Record<string, string> =
  typeof document !== 'undefined' ? JSON.parse(document.getElementById('miniaturas')?.textContent || '{}') : {};

/** URL para mostrar un archivo del contenido en el panel. */
export function vistaDe(ruta: string): string {
  return (
    app.subidas[ruta]?.vista ??
    miniaturas[ruta] ??
    `/api/admin/archivo?ruta=${encodeURIComponent(`src/assets/${ruta}`)}`
  );
}

export const instantanea = () => JSON.stringify({ sitio: contenido.sitio, galerias: contenido.galerias });
