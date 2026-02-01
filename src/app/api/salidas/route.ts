import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redondear3 } from "@/lib/numeros";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaStr = searchParams.get("fecha");
    if (!fechaStr) {
      return NextResponse.json(
        { error: "Parámetro fecha requerido (YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    const parts = fechaStr.split("-").map(Number);
    const [y, m, d] = parts;
    if (!y || !m || !d || parts.length !== 3) {
      return NextResponse.json(
        { error: "Formato de fecha inválido (use YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    const inicio = new Date(y, m - 1, d, 0, 0, 0, 0);
    const fin = new Date(y, m - 1, d, 23, 59, 59, 999);

    const salidas = await prisma.salidaProducto.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
      },
      include: { cliente: true },
      orderBy: { fecha: "desc" },
    });
    return NextResponse.json(salidas);
  } catch (error) {
    console.error("GET /api/salidas:", error);
    return NextResponse.json(
      { error: "Error al listar salidas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cliente_id, peso_tm, numero_sacos, guia_remision } = body;

    if (!cliente_id || peso_tm == null || numero_sacos == null || !guia_remision) {
      return NextResponse.json(
        {
          error:
            "Faltan campos requeridos: cliente_id, peso_tm, numero_sacos, guia_remision",
        },
        { status: 400 }
      );
    }

    const salida = await prisma.$transaction(async (tx) => {
      const nuevaSalida = await tx.salidaProducto.create({
        data: {
          cliente_id: Number(cliente_id),
          tipo_producto: "HARINA",
          peso_tm: redondear3(Number(peso_tm)),
          numero_sacos: Number(numero_sacos),
          guia_remision: String(guia_remision),
        },
        include: {
          cliente: true,
        },
      });

      await tx.stockProductoTerminado.update({
        where: { id: 1 },
        data: {
          saldo_harina_tm: {
            decrement: redondear3(Number(peso_tm)),
          },
        },
      });

      return nuevaSalida;
    });

    return NextResponse.json(salida, { status: 201 });
  } catch (error) {
    console.error("POST /api/salidas:", error);
    return NextResponse.json(
      { error: "Error al registrar salida" },
      { status: 500 }
    );
  }
}
