import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redondear3 } from "@/lib/numeros";

export async function GET() {
  try {
    const ultimo = await prisma.produccionTurno.findFirst({
      where: { estado: "CERRADO" },
      orderBy: { id: "desc" },
    });
    const mp_saldo_final = redondear3(ultimo ? ultimo.mp_saldo_final : 0);
    return NextResponse.json({ mp_saldo_final });
  } catch (error) {
    console.error("GET /api/produccion/ultimo:", error);
    return NextResponse.json(
      { error: "Error al obtener último turno" },
      { status: 500 }
    );
  }
}
