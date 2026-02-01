import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { redondear3 } from "@/lib/numeros";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const turnoIdParam = searchParams.get("turno_id");

    const turno = turnoIdParam
      ? await prisma.produccionTurno.findUnique({
          where: { id: Number(turnoIdParam) },
          include: { recepciones: { include: { proveedor: true } } },
        })
      : await prisma.produccionTurno.findFirst({
          where: { estado: "ABIERTO" },
          include: { recepciones: { include: { proveedor: true } } },
        });

    if (!turno) {
      return NextResponse.json(
        { error: "No hay turno disponible (abierto o con turno_id)" },
        { status: 404 }
      );
    }

    const d = turno.fecha;
    const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

    const [planta, stock, salidasDelDia] = await Promise.all([
      prisma.configuracionPlanta.findUnique({ where: { id: 1 } }),
      prisma.stockProductoTerminado.findUnique({ where: { id: 1 } }),
      prisma.salidaProducto.findMany({
        where: { fecha: { gte: inicio, lte: fin } },
        include: { cliente: true },
      }),
    ]);

    const pesoTransportada = salidasDelDia.reduce((s, x) => s + x.peso_tm, 0);
    const aceite = turno.aceite_tm ?? 0;
    const totalMp = turno.mp_saldo_inicial + turno.mp_ingresos;
    const pctRendHarina =
      turno.mp_procesada > 0 && turno.harina_tm > 0
        ? redondear3((turno.harina_tm / turno.mp_procesada) * 100)
        : "—";
    const pctRendAceite =
      turno.mp_procesada > 0 && aceite > 0
        ? redondear3((aceite / turno.mp_procesada) * 100)
        : "—";
    const factorAceite = aceite > 0 ? redondear3(turno.mp_procesada / aceite) : "—";

    const recepciones = turno.recepciones.map((r) => {
      const esResiduo = r.tipo_producto.toLowerCase() === "residuo";
      const p = redondear3(r.peso_neto_tm);
      return {
        fecha_recepcion: format(new Date(r.fecha_hora), "dd/MM/yy"),
        procedencia: r.proveedor.razon_social,
        placa: r.placa_vehiculo,
        guia_remision: r.guia_remision,
        especie: r.especie,
        residuos_t: esResiduo ? p : 0,
        rep_pesaje_residuos: esResiduo ? p : 0,
        descartes_anchoveta: !esResiduo ? p : 0,
        rep_pesaje_descartes: !esResiduo ? p : 0,
        cert_procedencia: r.anexo_4,
      };
    });

    return NextResponse.json({
      turno: {
        id: turno.id,
        fecha: turno.fecha,
        turno: turno.turno,
        saldo_mp_anterior: redondear3(turno.mp_saldo_inicial),
        total_mp: redondear3(totalMp),
        mp_procesada: redondear3(turno.mp_procesada),
        saldo_poza: redondear3(turno.mp_saldo_final),
        harina_producida: redondear3(turno.harina_tm),
        n_sacos: turno.harina_sacos,
        pct_rend_harina: pctRendHarina,
        factor_harina: redondear3(turno.factor_conversion),
        aceite_producido: redondear3(aceite),
        pct_rend_aceite: pctRendAceite,
        factor_aceite: factorAceite,
      },
      recepciones,
      salidas_stock: {
        peso_transportada: redondear3(pesoTransportada),
        stock_harina: redondear3(stock?.saldo_harina_tm ?? 0),
        stock_aceite: redondear3(stock?.saldo_aceite_tm ?? 0),
      },
      planta: planta ?? null,
    });
  } catch (error) {
    console.error("GET /api/produccion/anexo3:", error);
    return NextResponse.json(
      { error: "Error al obtener datos Anexo 3" },
      { status: 500 }
    );
  }
}
