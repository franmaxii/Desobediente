/** GET: las últimas versiones guardadas del contenido (para poder volver atrás). */
import { GitHub } from '../../../servidor/github';
import { json, manejarError, type EnvPanel } from '../../../servidor/comun';

export const onRequestGet: PagesFunction<EnvPanel> = async ({ env }) => {
  try {
    const commits = await new GitHub(env).historial('src/content', 20);
    return json({
      versiones: commits.map((c) => ({
        commit: c.sha,
        fecha: c.commit.committer.date,
        mensaje: c.commit.message.split('\n')[0].replace(/^Panel:\s*/, ''),
        delPanel: c.commit.message.startsWith('Panel:'),
      })),
    });
  } catch (e) {
    return manejarError(e);
  }
};
