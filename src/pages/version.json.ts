/**
 * /version.json: qué commit está publicado. El panel lo consulta para avisar
 * cuándo un cambio ya está online (Cloudflare Pages define CF_PAGES_COMMIT_SHA en el build).
 */
import type { APIRoute } from 'astro';

const entorno = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({ commit: entorno.CF_PAGES_COMMIT_SHA ?? 'local', construido: new Date().toISOString() }),
    { headers: { 'content-type': 'application/json' } },
  );
