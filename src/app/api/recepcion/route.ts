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

    const recepciones = await prisma.recepcionResiduo.findMany({
      where: {
        fecha_hora: {
          gte: inicio,
          lte: fin,
        },
      },
      include: {
        proveedor: true,
      },
      orderBy: { fecha_hora: "desc" },
    });
    return NextResponse.json(recepciones);
  } catch (error) {
    console.error("GET /api/recepcion:", error);
    return NextResponse.json(
      { error: "Error al obtener recepciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      proveedor_id,
      especie,
      tipo_producto,
      peso_neto_tm,
      placa_vehiculo,
      guia_remision,
      anexo_4,
    } = body;

    if (
      !proveedor_id ||
      !especie ||
      !tipo_producto ||
      peso_neto_tm == null ||
      !placa_vehiculo ||
      !guia_remision ||
      !anexo_4
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan campos requeridos: proveedor_id, especie, tipo_producto, peso_neto_tm, placa_vehiculo, guia_remision, anexo_4",
        },
        { status: 400 }
      );
    }

    let turnoAbierto = await prisma.produccionTurno.findFirst({
      where: { estado: "ABIERTO" },
    });
    if (!turnoAbierto) {
      const ahora = new Date();
      const turno = ahora.getHours() < 18 ? "DIA" : "NOCHE";
      const ultimoCerrado = await prisma.produccionTurno.findFirst({
        where: { estado: "CERRADO" },
        orderBy: { id: "desc" },
      });
      turnoAbierto = await prisma.produccionTurno.create({
        data: {
          fecha: ahora,
          turno,
          estado: "ABIERTO",
          mp_saldo_inicial: ultimoCerrado?.mp_saldo_final ?? 0,
          mp_ingresos: 0,
          mp_procesada: 0,
          mp_saldo_final: ultimoCerrado?.mp_saldo_final ?? 0,
          harina_sacos: 0,
          harina_tm: 0,
          aceite_tm: 0,
          factor_conversion: 0,
        },
      });
    }

    const recepcion = await prisma.recepcionResiduo.create({
      data: {
        proveedor_id: Number(proveedor_id),
        especie: String(especie),
        tipo_producto: String(tipo_producto),
        peso_neto_tm: Number(peso_neto_tm),
        placa_vehiculo: String(placa_vehiculo),
        guia_remision: String(guia_remision),
        anexo_4: String(anexo_4),
        turno_id: turnoAbierto.id,
      },
      include: {
        proveedor: true,
      },
    });
    return NextResponse.json(recepcion, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2002") {
      return NextResponse.json(
        { error: "Esta guía ya fue registrada para este proveedor" },
        { status: 409 }
      );
    }
    console.error("POST /api/recepcion:", error);
    return NextResponse.json(
      { error: "Error al crear recepción" },
      { status: 500 }
    );
  }
}
