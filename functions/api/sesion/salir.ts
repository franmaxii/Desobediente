/** POST: cerrar la sesión del panel. */
import { cerrarSesion } from '../../../servidor/sesion';
import { json } from '../../../servidor/comun';

export const onRequestPost: PagesFunction = async () => {
  const respuesta = json({ ok: true });
  respuesta.headers.append('set-cookie', cerrarSesion());
  return respuesta;
};
