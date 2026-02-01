/**
 * Coordenadas para sobreponer datos en Anexo 3 (PDF oficial).
 * Anexo 3 es hoja HORIZONTAL: A4 landscape 842×595 puntos.
 * Sistema: origen abajo-izquierda. y: distancia desde el borde inferior.
 * Tabla: filas iterativas. y = rowBaseY - rowIndex * rowHeight.
 */
export const FONT_SIZE = 9;

// Encabezado (ConfiguracionPlanta) - parte superior
export const ENCABEZADO = {
  dni_ce: { x: 100, y: 565 },
  representante_legal: { x: 200, y: 565 },
  razon_social: { x: 100, y: 550 },
  rd_licencia: { x: 350, y: 535 },
  actividad: { x: 100, y: 520 },
  direccion: { x: 100, y: 505 },
  distrito: { x: 100, y: 492 },
  provincia: { x: 220, y: 492 },
  departamento: { x: 340, y: 492 },
} as const;

// Tabla: 24 columnas. rowBaseY y rowHeight para calcular y por fila.
// procedenciaLineGap: separación vertical entre línea 1 y 2 de procedencia (en puntos PDF).
export const TABLA = {
  rowBaseY: 400,
  rowHeight: 18,
  procedenciaLineGap: 8,
  cols: {
    fecha_recepcion: 30,
    procedencia: 65,
    placa: 100,
    guia_remision: 135,
    especie: 170,
    residuos_t: 205,
    rep_pesaje_residuos: 240,
    descartes_anchoveta: 275,
    rep_pesaje_descartes: 310,
    cert_procedencia: 345,
    saldo_mp_anterior: 380,
    total_mp: 415,
    mp_procesada: 450,
    saldo_poza: 485,
    harina_producida: 520,
    n_sacos: 555,
    pct_rend_harina: 590,
    factor_harina: 625,
    aceite_producido: 660,
    pct_rend_aceite: 695,
    factor_aceite: 730,
    peso_transportada: 765,
    stock_harina: 800,
    stock_aceite: 835,
  },
} as const;

// Pie (representante y DNI) - parte inferior
export const PIE = {
  representante_legal: { x: 100, y: 80 },
  dni_ce: { x: 100, y: 68 },
} as const;
