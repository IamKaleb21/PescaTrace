import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadAnexo1Coords } from "@/lib/anexo1-coords-loader";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "No disponible en producción" }, { status: 403 });
  }
  try {
    const [coords, proveedor, planta] = await Promise.all([
      Promise.resolve(loadAnexo1Coords()),
      prisma.maestroProveedor.findFirst({ orderBy: { id: "asc" } }),
      prisma.configuracionPlanta.findUnique({ where: { id: 1 } }),
    ]);

    return NextResponse.json({
      coords,
      proveedor: proveedor ?? null,
      planta: planta ?? null,
    });
  } catch (error) {
    console.error("GET /api/anexo1/calibracion:", error);
    return NextResponse.json(
      { error: "Error al cargar datos de calibración" },
      { status: 500 }
    );
  }
}
