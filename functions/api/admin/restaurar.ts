/**
 * POST {commit}: vuelve el contenido a como estaba en esa versión.
 * Si alguna foto de esa versión se había borrado, la recupera del historial.
 */
import { esquemaSitio, esquemaGalerias, archivosUsados } from '../../../src/content/esquema';
import { GitHub, type EntradaArbol } from '../../../servidor/github';
import {
  RAIZ_ARCHIVOS,
  RUTA_GALERIAS,
  RUTA_SITIO,
  error,
  json,
  manejarError,
  type EnvPanel,
} from '../../../servidor/comun';

export const onRequestPost: PagesFunction<EnvPanel> = async ({ request, env }) => {
  try {
    const { commit, fecha } = (await request.json().catch(() => ({}))) as { commit?: string; fecha?: string };
    if (!commit || !/^[0-9a-f]{40}$/.test(commit)) return error('Versión inválida.', 400);

    const gh = new GitHub(env);
    const viejos = await gh.archivos(await gh.arbolDeCommit(commit));
    const shaSitio = viejos.get(RUTA_SITIO);
    const shaGalerias = viejos.get(RUTA_GALERIAS);
    if (!shaSitio || !shaGalerias) return error('Esa versión es de antes del panel y no se puede restaurar.', 422);

    const [textoSitio, textoGalerias] = await Promise.all([gh.textoDeBlob(shaSitio), gh.textoDeBlob(shaGalerias)]);
    const sitio = esquemaSitio.safeParse(JSON.parse(textoSitio));
    const galerias = esquemaGalerias.safeParse(JSON.parse(textoGalerias));
    if (!sitio.success || !galerias.success) {
      return error('Esa versión no cumple las reglas actuales y no se puede restaurar.', 422);
    }

    const cabeza = await gh.cabeza();
    const actuales = await gh.archivos(cabeza.arbol);

    const recuperar: EntradaArbol[] = [];
    for (const r of archivosUsados(sitio.data, galerias.data).map((x) => RAIZ_ARCHIVOS + x)) {
      if (actuales.has(r)) continue;
      const sha = viejos.get(r);
      if (!sha) return error(`No se puede recuperar el archivo ${r.replace(RAIZ_ARCHIVOS, '')}.`, 422);
      recuperar.push({ path: r, mode: '100644', type: 'blob', sha });
    }

    const arbol = await gh.crearArbol(cabeza.arbol, [
      { path: RUTA_SITIO, mode: '100644', type: 'blob', sha: shaSitio },
      { path: RUTA_GALERIAS, mode: '100644', type: 'blob', sha: shaGalerias },
      ...recuperar,
    ]);
    if (arbol === cabeza.arbol) return json({ commit: cabeza.commit, sinCambios: true });

    const cuando = fecha ? new Date(fecha).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : commit.slice(0, 7);
    const nuevo = await gh.crearCommit(`Panel: vuelve a la versión del ${cuando}`, arbol, cabeza.commit);
    await gh.moverRama(nuevo);
    return json({ commit: nuevo });
  } catch (e) {
    return manejarError(e);
  }
};
