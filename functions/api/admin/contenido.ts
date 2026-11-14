/** GET: el contenido actual tal como está guardado en GitHub, más quién está conectado. */
import { GitHub } from '../../../servidor/github';
import { json, manejarError, RUTA_GALERIAS, RUTA_SITIO, type EnvPanel } from '../../../servidor/comun';

export const onRequestGet: PagesFunction<EnvPanel, string, { email: string }> = async ({ env, data }) => {
  try {
    const gh = new GitHub(env);
    const { commit, arbol } = await gh.cabeza();
    const archivos = await gh.archivos(arbol);

    const shaSitio = archivos.get(RUTA_SITIO);
    const shaGalerias = archivos.get(RUTA_GALERIAS);
    if (!shaSitio || !shaGalerias) throw new Error('Faltan los archivos de contenido en el repositorio');

    const [sitio, galerias] = await Promise.all([gh.textoDeBlob(shaSitio), gh.textoDeBlob(shaGalerias)]);

    return json({
      commit,
      email: data.email,
      sitio: JSON.parse(sitio),
      galerias: JSON.parse(galerias),
    });
  } catch (e) {
    return manejarError(e);
  }
};
