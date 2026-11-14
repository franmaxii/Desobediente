/**
 * Texto con links simples, escritos así: [texto del link](https://…) o [texto](#seccion).
 * Todo lo demás se escapa, así que desde el panel no se puede meter HTML.
 */
const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function conEnlaces(texto: string): string {
  return escapar(texto).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, etiqueta: string, destino: string) => {
    const real = destino.replace(/&amp;/g, '&');
    if (real.startsWith('#')) return `<a href="${destino}">${etiqueta}</a>`;
    if (/^https?:\/\//.test(real)) return `<a href="${destino}" target="_blank" rel="noopener">${etiqueta}</a>`;
    return etiqueta;
  });
}
