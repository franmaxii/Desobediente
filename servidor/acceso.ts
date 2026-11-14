/**
 * Verifica que quien llama al panel entró por Cloudflare Access y está en la lista de mails permitidos.
 *
 * Cloudflare Access pone un token firmado (JWT) en cada pedido. Acá se comprueba:
 * la firma (con las claves públicas del equipo), el «aud» de la aplicación, el emisor,
 * el vencimiento y que el mail esté en ADMIN_EMAILS. Si falta configuración, se rechaza todo.
 */

export interface EnvAcceso {
  /** Ej.: «miequipo.cloudflareaccess.com» */
  ACCESS_TEAM_DOMAIN?: string;
  /** «Application Audience (AUD) Tag» de la aplicación de Access. */
  ACCESS_AUD?: string;
  /** Mails permitidos, separados por coma. */
  ADMIN_EMAILS?: string;
  /** Solo para probar en la compu: «1» deja pasar pedidos a localhost sin Access. */
  PANEL_DESARROLLO?: string;
}

interface ClavePublica extends JsonWebKey {
  kid?: string;
}

let cacheClaves: { dominio: string; claves: ClavePublica[]; vence: number } | null = null;

const base64url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};
const json = <T>(parte: string): T => JSON.parse(new TextDecoder().decode(base64url(parte)));

const dominioLimpio = (d: string) => d.replace(/^https?:\/\//, '').replace(/\/+$/, '');

async function clavesPublicas(dominio: string, forzar = false): Promise<ClavePublica[]> {
  if (!forzar && cacheClaves && cacheClaves.dominio === dominio && cacheClaves.vence > Date.now()) {
    return cacheClaves.claves;
  }
  const res = await fetch(`https://${dominio}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('No se pudieron leer las claves de Cloudflare Access');
  const { keys } = (await res.json()) as { keys: ClavePublica[] };
  cacheClaves = { dominio, claves: keys, vence: Date.now() + 60 * 60 * 1000 };
  return keys;
}

function leerCookie(request: Request, nombre: string): string | null {
  const cookies = request.headers.get('cookie') ?? '';
  for (const parte of cookies.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return v.join('=');
  }
  return null;
}

export async function verificarAcceso(request: Request, env: EnvAcceso): Promise<{ email: string } | null> {
  const url = new URL(request.url);
  if (env.PANEL_DESARROLLO === '1' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
    return { email: 'desarrollo@localhost' };
  }

  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAILS) return null;

  const token = request.headers.get('cf-access-jwt-assertion') ?? leerCookie(request, 'CF_Authorization');
  if (!token) return null;

  const partes = token.split('.');
  if (partes.length !== 3) return null;
  const [h, p, firma] = partes;

  try {
    const header = json<{ alg?: string; kid?: string }>(h);
    if (header.alg !== 'RS256' || !header.kid) return null;

    const dominio = dominioLimpio(env.ACCESS_TEAM_DOMAIN);
    let claves = await clavesPublicas(dominio);
    let jwk = claves.find((k) => k.kid === header.kid);
    if (!jwk) {
      claves = await clavesPublicas(dominio, true);
      jwk = claves.find((k) => k.kid === header.kid);
    }
    if (!jwk) return null;

    const clave = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [
      'verify',
    ]);
    const valida = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      clave,
      base64url(firma),
      new TextEncoder().encode(`${h}.${p}`),
    );
    if (!valida) return null;

    const datos = json<{ aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string }>(p);
    const ahora = Date.now() / 1000;
    if (!datos.exp || datos.exp < ahora) return null;
    if (datos.nbf && datos.nbf > ahora + 60) return null;

    const auds = Array.isArray(datos.aud) ? datos.aud : [datos.aud];
    if (!auds.includes(env.ACCESS_AUD)) return null;
    if (datos.iss !== `https://${dominio}`) return null;

    const email = String(datos.email ?? '').toLowerCase();
    const permitidos = env.ADMIN_EMAILS.split(',')
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);
    if (!email || !permitidos.includes(email)) return null;

    return { email };
  } catch {
    return null;
  }
}
