import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { loadAnexo3Coords } from "@/lib/anexo3-coords-loader";
import { redondear3 } from "@/lib/numeros";

const valor = (v: string | number | null | undefined) =>
  v == null ? "—" : typeof v === "number" ? String(redondear3(v)) : String(v);

/** Divide el texto de procedencia en dos líneas (separación por espacio cercano al centro). */
function splitProcedencia(text: string): [string, string] {
  const t = String(text || "").trim();
  if (!t || t.length <= 18) return [t, ""];
  const mid = Math.floor(t.length / 2);
  const spaceBefore = t.lastIndexOf(" ", mid);
  const spaceAfter = t.indexOf(" ", mid);
  const splitAt =
    spaceBefore >= 0 && (spaceAfter < 0 || mid - spaceBefore <= spaceAfter - mid)
      ? spaceBefore
      : spaceAfter >= 0
        ? spaceAfter
        : mid;
  return [t.slice(0, splitAt).trim(), t.slice(splitAt).trim()];
}

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
    const factorAceite =
      aceite > 0 ? redondear3(turno.mp_procesada / aceite) : "—";

    const recepcionesData = turno.recepciones.map((r) => {
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

    const rows =
      recepcionesData.length > 0
        ? recepcionesData
        : [{}];

    const coords = loadAnexo3Coords();
    const { encabezado: ENC, tabla: TAB, pie: PIE, fontSize: FONT_SIZE } = coords;
    const COLS = TAB.cols;
    const procedenciaGap = TAB.procedenciaLineGap ?? 8;
    const p = planta ?? {
      razon_social: "",
      ruc: "",
      direccion: null,
      distrito: null,
      provincia: null,
      departamento: null,
      licencia_resolucion: null,
      representante_legal: null,
      dni_representante: null,
    };

    const plantillaPath = join(process.cwd(), "public", "anexo3-plantilla.pdf");
    const pdfBytes = await readFile(plantillaPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(0);

    const drawText = (
      text: string,
      x: number,
      y: number,
      size: number = FONT_SIZE
    ) => {
      if (!text) return;
      page.drawText(String(text).slice(0, 50), {
        x,
        y,
        size,
        color: rgb(0, 0, 0),
      });
    };

    // Encabezado
    drawText(valor(p.dni_representante), ENC.dni_ce.x, ENC.dni_ce.y);
    drawText(valor(p.representante_legal), ENC.representante_legal.x, ENC.representante_legal.y);
    drawText(valor(p.razon_social), ENC.razon_social.x, ENC.razon_social.y);
    drawText(valor(p.licencia_resolucion), ENC.rd_licencia.x, ENC.rd_licencia.y);
    drawText("Transformación de recursos hidrobiológicos", ENC.actividad.x, ENC.actividad.y);
    drawText(valor(p.direccion), ENC.direccion.x, ENC.direccion.y);
    drawText(valor(p.distrito), ENC.distrito.x, ENC.distrito.y);
    drawText(valor(p.provincia), ENC.provincia.x, ENC.provincia.y);
    drawText(valor(p.departamento), ENC.departamento.x, ENC.departamento.y);

    // Tabla: una fila por recepción
    rows.forEach((row, rowIndex) => {
      const y = TAB.rowBaseY - rowIndex * TAB.rowHeight;
      const r = row as Record<string, string | number | undefined>;

      // Grupo 1 - Recepción (10) — procedencia en dos filas
      drawText(valor(r.fecha_recepcion), COLS.fecha_recepcion ?? 30, y);
      const [procL1, procL2] = splitProcedencia(valor(r.procedencia));
      drawText(procL1.slice(0, 50), COLS.procedencia ?? 65, y);
      if (procL2) drawText(procL2.slice(0, 50), COLS.procedencia ?? 65, y - procedenciaGap);
      drawText(valor(r.placa), COLS.placa ?? 100, y);
      drawText(valor(r.guia_remision), COLS.guia_remision ?? 135, y);
      drawText(valor(r.especie), COLS.especie ?? 170, y);
      drawText(valor(r.residuos_t), COLS.residuos_t ?? 205, y);
      drawText(valor(r.rep_pesaje_residuos), COLS.rep_pesaje_residuos ?? 240, y);
      drawText(valor(r.descartes_anchoveta), COLS.descartes_anchoveta ?? 275, y);
      drawText(valor(r.rep_pesaje_descartes), COLS.rep_pesaje_descartes ?? 310, y);
      drawText(valor(r.cert_procedencia), COLS.cert_procedencia ?? 345, y);

      // Grupo 2 y 3 solo en fila 0
      if (rowIndex === 0) {
        drawText(valor(redondear3(turno.mp_saldo_inicial)), COLS.saldo_mp_anterior ?? 380, y);
        drawText(valor(redondear3(totalMp)), COLS.total_mp ?? 415, y);
        drawText(valor(redondear3(turno.mp_procesada)), COLS.mp_procesada ?? 450, y);
        drawText(valor(redondear3(turno.mp_saldo_final)), COLS.saldo_poza ?? 485, y);
        drawText(valor(redondear3(turno.harina_tm)), COLS.harina_producida ?? 520, y);
        drawText(valor(turno.harina_sacos), COLS.n_sacos ?? 555, y);
        drawText(valor(pctRendHarina), COLS.pct_rend_harina ?? 590, y);
        drawText(valor(redondear3(turno.factor_conversion)), COLS.factor_harina ?? 625, y);
        drawText(valor(redondear3(aceite)), COLS.aceite_producido ?? 660, y);
        drawText(valor(pctRendAceite), COLS.pct_rend_aceite ?? 695, y);
        drawText(valor(factorAceite), COLS.factor_aceite ?? 730, y);
        drawText(valor(redondear3(pesoTransportada)), COLS.peso_transportada ?? 765, y);
        drawText(valor(redondear3(stock?.saldo_harina_tm ?? 0)), COLS.stock_harina ?? 800, y);
        drawText(valor(redondear3(stock?.saldo_aceite_tm ?? 0)), COLS.stock_aceite ?? 835, y);
      }
    });

    // Pie
    drawText(valor(p.representante_legal), PIE.representante_legal.x, PIE.representante_legal.y);
    drawText(valor(p.dni_representante), PIE.dni_ce.x, PIE.dni_ce.y);

    const filledPdf = await pdfDoc.save();
    const buffer = Buffer.from(filledPdf);

    const filename = `anexo3-${turno.fecha.toISOString().slice(0, 10)}-${turno.turno}.pdf`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/anexo3:", error);
    return NextResponse.json(
      { error: "Error al generar Anexo 3" },
      { status: 500 }
    );
  }
}
