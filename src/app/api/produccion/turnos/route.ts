import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaStr = searchParams.get("fecha");
    const where: { estado: string; fecha?: { gte: Date; lte: Date } } = {
      estado: "CERRADO",
    };
    if (fechaStr) {
      const parts = fechaStr.split("-").map(Number);
      const [y, m, d] = parts;
      if (y && m && d && parts.length === 3) {
        where.fecha = {
          gte: new Date(y, m - 1, d, 0, 0, 0, 0),
          lte: new Date(y, m - 1, d, 23, 59, 59, 999),
        };
      }
    }
    const turnos = await prisma.produccionTurno.findMany({
      where,
      orderBy: { fecha: "desc" },
      include: {
        recepciones: {
          include: { proveedor: true },
        },
      },
    });
    return NextResponse.json({ turnos });
  } catch (error) {
    console.error("GET /api/produccion/turnos:", error);
    return NextResponse.json(
      { error: "Error al listar turnos" },
      { status: 500 }
    );
  }
}
