import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { Anexo3CoordsShape } from "@/lib/anexo3-coords-loader";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "No disponible en producción" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const coords = body.coords as Anexo3CoordsShape;

    if (!coords?.encabezado || !coords?.tabla || !coords?.pie) {
      return NextResponse.json(
        { error: "Estructura de coords inválida" },
        { status: 400 }
      );
    }
    if (!coords.tabla?.cols || coords.tabla.rowBaseY == null || coords.tabla.rowHeight == null) {
      return NextResponse.json(
        { error: "tabla debe tener rowBaseY, rowHeight y cols" },
        { status: 400 }
      );
    }

    const dataDir = join(process.cwd(), "data");
    mkdirSync(dataDir, { recursive: true });
    const coordsPath = join(dataDir, "anexo3-coords.json");
    writeFileSync(coordsPath, JSON.stringify(coords, null, 2), "utf-8");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/anexo3/coords:", error);
    return NextResponse.json(
      { error: "Error al guardar coordenadas" },
      { status: 500 }
    );
  }
}
