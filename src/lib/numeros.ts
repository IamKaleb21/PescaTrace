/** Redondea a 3 decimales (milésima) para evitar errores de punto flotante al mostrar. */
export function redondear3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Convierte número a string con hasta 3 decimales, sin errores de flotante. */
export function formatNum3(n: number): string {
  return String(redondear3(n));
}
