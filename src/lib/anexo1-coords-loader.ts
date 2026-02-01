import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  FONT_SIZE,
  PROVEEDOR,
  COMPRADOR,
  FECHA,
  COMUNICACIONES,
} from "./anexo1-coords";

export type CoordsPoint = { x: number; y: number };

export type CoordsShape = {
  proveedor: Record<string, CoordsPoint>;
  comprador: Record<string, CoordsPoint>;
  fecha: Record<string, CoordsPoint>;
  comunicaciones: Record<string, CoordsPoint>;
  fontSize: number;
};

const defaults: CoordsShape = {
  proveedor: { ...PROVEEDOR } as unknown as Record<string, CoordsPoint>,
  comprador: { ...COMPRADOR } as unknown as Record<string, CoordsPoint>,
  fecha: { ...FECHA } as unknown as Record<string, CoordsPoint>,
  comunicaciones: { ...COMUNICACIONES } as unknown as Record<string, CoordsPoint>,
  fontSize: FONT_SIZE,
};

const coordsPath = () => join(process.cwd(), "data", "anexo1-coords.json");

export function loadAnexo1Coords(): CoordsShape {
  const path = coordsPath();
  if (!existsSync(path)) return defaults;

  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as Partial<CoordsShape>;
    return {
      proveedor: { ...defaults.proveedor, ...parsed.proveedor },
      comprador: { ...defaults.comprador, ...parsed.comprador },
      fecha: { ...defaults.fecha, ...parsed.fecha },
      comunicaciones: { ...defaults.comunicaciones, ...parsed.comunicaciones },
      fontSize: parsed.fontSize ?? defaults.fontSize,
    };
  } catch {
    return defaults;
  }
}
