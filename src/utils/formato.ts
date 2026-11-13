/** '2026-04-13' → '13.04.2026' */
export const fechaLarga = (iso: string) => {
  const [a, m, d] = iso.split('-');
  return `${d}.${m}.${a}`;
};

/** '2026-04-13' → '13.04' */
export const fechaCorta = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
};

/** '2026-04-13' → '2026' */
export const anio = (iso: string) => iso.slice(0, 4);

/** 200 → '3:20' */
export const duracion = (seg: number) => {
  const s = Math.max(0, Math.floor(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
