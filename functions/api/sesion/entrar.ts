/** POST {usuario, contrasena}: entrar al panel. */
import {
  anotarFallo,
  bloqueado,
  contrasenaCorrecta,
  crearSesion,
  usuarioDelPanel,
  type EnvSesion,
} from '../../../servidor/sesion';
import { error, json } from '../../../servidor/comun';

export const onRequestPost: PagesFunction<EnvSesion> = async ({ request, env }) => {
  const origen = request.headers.get('origin');
  if (!origen || new URL(origen).host !== new URL(request.url).host || request.headers.get('x-panel') !== '1') {
    return error('Pedido rechazado.', 403);
  }
  if (!env.PANEL_CONTRASENA_HASH) return error('La entrada con contraseña no está configurada.', 503);
  if (!env.DB) return error('Falta conectar la base de datos (DB) en Cloudflare.', 503);

  if (await bloqueado(env.DB, request)) {
    return error('Demasiados intentos. Esperá 15 minutos y probá de nuevo.', 429);
  }

  const { usuario = '', contrasena = '' } = (await request.json().catch(() => ({}))) as {
    usuario?: string;
    contrasena?: string;
  };

  // siempre se calcula la contraseña, aunque el usuario esté mal (así tarda lo mismo)
  const claveOk = await contrasenaCorrecta(String(contrasena).slice(0, 200), env.PANEL_CONTRASENA_HASH);
  const usuarioOk = String(usuario).trim().toLowerCase() === usuarioDelPanel(env);

  if (!claveOk || !usuarioOk) {
    await anotarFallo(env.DB, request);
    return error('Usuario o contraseña incorrectos.', 401);
  }

  const respuesta = json({ ok: true, usuario: usuarioDelPanel(env) });
  respuesta.headers.append('set-cookie', await crearSesion(env));
  return respuesta;
};
