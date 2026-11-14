/**
 * Contador global de corazones.
 *
 *   GET  /api/reacciones                 → { total }
 *   POST /api/reacciones { cantidad }    → { total, aceptadas }
 *
 * Usa una base D1 enlazada al proyecto de Pages con el nombre `DB`.
 * Las tablas se crean solas la primera vez.
 *
 * Anti-abuso: cada pedido suma como máximo MAX_POR_PEDIDO y cada visitante
 * (IP anonimizada con un hash que cambia todos los días) puede sumar como
 * máximo MAX_POR_MINUTO por minuto.
 */

interface Env {
  DB?: D1Database;
}

const CONTADOR = 'corazones';
const MAX_POR_PEDIDO = 25;
const MAX_POR_MINUTO = 60;

const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS reacciones (
     id TEXT PRIMARY KEY,
     total INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS limites (
     clave TEXT NOT NULL,
     ventana INTEGER NOT NULL,
     cantidad INTEGER NOT NULL,
     PRIMARY KEY (clave, ventana)
   )`,
];

const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });

/** Corre la consulta; si faltan las tablas, las crea y reintenta una vez. */
async function conEsquema<T>(db: D1Database, consulta: () => Promise<T>): Promise<T> {
  try {
    return await consulta();
  } catch (error) {
    if (!String(error).includes('no such table')) throw error;
    await db.batch(ESQUEMA.map((sql) => db.prepare(sql)));
    return consulta();
  }
}

async function leerTotal(db: D1Database): Promise<number> {
  const fila = await db
    .prepare('SELECT total FROM reacciones WHERE id = ?1')
    .bind(CONTADOR)
    .first<{ total: number }>();
  return fila?.total ?? 0;
}

/** Hash de la IP + el día: sirve para limitar sin guardar la IP real. */
async function claveVisitante(request: Request): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') ?? 'desconocida';
  const dia = new Date().toISOString().slice(0, 10);
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${dia}|desobediente`));
  return Array.from(new Uint8Array(bytes).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Rechaza pedidos que vienen de otros sitios. */
function esMismoOrigen(request: Request): boolean {
  const origen = request.headers.get('origin');
  if (!origen) return true;
  try {
    return new URL(origen).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const db = env.DB;
  if (!db) return json({ error: 'La base de datos no está configurada.' }, 503);

  const total = await conEsquema(db, () => leerTotal(db));
  return json({ total });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const db = env.DB;
  if (!db) return json({ error: 'La base de datos no está configurada.' }, 503);
  if (!esMismoOrigen(request)) return json({ error: 'Origen no permitido.' }, 403);

  let cantidad = 1;
  try {
    const cuerpo = await request.json<{ cantidad?: unknown }>();
    cantidad = Number(cuerpo?.cantidad ?? 1);
  } catch {
    // cuerpo vacío o inválido: cuenta como 1
  }
  if (!Number.isFinite(cantidad)) cantidad = 1;
  cantidad = Math.min(MAX_POR_PEDIDO, Math.max(1, Math.floor(cantidad)));

  const clave = await claveVisitante(request);
  const ventana = Math.floor(Date.now() / 60_000);

  const resultado = await conEsquema(db, async () => {
    const limite = await db
      .prepare(
        `INSERT INTO limites (clave, ventana, cantidad) VALUES (?1, ?2, ?3)
         ON CONFLICT (clave, ventana) DO UPDATE SET cantidad = cantidad + excluded.cantidad
         RETURNING cantidad`,
      )
      .bind(clave, ventana, cantidad)
      .first<{ cantidad: number }>();

    const usadasAntes = (limite?.cantidad ?? cantidad) - cantidad;
    const aceptadas = Math.max(0, Math.min(cantidad, MAX_POR_MINUTO - usadasAntes));
    if (aceptadas === 0) return { total: await leerTotal(db), aceptadas };

    const fila = await db
      .prepare(
        `INSERT INTO reacciones (id, total) VALUES (?1, ?2)
         ON CONFLICT (id) DO UPDATE SET total = total + excluded.total
         RETURNING total`,
      )
      .bind(CONTADOR, aceptadas)
      .first<{ total: number }>();

    return { total: fila?.total ?? aceptadas, aceptadas };
  });

  // de vez en cuando, borra ventanas viejas del limitador
  if (Math.random() < 0.02) {
    waitUntil(db.prepare('DELETE FROM limites WHERE ventana < ?1').bind(ventana - 5).run());
  }

  return json(resultado, resultado.aceptadas === 0 ? 429 : 200);
};
