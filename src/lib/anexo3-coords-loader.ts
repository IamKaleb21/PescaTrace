import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { FONT_SIZE, ENCABEZADO, TABLA, PIE } from "./anexo3-coords";

export type CoordsPoint = { x: number; y: number };

export type TablaCoords = {
  rowBaseY: number;
  rowHeight: number;
  procedenciaLineGap?: number;
  cols: Record<string, number>;
};

export type Anexo3CoordsShape = {
  encabezado: Record<string, CoordsPoint>;
  tabla: TablaCoords;
  pie: Record<string, CoordsPoint>;
  fontSize: number;
};

const defaults: Anexo3CoordsShape = {
  encabezado: { ...ENCABEZADO } as unknown as Record<string, CoordsPoint>,
  tabla: {
    rowBaseY: TABLA.rowBaseY,
    rowHeight: TABLA.rowHeight,
    procedenciaLineGap: TABLA.procedenciaLineGap ?? 8,
    cols: { ...TABLA.cols } as unknown as Record<string, number>,
  },
  pie: { ...PIE } as unknown as Record<string, CoordsPoint>,
  fontSize: FONT_SIZE,
};

const coordsPath = () => join(process.cwd(), "data", "anexo3-coords.json");

export function loadAnexo3Coords(): Anexo3CoordsShape {
  const path = coordsPath();
  if (!existsSync(path)) return defaults;

  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Anexo3CoordsShape>;
    return {
      encabezado: { ...defaults.encabezado, ...parsed.encabezado },
      tabla: {
        rowBaseY: parsed.tabla?.rowBaseY ?? defaults.tabla.rowBaseY,
        rowHeight: parsed.tabla?.rowHeight ?? defaults.tabla.rowHeight,
        procedenciaLineGap: parsed.tabla?.procedenciaLineGap ?? defaults.tabla.procedenciaLineGap ?? 8,
        cols: { ...defaults.tabla.cols, ...parsed.tabla?.cols },
      },
      pie: { ...defaults.pie, ...parsed.pie },
      fontSize: parsed.fontSize ?? defaults.fontSize,
    };
  } catch {
    return defaults;
  }
}
