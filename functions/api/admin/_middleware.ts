/**
 * Puerta de entrada de todo /api/admin/*.
 * 1) Identidad: sesión del panel (usuario y contraseña) o token de Cloudflare Access. Si no, 401.
 * 2) Los pedidos que cambian algo tienen que venir del propio sitio (si no, 403).
 */
import { verificarAcceso } from '../../../servidor/acceso';
import { leerSesion } from '../../../servidor/sesion';
import { error, type EnvPanel } from '../../../servidor/comun';

export const onRequest: PagesFunction<EnvPanel, string, { email: string }> = async (ctx) => {
  const { request, env } = ctx;

  const identidad = (await leerSesion(request, env)) ?? (await verificarAcceso(request, env));
  if (!identidad) return error('Tenés que entrar al panel.', 401);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origen = request.headers.get('origin');
    const mismoSitio = origen && new URL(origen).host === new URL(request.url).host;
    if (!mismoSitio || request.headers.get('x-panel') !== '1') {
      return error('Pedido rechazado.', 403);
    }
  }

  ctx.data.email = identidad.email;
  const respuesta = await ctx.next();
  const final = new Response(respuesta.body, respuesta);
  final.headers.set('x-robots-tag', 'noindex');
  if (!final.headers.has('cache-control')) final.headers.set('cache-control', 'no-store');
  return final;
};
