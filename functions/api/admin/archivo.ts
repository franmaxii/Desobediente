/** GET ?ruta=…: muestra un archivo guardado en GitHub (para ver fotos recién publicadas que todavía no están en el sitio). */
import { GitHub } from '../../../servidor/github';
import { error, manejarError, RAIZ_ARCHIVOS, type EnvPanel } from '../../../servidor/comun';

const TIPOS: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  mp3: 'audio/mpeg',
};

export const onRequestGet: PagesFunction<EnvPanel> = async ({ request, env }) => {
  try {
    const ruta = new URL(request.url).searchParams.get('ruta') ?? '';
    const extension = ruta.split('.').pop()?.toLowerCase() ?? '';
    if (!ruta.startsWith(RAIZ_ARCHIVOS) || ruta.includes('..') || !TIPOS[extension]) {
      return error('Archivo inválido.', 400);
    }

    const gh = new GitHub(env);
    const { arbol } = await gh.cabeza();
    const sha = (await gh.archivos(arbol)).get(ruta);
    if (!sha) return error('No existe ese archivo.', 404);

    const original = await gh.blob(sha);
    return new Response(original.body, {
      headers: {
        'content-type': TIPOS[extension],
        'cache-control': 'private, max-age=3600',
        'x-robots-tag': 'noindex',
      },
    });
  } catch (e) {
    return manejarError(e);
  }
};
