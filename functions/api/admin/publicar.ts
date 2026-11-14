/**
 * POST: guarda los cambios del panel en un solo commit.
 *
 * Cuerpo: { base, sitio, galerias, nuevos: [{ ruta, sha }], resumen }
 * - Valida el contenido con las mismas reglas que el build (si no cumple, no guarda nada).
 * - Comprueba que existan todos los archivos que usa el contenido.
 * - Borra los archivos de las galerías que dejaron de usarse (quedan en el historial de git).
 * - Si mientras tanto alguien cambió el contenido, no pisa nada: pide recargar.
 */
import { esquemaSitio, esquemaGalerias, describirErrores, archivosUsados } from '../../../src/content/esquema';
import { GitHub, type EntradaArbol } from '../../../servidor/github';
import {
  CARPETAS_BORRABLES,
  RAIZ_ARCHIVOS,
  RUTA_GALERIAS,
  RUTA_SITIO,
  error,
  json,
  manejarError,
  rutaSubidaValida,
  type EnvPanel,
} from '../../../servidor/comun';

interface Pedido {
  base?: string;
  sitio?: unknown;
  galerias?: unknown;
  nuevos?: { ruta?: string; sha?: string }[];
  resumen?: string;
}

const SHA = /^[0-9a-f]{40}$/;
const comoJson = (datos: unknown) => `${JSON.stringify(datos, null, 2)}\n`;

export const onRequestPost: PagesFunction<EnvPanel> = async ({ request, env }) => {
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 1024 * 1024) {
      return error('Demasiado contenido en un solo cambio.', 413);
    }
    const pedido = (await request.json().catch(() => null)) as Pedido | null;
    if (!pedido || typeof pedido.base !== 'string' || !SHA.test(pedido.base)) {
      return error('Pedido inválido. Recargá el panel.', 400);
    }

    const sitio = esquemaSitio.safeParse(pedido.sitio);
    const galerias = esquemaGalerias.safeParse(pedido.galerias);
    if (!sitio.success || !galerias.success) {
      const detalle = [sitio.error, galerias.error].filter(Boolean).map((e) => describirErrores(e!)).join('\n');
      return error('Hay datos que no cumplen las reglas.', 422, { detalle });
    }

    const nuevos = new Map<string, string>();
    for (const n of pedido.nuevos ?? []) {
      if (!n.ruta || !n.sha || !rutaSubidaValida(n.ruta) || !SHA.test(n.sha)) {
        return error('Hay un archivo subido con un nombre inválido.', 400);
      }
      nuevos.set(n.ruta, n.sha);
    }

    const gh = new GitHub(env);
    const cabeza = await gh.cabeza();
    const actuales = await gh.archivos(cabeza.arbol);

    // ¿Alguien guardó cambios de contenido después de que se abrió el panel?
    if (cabeza.commit !== pedido.base) {
      const deBase = await gh.archivos(await gh.arbolDeCommit(pedido.base));
      const cambio = [RUTA_SITIO, RUTA_GALERIAS].some((r) => deBase.get(r) !== actuales.get(r));
      if (cambio) {
        return error('Alguien guardó otros cambios mientras editabas. Recargá el panel y volvé a hacer tus cambios.', 409);
      }
    }

    // Todos los archivos que usa el contenido tienen que existir (ya guardados o recién subidos).
    const usados = archivosUsados(sitio.data, galerias.data).map((r) => RAIZ_ARCHIVOS + r);
    const faltan = usados.filter((r) => !actuales.has(r) && !nuevos.has(r));
    if (faltan.length) {
      return error('Faltan archivos que usa el contenido. Volvé a subirlos.', 422, {
        detalle: faltan.map((f) => `• ${f.replace(RAIZ_ARCHIVOS, '')}`).join('\n'),
      });
    }

    // Archivos que se dejaron de usar (solo dentro de las carpetas de galerías y subidas).
    const usadosAntes = await (async () => {
      try {
        const [s, g] = await Promise.all([
          gh.textoDeBlob(actuales.get(RUTA_SITIO)!),
          gh.textoDeBlob(actuales.get(RUTA_GALERIAS)!),
        ]);
        const sv = esquemaSitio.safeParse(JSON.parse(s));
        const gv = esquemaGalerias.safeParse(JSON.parse(g));
        return sv.success && gv.success ? archivosUsados(sv.data, gv.data).map((r) => RAIZ_ARCHIVOS + r) : [];
      } catch {
        return [];
      }
    })();
    const enUso = new Set(usados);
    const aBorrar = usadosAntes.filter(
      (r) => !enUso.has(r) && actuales.has(r) && CARPETAS_BORRABLES.some((c) => r.startsWith(c)),
    );

    const textoSitio = comoJson(sitio.data);
    const textoGalerias = comoJson(galerias.data);

    const entradas: EntradaArbol[] = [
      { path: RUTA_SITIO, mode: '100644', type: 'blob', content: textoSitio },
      { path: RUTA_GALERIAS, mode: '100644', type: 'blob', content: textoGalerias },
      ...[...nuevos].filter(([ruta]) => enUso.has(ruta)).map(([path, sha]) => ({ path, mode: '100644' as const, type: 'blob' as const, sha })),
      ...aBorrar.map((path) => ({ path, mode: '100644' as const, type: 'blob' as const, sha: null })),
    ];

    const resumen = (pedido.resumen ?? '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'actualiza el contenido';
    const arbol = await gh.crearArbol(cabeza.arbol, entradas);
    if (arbol === cabeza.arbol) return json({ commit: cabeza.commit, sinCambios: true });

    const commit = await gh.crearCommit(`Panel: ${resumen}`, arbol, cabeza.commit);
    await gh.moverRama(commit);

    return json({ commit, borrados: aBorrar.length });
  } catch (e) {
    return manejarError(e);
  }
};
