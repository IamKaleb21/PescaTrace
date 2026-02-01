import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { redondear3 } from "@/lib/numeros";

const PESO_SACO_KG = 0.05;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mp_procesada, harina_sacos } = body;

    if (mp_procesada == null || harina_sacos == null) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: mp_procesada, harina_sacos" },
        { status: 400 }
      );
    }

    const turnoAbierto = await prisma.produccionTurno.findFirst({
      where: { estado: "ABIERTO" },
      include: { recepciones: true },
    });

    if (!turnoAbierto) {
      return NextResponse.json(
        { error: "No hay turno abierto para cerrar" },
        { status: 400 }
      );
    }

    const mpIngresos = redondear3(
      turnoAbierto.recepciones.reduce((s, r) => s + r.peso_neto_tm, 0)
    );
    const harinaTm = redondear3(harina_sacos * PESO_SACO_KG);
    const mpSaldoFinal = redondear3(
      turnoAbierto.mp_saldo_inicial + mpIngresos - Number(mp_procesada)
    );
    const factorConversion =
      harinaTm > 0 && Number(mp_procesada) > 0
        ? redondear3(Number(mp_procesada) / harinaTm)
        : 0;

    const turnoCerrado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.produccionTurno.update({
        where: { id: turnoAbierto.id },
        data: {
          mp_ingresos: mpIngresos,
          mp_procesada: redondear3(Number(mp_procesada)),
          mp_saldo_final: mpSaldoFinal,
          harina_sacos: Number(harina_sacos),
          harina_tm: harinaTm,
          factor_conversion: factorConversion,
          estado: "CERRADO",
        },
      });

      await tx.recepcionResiduo.updateMany({
        where: { turno_id: turnoAbierto.id },
        data: { cerrado: true },
      });

      await tx.stockProductoTerminado.update({
        where: { id: 1 },
        data: {
          saldo_harina_tm: { increment: harinaTm },
        },
      });

      const nextTurno = turnoAbierto.turno === "DIA" ? "NOCHE" : "DIA";
      const nextFecha =
        turnoAbierto.turno === "DIA"
          ? turnoAbierto.fecha
          : addDays(turnoAbierto.fecha, 1);

      await tx.produccionTurno.create({
        data: {
          fecha: nextFecha,
          turno: nextTurno,
          estado: "ABIERTO",
          mp_saldo_inicial: mpSaldoFinal,
          mp_ingresos: 0,
          mp_procesada: 0,
          mp_saldo_final: mpSaldoFinal,
          harina_sacos: 0,
          harina_tm: 0,
          aceite_tm: 0,
          factor_conversion: 0,
        },
      });

      return actualizado;
    });

    return NextResponse.json(turnoCerrado, { status: 200 });
  } catch (error) {
    console.error("POST /api/produccion/cerrar:", error);
    return NextResponse.json(
      { error: "Error al cerrar turno" },
      { status: 500 }
    );
  }
}
