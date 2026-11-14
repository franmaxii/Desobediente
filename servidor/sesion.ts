/**
 * Entrada al panel con usuario y contraseña.
 *
 * - La contraseña nunca se guarda: en Cloudflare solo está su versión cifrada
 *   (PANEL_CONTRASENA_HASH, PBKDF2-SHA256 con sal), que se genera con `npm run contrasena`.
 * - Al entrar se entrega una cookie de sesión firmada (HttpOnly, Secure, SameSite=Strict) por 30 días.
 *   Si se cambia la contraseña, todas las sesiones abiertas dejan de valer.
 * - Los intentos fallidos se cuentan en D1: 5 por persona cada 15 minutos y 30 en total por hora.
 */

export interface EnvSesion {
  /** Usuario del panel (por defecto «desobediente»). */
  PANEL_USUARIO?: string;
  /** Contraseña cifrada, generada con `npm run contrasena`. */
  PANEL_CONTRASENA_HASH?: string;
  DB?: D1Database;
}

export const COOKIE = 'panel_sesion';
const DURACION = 30 * 24 * 60 * 60; // 30 días, en segundos

const texto = (s: string) => new TextEncoder().encode(s);
const deB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const aB64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const usuarioDelPanel = (env: EnvSesion) => (env.PANEL_USUARIO || 'desobediente').trim().toLowerCase();

function igualSeguro(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

export async function contrasenaCorrecta(contrasena: string, guardada: string): Promise<boolean> {
  const [algoritmo, iteraciones, sal, hash] = guardada.split('$');
  if (algoritmo !== 'pbkdf2-sha256' || !sal || !hash) return false;
  const clave = await crypto.subtle.importKey('raw', texto(contrasena), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: deB64(sal), iterations: Number(iteraciones) },
    clave,
    256,
  );
  return igualSeguro(new Uint8Array(bits), deB64(hash));
}

async function claveDeFirma(env: EnvSesion) {
  const base = await crypto.subtle.digest('SHA-256', texto(`sesion:${env.PANEL_CONTRASENA_HASH}`));
  return crypto.subtle.importKey('raw', base, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function crearSesion(env: EnvSesion): Promise<string> {
  const datos = aB64url(texto(JSON.stringify({ u: usuarioDelPanel(env), exp: Math.floor(Date.now() / 1000) + DURACION })));
  const firma = new Uint8Array(await crypto.subtle.sign('HMAC', await claveDeFirma(env), texto(datos)));
  const valor = `${datos}.${aB64url(firma)}`;
  return `${COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURACION}`;
}

export const cerrarSesion = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function leerSesion(request: Request, env: EnvSesion): Promise<{ email: string } | null> {
  if (!env.PANEL_CONTRASENA_HASH) return null;
  const cookie = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  const valor = cookie?.slice(COOKIE.length + 1);
  if (!valor) return null;
  const [datos, firma] = valor.split('.');
  if (!datos || !firma) return null;
  try {
    const valida = await crypto.subtle.verify('HMAC', await claveDeFirma(env), deB64(firma), texto(datos));
    if (!valida) return null;
    const { u, exp } = JSON.parse(new TextDecoder().decode(deB64(datos))) as { u?: string; exp?: number };
    if (!exp || exp < Date.now() / 1000 || u !== usuarioDelPanel(env)) return null;
    return { email: u };
  } catch {
    return null;
  }
}

// ---------- límite de intentos ----------

const ESQUEMA = `CREATE TABLE IF NOT EXISTS intentos_panel (
  clave TEXT NOT NULL, ventana INTEGER NOT NULL, cantidad INTEGER NOT NULL, PRIMARY KEY (clave, ventana))`;

const POR_PERSONA = { maximo: 5, minutos: 15 };
const EN_TOTAL = { maximo: 30, minutos: 60 };

async function claveDePersona(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'desconocida';
  const dia = new Date().toISOString().slice(0, 10);
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', texto(`${ip}|${dia}|panel`)));
  return aB64url(bytes.slice(0, 16));
}

const ventana = (minutos: number) => Math.floor(Date.now() / (minutos * 60_000));

async function conTabla<T>(db: D1Database, consulta: () => Promise<T>): Promise<T> {
  try {
    return await consulta();
  } catch (e) {
    if (!String(e).includes('no such table')) throw e;
    await db.prepare(ESQUEMA).run();
    return consulta();
  }
}

/** ¿Se pasó del límite de intentos? (no suma nada) */
export async function bloqueado(db: D1Database, request: Request): Promise<boolean> {
  const persona = await claveDePersona(request);
  const filas = await conTabla(db, () =>
    db
      .prepare('SELECT clave, cantidad FROM intentos_panel WHERE (clave = ?1 AND ventana = ?2) OR (clave = ?3 AND ventana = ?4)')
      .bind(persona, ventana(POR_PERSONA.minutos), 'total', ventana(EN_TOTAL.minutos))
      .all<{ clave: string; cantidad: number }>(),
  );
  const de = (c: string) => filas.results.find((f) => f.clave === c)?.cantidad ?? 0;
  return de(persona) >= POR_PERSONA.maximo || de('total') >= EN_TOTAL.maximo;
}

export async function anotarFallo(db: D1Database, request: Request): Promise<void> {
  const persona = await claveDePersona(request);
  const sumar = `INSERT INTO intentos_panel (clave, ventana, cantidad) VALUES (?1, ?2, 1)
    ON CONFLICT (clave, ventana) DO UPDATE SET cantidad = cantidad + 1`;
  await conTabla(db, () =>
    db.batch([
      db.prepare(sumar).bind(persona, ventana(POR_PERSONA.minutos)),
      db.prepare(sumar).bind('total', ventana(EN_TOTAL.minutos)),
      db.prepare("DELETE FROM intentos_panel WHERE clave <> 'total' AND ventana < ?1").bind(ventana(POR_PERSONA.minutos) - 8),
      db.prepare("DELETE FROM intentos_panel WHERE clave = 'total' AND ventana < ?1").bind(ventana(EN_TOTAL.minutos) - 48),
    ]),
  );
}
