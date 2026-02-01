"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Anexo3CoordsShape } from "@/lib/anexo3-coords-loader";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const FONT_SIZE = 9;

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

type FieldDef = {
  section: "encabezado" | "tabla" | "pie";
  key: string;
  label: string;
  rowIndex?: number;
  /** Si es 1, usa procedenciaLineGap para la posición Y (segunda línea de procedencia). */
  procedenciaLine?: number;
};

const ENCABEZADO_FIELDS: FieldDef[] = [
  { section: "encabezado", key: "dni_ce", label: "DNI/CE" },
  { section: "encabezado", key: "representante_legal", label: "Rep. legal" },
  { section: "encabezado", key: "razon_social", label: "Razón social" },
  { section: "encabezado", key: "rd_licencia", label: "R.D. Licencia" },
  { section: "encabezado", key: "actividad", label: "Actividad" },
  { section: "encabezado", key: "direccion", label: "Dirección" },
  { section: "encabezado", key: "distrito", label: "Distrito" },
  { section: "encabezado", key: "provincia", label: "Provincia" },
  { section: "encabezado", key: "departamento", label: "Departamento" },
];

const TABLA_FIELDS: FieldDef[] = [
  { section: "tabla", key: "fecha_recepcion", label: "Fecha recepción", rowIndex: 0 },
  { section: "tabla", key: "procedencia_l1", label: "Procedencia L1", rowIndex: 0 },
  { section: "tabla", key: "procedencia_l2", label: "Procedencia L2", rowIndex: 0, procedenciaLine: 1 },
  { section: "tabla", key: "placa", label: "Placa", rowIndex: 0 },
  { section: "tabla", key: "guia_remision", label: "Guía remisión", rowIndex: 0 },
  { section: "tabla", key: "especie", label: "Especie", rowIndex: 0 },
  { section: "tabla", key: "residuos_t", label: "Residuos (t)", rowIndex: 0 },
  { section: "tabla", key: "rep_pesaje_residuos", label: "Rep. pesaje residuos", rowIndex: 0 },
  { section: "tabla", key: "descartes_anchoveta", label: "Descartes", rowIndex: 0 },
  { section: "tabla", key: "rep_pesaje_descartes", label: "Rep. pesaje descartes", rowIndex: 0 },
  { section: "tabla", key: "cert_procedencia", label: "Cert. procedencia", rowIndex: 0 },
  { section: "tabla", key: "saldo_mp_anterior", label: "Saldo MP ant.", rowIndex: 0 },
  { section: "tabla", key: "total_mp", label: "Total MP", rowIndex: 0 },
  { section: "tabla", key: "mp_procesada", label: "MP procesada", rowIndex: 0 },
  { section: "tabla", key: "saldo_poza", label: "Saldo poza", rowIndex: 0 },
  { section: "tabla", key: "harina_producida", label: "Harina prod.", rowIndex: 0 },
  { section: "tabla", key: "n_sacos", label: "N° sacos", rowIndex: 0 },
  { section: "tabla", key: "pct_rend_harina", label: "% Rend. harina", rowIndex: 0 },
  { section: "tabla", key: "factor_harina", label: "Factor harina", rowIndex: 0 },
  { section: "tabla", key: "aceite_producido", label: "Aceite prod.", rowIndex: 0 },
  { section: "tabla", key: "pct_rend_aceite", label: "% Rend. aceite", rowIndex: 0 },
  { section: "tabla", key: "factor_aceite", label: "Factor aceite", rowIndex: 0 },
  { section: "tabla", key: "peso_transportada", label: "Peso transportada", rowIndex: 0 },
  { section: "tabla", key: "stock_harina", label: "Stock harina", rowIndex: 0 },
  { section: "tabla", key: "stock_aceite", label: "Stock aceite", rowIndex: 0 },
];

const PIE_FIELDS: FieldDef[] = [
  { section: "pie", key: "representante_legal", label: "Rep. legal (pie)" },
  { section: "pie", key: "dni_ce", label: "DNI (pie)" },
];

const ALL_FIELDS = [...ENCABEZADO_FIELDS, ...TABLA_FIELDS, ...PIE_FIELDS];

function pdfToScreen(pdfY: number, fontSize: number) {
  return PAGE_HEIGHT - pdfY - fontSize;
}

function screenToPdf(screenY: number, fontSize: number) {
  return PAGE_HEIGHT - screenY - fontSize;
}

function DraggableField({
  x,
  y,
  fontSize,
  title,
  onDragEnd,
  children,
}: {
  x: number;
  y: number;
  fontSize: number;
  title: string;
  onDragEnd: (x: number, y: number) => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ x, y });
  const startRef = useRef({ x: 0, y: 0 });
  const latestRef = useRef({ x, y });
  latestRef.current = pos;

  useEffect(() => {
    setPos({ x, y });
  }, [x, y]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      const onMove = (ev: MouseEvent) => {
        const nx = ev.clientX - startRef.current.x;
        const ny = ev.clientY - startRef.current.y;
        latestRef.current = { x: nx, y: ny };
        setPos({ x: nx, y: ny });
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        onDragEnd(latestRef.current.x, latestRef.current.y);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pos.x, pos.y, onDragEnd]
  );

  return (
    <div
      className="absolute cursor-grab border border-amber-500 bg-amber-100/90 text-amber-900 shadow-sm active:cursor-grabbing dark:border-amber-400 dark:bg-amber-900/90 dark:text-amber-100"
      style={{
        left: pos.x,
        top: pos.y,
        fontFamily: "Helvetica, Arial, sans-serif",
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        padding: "0 2px",
      }}
      onMouseDown={handleMouseDown}
      title={title}
    >
      {children}
    </div>
  );
}

export function CalibracionAnexo3Viewer() {
  const [coords, setCoords] = useState<Anexo3CoordsShape | null>(null);
  const [planta, setPlanta] = useState<Record<string, unknown> | null>(null);
  const [turno, setTurno] = useState<Record<string, unknown> | null>(null);
  const [recepciones, setRecepciones] = useState<Record<string, unknown>[]>([]);
  const [salidasStock, setSalidasStock] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/anexo3/calibracion");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setCoords(data.coords);
      setPlanta(data.planta);
      setTurno(data.turno);
      setRecepciones(data.recepciones ?? []);
      setSalidasStock(data.salidas_stock ?? {});
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos de calibración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getFieldValue = (f: FieldDef): string => {
    const v = (val: unknown) => (val != null ? String(val) : "—");
    if (f.section === "encabezado" && planta) {
      if (f.key === "actividad") return "Transformación de recursos hidrobiológicos";
      const key = f.key === "dni_ce" ? "dni_representante" : f.key;
      return v((planta as Record<string, unknown>)[key]);
    }
    if (f.section === "tabla") {
      const r0 = recepciones[0] as Record<string, unknown> | undefined;
      const t = turno as Record<string, unknown> | undefined;
      const s = salidasStock as Record<string, unknown>;
      if (r0 && f.key === "procedencia_l1")
        return splitProcedencia(v(r0.procedencia))[0];
      if (r0 && f.key === "procedencia_l2")
        return splitProcedencia(v(r0.procedencia))[1];
      if (r0 && ["fecha_recepcion", "placa", "guia_remision", "especie", "residuos_t", "rep_pesaje_residuos", "descartes_anchoveta", "rep_pesaje_descartes", "cert_procedencia"].includes(f.key))
        return v(r0[f.key]);
      if (t && ["saldo_mp_anterior", "total_mp", "mp_procesada", "saldo_poza", "harina_producida", "n_sacos", "pct_rend_harina", "factor_harina", "aceite_producido", "pct_rend_aceite", "factor_aceite"].includes(f.key))
        return v(t[f.key]);
      if (["peso_transportada", "stock_harina", "stock_aceite"].includes(f.key))
        return v(s[f.key]);
    }
    if (f.section === "pie" && planta) {
      const key = f.key === "dni_ce" ? "dni_representante" : f.key;
      return v((planta as Record<string, unknown>)[key]);
    }
    return "—";
  };

  const updateFieldPos = (
    section: "encabezado" | "tabla" | "pie",
    key: string,
    x: number,
    y: number,
    rowIndex?: number
  ) => {
    if (!coords) return;
    const next = JSON.parse(JSON.stringify(coords)) as Anexo3CoordsShape;
    if (section === "encabezado" || section === "pie") {
      const sec = next[section] as Record<string, { x: number; y: number }>;
      sec[key] = { x, y: screenToPdf(y, coords.fontSize ?? FONT_SIZE) };
    } else if (section === "tabla") {
      const baseFontSize = coords.fontSize ?? FONT_SIZE;
      if (key === "procedencia_l1") {
        next.tabla.cols["procedencia"] = x;
        if (rowIndex === 0) next.tabla.rowBaseY = screenToPdf(y, baseFontSize);
      } else if (key === "procedencia_l2") {
        next.tabla.cols["procedencia"] = x;
        const rowBaseY = next.tabla.rowBaseY;
        next.tabla.procedenciaLineGap = rowBaseY - screenToPdf(y, baseFontSize);
      } else {
        next.tabla.cols[key] = x;
        if (rowIndex === 0) next.tabla.rowBaseY = screenToPdf(y, baseFontSize);
      }
    }
    setCoords(next);
  };

  const handleSave = async () => {
    if (!coords) return;
    setSaving(true);
    try {
      const res = await fetch("/api/anexo3/coords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coords }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Coordenadas guardadas");
    } catch {
      toast.error("Error al guardar coordenadas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Calibración Anexo 3</h1>
        <p className="mt-2 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const fontSize = coords?.fontSize ?? FONT_SIZE;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Calibración Anexo 3</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastra los campos para ajustar su posición. Guarda cuando termines.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      {coords && (
        <div className="relative inline-block w-full max-w-full overflow-auto rounded-lg border bg-muted/30">
          <div style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }} className="relative shrink-0">
            <Document file="/anexo3-plantilla.pdf">
              <Page
                pageNumber={1}
                width={PAGE_WIDTH}
                height={PAGE_HEIGHT}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            {ALL_FIELDS.map((f) => {
              if (f.section === "encabezado" || f.section === "pie") {
                const pt = (coords[f.section] as Record<string, { x: number; y: number }>)[f.key];
                if (!pt) return null;
                return (
                  <DraggableField
                    key={`${f.section}-${f.key}`}
                    x={pt.x}
                    y={pdfToScreen(pt.y, fontSize)}
                    fontSize={fontSize}
                    title={f.label}
                    onDragEnd={(x, y) =>
                      updateFieldPos(f.section, f.key, x, y)
                    }
                  >
                    {getFieldValue(f)}
                  </DraggableField>
                );
              }
              const colX =
                f.key === "procedencia_l1" || f.key === "procedencia_l2"
                  ? coords.tabla.cols["procedencia"]
                  : coords.tabla.cols[f.key];
              if (colX == null) return null;
              const rowIdx = f.rowIndex ?? 0;
              const gap = coords.tabla.procedenciaLineGap ?? 8;
              const pdfY =
                f.procedenciaLine === 1
                  ? coords.tabla.rowBaseY - rowIdx * coords.tabla.rowHeight - gap
                  : coords.tabla.rowBaseY - rowIdx * coords.tabla.rowHeight;
              const screenY = pdfToScreen(pdfY, fontSize);
              return (
                <DraggableField
                  key={`${f.section}-${f.key}`}
                  x={colX}
                  y={screenY}
                  fontSize={fontSize}
                  title={f.label}
                  onDragEnd={(x, y) =>
                    updateFieldPos("tabla", f.key, x, y, f.rowIndex ?? rowIdx)
                  }
                >
                  {getFieldValue(f)}
                </DraggableField>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
