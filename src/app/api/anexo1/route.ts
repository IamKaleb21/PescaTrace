import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { loadAnexo1Coords } from "@/lib/anexo1-coords-loader";

const valor = (v: string | null | undefined) => (v ? v : "—");

export async function GET(request: NextRequest) {
  try {
    const coords = loadAnexo1Coords();
    const { proveedor: PROVEEDOR, comprador: COMPRADOR, fecha: FECHA, comunicaciones: COMUNICACIONES } = coords;
    const FONT_SIZE = coords.fontSize;
    const { searchParams } = new URL(request.url);
    const proveedorId = searchParams.get("proveedor_id");
    if (!proveedorId) {
      return NextResponse.json(
        { error: "proveedor_id requerido" },
        { status: 400 }
      );
    }

    const [proveedor, planta] = await Promise.all([
      prisma.maestroProveedor.findUnique({
        where: { id: Number(proveedorId) },
      }),
      prisma.configuracionPlanta.findUnique({
        where: { id: 1 },
      }),
    ]);

    if (!proveedor || !planta) {
      return NextResponse.json(
        { error: "Proveedor o planta no encontrados" },
        { status: 404 }
      );
    }

    const plantillaPath = join(
      process.cwd(),
      "public",
      "anexo1-plantilla.pdf"
    );
    const pdfBytes = await readFile(plantillaPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(0);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const drawText = (
      text: string,
      x: number,
      y: number,
      size: number = FONT_SIZE
    ) => {
      if (!text) return;
      page.drawText(text, {
        x,
        y,
        size,
        color: rgb(0, 0, 0),
      });
    };

    // PROVEEDOR
    drawText(valor(proveedor.razon_social), PROVEEDOR.razon_social.x, PROVEEDOR.razon_social.y);
    drawText(valor(proveedor.ruc), PROVEEDOR.ruc.x, PROVEEDOR.ruc.y);
    drawText(valor(proveedor.domicilio), PROVEEDOR.domicilio.x, PROVEEDOR.domicilio.y);
    drawText(valor(proveedor.distrito), PROVEEDOR.distrito.x, PROVEEDOR.distrito.y);
    drawText(valor(proveedor.provincia), PROVEEDOR.provincia.x, PROVEEDOR.provincia.y);
    drawText(valor(proveedor.departamento), PROVEEDOR.departamento.x, PROVEEDOR.departamento.y);
    drawText(valor(proveedor.licencia), PROVEEDOR.licencia.x, PROVEEDOR.licencia.y);
    drawText(valor(proveedor.representante), PROVEEDOR.representante.x, PROVEEDOR.representante.y);
    drawText(valor(proveedor.dni_representante), PROVEEDOR.dni_representante.x, PROVEEDOR.dni_representante.y);
    drawText("—", PROVEEDOR.partida_electronica.x, PROVEEDOR.partida_electronica.y);
    drawText(valor(proveedor.registro_personas_juridicas) || "SUNARP", PROVEEDOR.registro_personas_juridicas.x, PROVEEDOR.registro_personas_juridicas.y);

    // COMPRADOR (planta)
    drawText(valor(planta.razon_social), COMPRADOR.razon_social.x, COMPRADOR.razon_social.y);
    drawText(valor(planta.ruc), COMPRADOR.ruc.x, COMPRADOR.ruc.y);
    drawText(valor(planta.direccion), COMPRADOR.direccion.x, COMPRADOR.direccion.y);
    drawText(valor(planta.distrito), COMPRADOR.distrito.x, COMPRADOR.distrito.y);
    drawText(valor(planta.provincia), COMPRADOR.provincia.x, COMPRADOR.provincia.y);
    drawText(valor(planta.departamento), COMPRADOR.departamento.x, COMPRADOR.departamento.y);
    drawText(valor(planta.licencia_resolucion), COMPRADOR.licencia_resolucion.x, COMPRADOR.licencia_resolucion.y);
    drawText(valor(planta.direccion), COMPRADOR.domicilio_legal.x, COMPRADOR.domicilio_legal.y);
    drawText(valor(planta.representante_legal), COMPRADOR.representante_legal.x, COMPRADOR.representante_legal.y);
    drawText(valor(planta.dni_representante), COMPRADOR.dni_representante.x, COMPRADOR.dni_representante.y);
    drawText("—", COMPRADOR.partida_electronica.x, COMPRADOR.partida_electronica.y);
    drawText(valor(planta.registro_personas_juridicas) || "SUNARP", COMPRADOR.registro_personas_juridicas.x, COMPRADOR.registro_personas_juridicas.y);

    // COMUNICACIONES (emails, Cláusula Décimo Tercera - pág. 6)
    // El PDF tiene "...... @ ......" — dibujar parte antes y después de @
    if (COMUNICACIONES) {
      const drawCom = (t: string, x: number, y: number) => {
        if (!t) return;
        lastPage.drawText(t, { x, y, size: FONT_SIZE, color: rgb(0, 0, 0) });
      };
      const splitEmail = (e: string | null | undefined) => {
        const s = valor(e);
        const idx = s.indexOf("@");
        return idx >= 0 ? [s.slice(0, idx), s.slice(idx + 1)] : [s, ""];
      };
      const [p1pre, p1post] = splitEmail(proveedor.email_1);
      const [p2pre, p2post] = splitEmail(proveedor.email_2);
      const [c1pre, c1post] = splitEmail(planta.email_1);
      const [c2pre, c2post] = splitEmail(planta.email_2);
      drawCom(p1pre, COMUNICACIONES.proveedor_email_1_pre.x, COMUNICACIONES.proveedor_email_1_pre.y);
      drawCom(p1post, COMUNICACIONES.proveedor_email_1_post.x, COMUNICACIONES.proveedor_email_1_post.y);
      drawCom(p2pre, COMUNICACIONES.proveedor_email_2_pre.x, COMUNICACIONES.proveedor_email_2_pre.y);
      drawCom(p2post, COMUNICACIONES.proveedor_email_2_post.x, COMUNICACIONES.proveedor_email_2_post.y);
      drawCom(c1pre, COMUNICACIONES.comprador_email_1_pre.x, COMUNICACIONES.comprador_email_1_pre.y);
      drawCom(c1post, COMUNICACIONES.comprador_email_1_post.x, COMUNICACIONES.comprador_email_1_post.y);
      drawCom(c2pre, COMUNICACIONES.comprador_email_2_pre.x, COMUNICACIONES.comprador_email_2_pre.y);
      drawCom(c2post, COMUNICACIONES.comprador_email_2_post.x, COMUNICACIONES.comprador_email_2_post.y);
    }

    const ahora = new Date();
    const ciudad = valor(planta.distrito) || valor(proveedor.distrito);
    const provincia = valor(planta.provincia) || valor(proveedor.provincia);
    const departamento = valor(planta.departamento) || valor(proveedor.departamento);

    const drawFecha = (
      text: string,
      x: number,
      y: number,
      size: number = FONT_SIZE
    ) => {
      if (!text) return;
      lastPage.drawText(text, {
        x,
        y,
        size,
        color: rgb(0, 0, 0),
      });
    };

    drawFecha(ciudad, FECHA.ciudad.x, FECHA.ciudad.y);
    drawFecha(provincia, FECHA.provincia.x, FECHA.provincia.y);
    drawFecha(departamento, FECHA.departamento.x, FECHA.departamento.y);
    drawFecha(format(ahora, "d"), FECHA.dia.x, FECHA.dia.y);
    drawFecha(format(ahora, "MMMM", { locale: es }), FECHA.mes.x, FECHA.mes.y);
    drawFecha(format(ahora, "yyyy"), FECHA.anio.x, FECHA.anio.y);

    const filledPdf = await pdfDoc.save();
    const buffer = Buffer.from(filledPdf);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="convenio-anexo1-${proveedor.ruc}.pdf"`,
      },
    });
  } catch (error) {
    console.error("GET /api/anexo1:", error);
    return NextResponse.json(
      { error: "Error al generar Anexo 1" },
      { status: 500 }
    );
  }
}
