#!/usr/bin/env node
/**
 * Genera la contraseña del panel y su versión cifrada (lo que se guarda en Cloudflare).
 *
 *   npm run contrasena                  → inventa una contraseña nueva (4 palabras + número)
 *   npm run contrasena -- "mi clave"    → cifra la contraseña que le pases
 *
 * Copiá el resultado «PANEL_CONTRASENA_HASH» como variable secreta del proyecto en Cloudflare.
 * La contraseña en sí no se guarda en ningún lado.
 */
import { webcrypto as crypto } from 'node:crypto';

const PALABRAS = `agua aire alba almendra ancla arena arroz azul balcon bambu barco bosque brisa brujula bufanda cactus cafe calle
camino campana canela canoa carbon carta castillo cereza cielo cine ciruela cobre cometa coral cuaderno cuerda cupula delfin
desierto domingo durazno eclipse escalera espejo estrella faro farol fideo flauta fresa fuego galleta gato girasol globo
granizo guitarra helado hielo higo hoja horno huella humo isla jardin jazmin jirafa juego koala lago lampara lapiz laurel
lechuza lima limon linterna lluvia loro luna madera mango manzana mapa mar marea medusa melon mermelada mimbre mirlo molino
montana mostaza musgo naranja nieve noche nube nuez oasis ola olivo oro oso otono pajaro palmera pan papel paraguas pasto
pecera pera perla piano pimienta pino planeta pluma porton pradera puente pulpo radio rama rayo reloj rio roble roca rosa
rueda sal salvia sandia selva semilla sierra sol sombrero sopa taza teclado tierra tigre tomate tormenta tornado trebol
trigo tronco tulipan uva vainilla valle vela velero ventana verano viento violeta volcan yate yerba zanahoria zorro`
  .split(/\s+/)
  .filter(Boolean);

const ITERACIONES = 10000;
const azar = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
const b64 = (bytes) => Buffer.from(bytes).toString('base64');

async function cifrar(contrasena) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(contrasena), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: ITERACIONES }, clave, 256);
  return `pbkdf2-sha256$${ITERACIONES}$${b64(sal)}$${b64(new Uint8Array(bits))}`;
}

const dada = process.argv.slice(2).join(' ').trim();
const contrasena =
  dada || [0, 1, 2, 3].map(() => PALABRAS[azar(PALABRAS.length)]).join('-') + `-${10 + azar(90)}`;

if (dada && dada.length < 12) {
  console.error('Usá al menos 12 caracteres (mejor varias palabras).');
  process.exit(1);
}

console.log(dada ? '' : `\nContraseña nueva:  ${contrasena}\n`);
console.log(`PANEL_CONTRASENA_HASH=${await cifrar(contrasena)}\n`);
