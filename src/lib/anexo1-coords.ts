/**
 * Coordenadas para sobreponer datos en Anexo 1 (PDF oficial).
 * Sistema: origen abajo-izquierda, A4 ≈ 595×842 puntos.
 * y: distancia desde el borde inferior de la página.
 */
export const FONT_SIZE = 9;
export const LINE_HEIGHT = 14;

// PROVEEDOR - primera sección
export const PROVEEDOR = {
  razon_social: { x: 126, y: 621 },
  ruc: { x: 346, y: 582 },
  domicilio: { x: 106, y: 569 },
  distrito: { x: 315, y: 570 },
  provincia: { x: 462, y: 569 },
  departamento: { x: 193, y: 556 },
  licencia: { x: 151, y: 543 },
  representante: { x: 107, y: 530 },
  dni_representante: { x: 106, y: 517 },
  partida_electronica: { x: 459, y: 514 },
  registro_personas_juridicas: { x: 319, y: 506 },
} as const;

// COMPRADOR/Planta - segunda parte
export const COMPRADOR = {
  razon_social: { x: 339, y: 493 },
  ruc: { x: 103, y: 479 },
  direccion: { x: 347, y: 478 },
  distrito: { x: 107, y: 465 },
  provincia: { x: 235, y: 464 },
  departamento: { x: 418, y: 464 },
  licencia_resolucion: { x: 165, y: 439 },
  domicilio_legal: { x: 88, y: 428 },
  representante_legal: { x: 445, y: 428 },
  dni_representante: { x: 227, y: 414 },
  partida_electronica: { x: 112, y: 400 },
  registro_personas_juridicas: { x: 373, y: 401 },
} as const;

// Fecha de suscripción (pág. 6)
export const FECHA = {
  ciudad: { x: 203, y: 239 },
  provincia: { x: 442, y: 239 },
  departamento: { x: 189, y: 225 },
  dia: { x: 348, y: 227 },
  mes: { x: 110, y: 214 },
  anio: { x: 210, y: 213 },
} as const;

// COMUNICACIONES - emails (pág. 6), formato "...... @ ......"
export const COMUNICACIONES = {
  proveedor_email_1_pre: { x: 232, y: 372 },
  proveedor_email_1_post: { x: 275, y: 372 },
  proveedor_email_2_pre: { x: 409, y: 373 },
  proveedor_email_2_post: { x: 455, y: 372 },
  comprador_email_1_pre: { x: 222, y: 340 },
  comprador_email_1_post: { x: 277, y: 341 },
  comprador_email_2_pre: { x: 380, y: 339 },
  comprador_email_2_post: { x: 458, y: 340 },
} as const;
