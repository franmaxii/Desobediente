/** Conversación con el servidor del panel (/api/admin/*). */
import type { Galerias, Sitio } from '../content/esquema';

export class ErrorPanel extends Error {
  constructor(
    mensaje: string,
    public estado: number,
    public detalle?: string,
  ) {
    super(mensaje);
  }
}

async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ruta, {
      ...init,
      credentials: 'same-origin',
      headers: { 'x-panel': '1', ...(init.headers ?? {}) },
    });
  } catch {
    throw new ErrorPanel('No hay conexión. Revisá internet y probá de nuevo.', 0);
  }
  const datos = (await res.json().catch(() => ({}))) as { error?: string; detalle?: string };
  if (res.status === 401) {
    throw new ErrorPanel(datos.error ?? 'Tenés que entrar de nuevo.', 401);
  }
  if (!res.ok) throw new ErrorPanel(datos.error ?? `Error ${res.status}`, res.status, datos.detalle);
  return datos as T;
}

const enviar = (ruta: string, cuerpo: unknown) =>
  pedir<Record<string, unknown>>(ruta, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });

export const entrar = (usuario: string, contrasena: string) => enviar('/api/sesion/entrar', { usuario, contrasena });

export const salir = () => enviar('/api/sesion/salir', {}).catch(() => undefined);

export const cargar = () =>
  pedir<{ commit: string; email: string; sitio: Sitio; galerias: Galerias }>('/api/admin/contenido');

function aBase64(blob: Blob): Promise<string> {
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => mal(new ErrorPanel('No se pudo leer el archivo.', 0));
    lector.readAsDataURL(blob);
  });
}

/** Sube un archivo (sin publicarlo todavía) y devuelve su sha. */
export async function subirArchivo(blob: Blob): Promise<string> {
  const contenido = await aBase64(blob);
  const r = await pedir<{ sha: string }>('/api/admin/subir', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: `{"encoding":"base64","content":"${contenido}"}`,
  });
  return r.sha;
}

export const miniaturaYoutube = async (id: string) => (await enviar('/api/admin/youtube', { id })).sha as string;

export const publicar = (datos: {
  base: string;
  sitio: Sitio;
  galerias: Galerias;
  nuevos: { ruta: string; sha: string }[];
  resumen: string;
}) => enviar('/api/admin/publicar', datos) as Promise<{ commit: string; sinCambios?: boolean }>;

export const historial = () =>
  pedir<{ versiones: { commit: string; fecha: string; mensaje: string; delPanel: boolean }[] }>('/api/admin/historial');

export const restaurar = (commit: string, fecha: string) =>
  enviar('/api/admin/restaurar', { commit, fecha }) as Promise<{ commit: string }>;

/** Espera a que Cloudflare termine de publicar ese commit (consulta /version.json). */
export async function esperarPublicacion(commit: string, cancelado: () => boolean): Promise<boolean> {
  const limite = Date.now() + 8 * 60 * 1000;
  while (Date.now() < limite && !cancelado()) {
    await new Promise((r) => setTimeout(r, 6000));
    try {
      const v = (await (await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })).json()) as {
        commit?: string;
      };
      if (v.commit === commit) return true;
    } catch {
      // sigue esperando
    }
  }
  return false;
}
