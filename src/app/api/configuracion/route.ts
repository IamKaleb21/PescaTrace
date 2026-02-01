import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const config = await prisma.configuracionPlanta.findUnique({
      where: { id: 1 },
    });
    if (!config) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/configuracion:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}
