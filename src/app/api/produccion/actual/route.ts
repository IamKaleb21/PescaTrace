import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const turno = await prisma.produccionTurno.findFirst({
      where: { estado: "ABIERTO" },
      include: {
        recepciones: {
          include: { proveedor: true },
        },
      },
    });
    if (!turno) {
      return NextResponse.json(
        { error: "No hay turno abierto" },
        { status: 404 }
      );
    }
    return NextResponse.json(turno);
  } catch (error) {
    console.error("GET /api/produccion/actual:", error);
    return NextResponse.json(
      { error: "Error al obtener turno actual" },
      { status: 500 }
    );
  }
}
