/** POST {id}: baja la miniatura de un video de YouTube y la deja lista para publicar. */
import { GitHub } from '../../../servidor/github';
import { error, json, manejarError, type EnvPanel } from '../../../servidor/comun';

const aBase64 = (bytes: Uint8Array) => {
  let binario = '';
  const paso = 0x8000;
  for (let i = 0; i < bytes.length; i += paso) binario += String.fromCharCode(...bytes.subarray(i, i + paso));
  return btoa(binario);
};

export const onRequestPost: PagesFunction<EnvPanel> = async ({ request, env }) => {
  try {
    const { id } = (await request.json().catch(() => ({}))) as { id?: string };
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return error('Ese no parece un link de YouTube válido.', 400);

    let imagen: Response | null = null;
    for (const calidad of ['maxresdefault', 'sddefault', 'hqdefault']) {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/${calidad}.jpg`);
      if (res.ok) {
        imagen = res;
        break;
      }
    }
    if (!imagen) return error('No encontré ese video en YouTube. ¿El link está bien?', 404);

    const bytes = new Uint8Array(await imagen.arrayBuffer());
    const sha = await new GitHub(env).crearBlob(JSON.stringify({ encoding: 'base64', content: aBase64(bytes) }));
    return json({ sha });
  } catch (e) {
    return manejarError(e);
  }
};
