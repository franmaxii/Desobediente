/** Preparar fotos y audios antes de subirlos. */

const LADO_MAXIMO = 2400;

/**
 * Achica la foto (máximo 2400 px del lado largo) y la vuelve a guardar como JPG.
 * Así pesa poco, queda derecha aunque venga girada del celular, y pierde los datos
 * ocultos (como la ubicación GPS).
 */
export async function prepararFoto(archivo: File): Promise<Blob> {
  if (!archivo.type.startsWith('image/')) throw new Error(`«${archivo.name}» no es una foto.`);
  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`No se pudo abrir «${archivo.name}». Probá con una foto JPG o PNG.`);
  }
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('El navegador no pudo procesar la foto.');
  ctx.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  return new Promise((ok, mal) =>
    lienzo.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo procesar la foto.'))), 'image/jpeg', 0.88),
  );
}

/** Duración de un mp3, en segundos. */
export function duracionDeAudio(archivo: Blob): Promise<number> {
  return new Promise((ok) => {
    const audio = new Audio();
    const url = URL.createObjectURL(archivo);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      ok(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => ok(0);
    audio.src = url;
  });
}

export const slug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

const azar = () => Math.random().toString(16).slice(2, 8).padEnd(6, '0');

/** Ruta nueva (relativa a src/assets) para un archivo subido desde el panel. */
export const rutaNueva = (carpeta: string, nombre: string, extension: string) =>
  `subidas/${carpeta}/${slug(nombre) || 'archivo'}-${azar()}.${extension}`;

/** Descripción inicial a partir del nombre del archivo (si el nombre dice algo). */
export function descripcionInicial(nombre: string, porDefecto: string) {
  const limpio = nombre
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[-_\s]*/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  const letras = limpio.replace(/[^a-záéíóúñü]/gi, '').length;
  if (letras < 4 || /\d{5,}/.test(limpio) || /^(img|dsc|photo|whatsapp|image)/i.test(limpio)) return porDefecto;
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
