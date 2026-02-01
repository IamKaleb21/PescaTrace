import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redondear3 } from "@/lib/numeros";

export async function GET() {
  try {
    const stock = await prisma.stockProductoTerminado.findUnique({
      where: { id: 1 },
    });
    const s = stock ?? { saldo_harina_tm: 0, saldo_aceite_tm: 0 };
    return NextResponse.json({
      saldo_harina_tm: redondear3(s.saldo_harina_tm),
      saldo_aceite_tm: redondear3(s.saldo_aceite_tm),
    });
  } catch (error) {
    console.error("GET /api/stock:", error);
    return NextResponse.json(
      { error: "Error al obtener stock" },
      { status: 500 }
    );
  }
}
