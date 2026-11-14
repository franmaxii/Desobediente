/**
 * POST: sube un archivo (foto o audio) a GitHub como «blob», todavía sin publicarlo.
 * El panel manda el cuerpo listo para GitHub: {"encoding":"base64","content":"…"}.
 * Acá solo se controla el tamaño y que sea de verdad una imagen o un mp3 (por sus primeros bytes),
 * sin decodificar todo, para gastar poco procesamiento.
 */
import { GitHub } from '../../../servidor/github';
import { error, json, manejarError, type EnvPanel } from '../../../servidor/comun';

const MAX_BYTES = 30 * 1024 * 1024; // ~22 MB de archivo real en base64

function tipoDeArchivo(cabecera: Uint8Array): 'imagen' | 'audio' | null {
  const b = cabecera;
  const ascii = (desde: number, largo: number) => String.fromCharCode(...b.slice(desde, desde + largo));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'imagen'; // JPEG
  if (b[0] === 0x89 && ascii(1, 3) === 'PNG') return 'imagen';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'imagen';
  if (ascii(4, 4) === 'ftyp' && /avif|avis/.test(ascii(8, 4))) return 'imagen';
  if (ascii(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'audio'; // MP3
  return null;
}

export const onRequestPost: PagesFunction<EnvPanel> = async ({ request, env }) => {
  try {
    const largo = Number(request.headers.get('content-length') ?? 0);
    if (!largo || largo > MAX_BYTES) return error('El archivo es demasiado grande (máximo 20 MB).', 413);

    const cuerpo = await request.arrayBuffer();
    if (cuerpo.byteLength > MAX_BYTES) return error('El archivo es demasiado grande (máximo 20 MB).', 413);

    // mirar solo el principio: {"encoding":"base64","content":"<base64>…
    const inicio = new TextDecoder().decode(cuerpo.slice(0, 200));
    const marca = '"content":"';
    const i = inicio.indexOf(marca);
    if (!inicio.startsWith('{"encoding":"base64"') || i < 0) return error('Formato de archivo inválido.', 400);
    const muestra = inicio.slice(i + marca.length, i + marca.length + 24);
    let cabecera: Uint8Array;
    try {
      cabecera = Uint8Array.from(atob(muestra), (c) => c.charCodeAt(0));
    } catch {
      return error('Formato de archivo inválido.', 400);
    }
    const tipo = tipoDeArchivo(cabecera);
    if (!tipo) return error('Ese archivo no es una foto (JPG, PNG, WebP) ni un MP3.', 415);

    const sha = await new GitHub(env).crearBlob(cuerpo);
    return json({ sha, tipo });
  } catch (e) {
    return manejarError(e);
  }
};
