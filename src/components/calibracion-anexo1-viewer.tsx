"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CoordsShape } from "@/lib/anexo1-coords-loader";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const FONT_SIZE = 9;

type FieldDef = {
  section: "proveedor" | "comprador" | "fecha" | "comunicaciones";
  key: string;
  label: string;
};

const FIELDS_PAGE1: FieldDef[] = [
  { section: "proveedor", key: "razon_social", label: "Razón social" },
  { section: "proveedor", key: "ruc", label: "RUC" },
  { section: "proveedor", key: "domicilio", label: "Domicilio" },
  { section: "proveedor", key: "distrito", label: "Distrito" },
  { section: "proveedor", key: "provincia", label: "Provincia" },
  { section: "proveedor", key: "departamento", label: "Departamento" },
  { section: "proveedor", key: "licencia", label: "Licencia" },
  { section: "proveedor", key: "representante", label: "Representante" },
  { section: "proveedor", key: "dni_representante", label: "DNI Rep." },
  { section: "proveedor", key: "partida_electronica", label: "Partida N°" },
  { section: "proveedor", key: "registro_personas_juridicas", label: "Registro P.J." },
  { section: "comprador", key: "razon_social", label: "Razón social (Planta)" },
  { section: "comprador", key: "ruc", label: "RUC (Planta)" },
  { section: "comprador", key: "direccion", label: "Dirección" },
  { section: "comprador", key: "distrito", label: "Distrito" },
  { section: "comprador", key: "provincia", label: "Provincia" },
  { section: "comprador", key: "departamento", label: "Departamento" },
  { section: "comprador", key: "licencia_resolucion", label: "Licencia" },
  { section: "comprador", key: "domicilio_legal", label: "Domicilio legal" },
  { section: "comprador", key: "representante_legal", label: "Rep. legal" },
  { section: "comprador", key: "dni_representante", label: "DNI Rep." },
  { section: "comprador", key: "partida_electronica", label: "Partida N°" },
  { section: "comprador", key: "registro_personas_juridicas", label: "Registro P.J." },
];

const FIELDS_PAGE6: FieldDef[] = [
  { section: "fecha", key: "ciudad", label: "Ciudad" },
  { section: "fecha", key: "provincia", label: "Provincia" },
  { section: "fecha", key: "departamento", label: "Departamento" },
  { section: "fecha", key: "dia", label: "Día" },
  { section: "fecha", key: "mes", label: "Mes" },
  { section: "fecha", key: "anio", label: "Año" },
  { section: "comunicaciones", key: "proveedor_email_1_pre", label: "Email 1 Prov. (antes @)" },
  { section: "comunicaciones", key: "proveedor_email_1_post", label: "Email 1 Prov. (después @)" },
  { section: "comunicaciones", key: "proveedor_email_2_pre", label: "Email 2 Prov. (antes @)" },
  { section: "comunicaciones", key: "proveedor_email_2_post", label: "Email 2 Prov. (después @)" },
  { section: "comunicaciones", key: "comprador_email_1_pre", label: "Email 1 Comp. (antes @)" },
  { section: "comunicaciones", key: "comprador_email_1_post", label: "Email 1 Comp. (después @)" },
  { section: "comunicaciones", key: "comprador_email_2_pre", label: "Email 2 Comp. (antes @)" },
  { section: "comunicaciones", key: "comprador_email_2_post", label: "Email 2 Comp. (después @)" },
];

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

export function CalibracionAnexo1Viewer() {
  const [tab, setTab] = useState<"page1" | "page6">("page1");
  const [coords, setCoords] = useState<CoordsShape | null>(null);
  const [proveedor, setProveedor] = useState<Record<string, unknown> | null>(null);
  const [planta, setPlanta] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/anexo1/calibracion");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setCoords(data.coords);
      setProveedor(data.proveedor);
      setPlanta(data.planta);
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
    if (f.section === "proveedor" && proveedor) {
      const key = f.key === "partida_electronica" ? "" : f.key;
      return key ? v((proveedor as Record<string, unknown>)[key]) : "—";
    }
    if (f.section === "comprador" && planta) {
      const key = f.key === "partida_electronica" ? "" : f.key;
      return key ? v((planta as Record<string, unknown>)[key]) : "—";
    }
    if (f.section === "comunicaciones") {
      const split = (e: unknown) => {
        const s = e != null ? String(e) : "";
        const i = s.indexOf("@");
        return i >= 0 ? [s.slice(0, i), s.slice(i + 1)] : [s, ""];
      };
      if (f.key === "proveedor_email_1_pre") return split(proveedor?.email_1)[0] || "—";
      if (f.key === "proveedor_email_1_post") return split(proveedor?.email_1)[1] || "—";
      if (f.key === "proveedor_email_2_pre") return split(proveedor?.email_2)[0] || "—";
      if (f.key === "proveedor_email_2_post") return split(proveedor?.email_2)[1] || "—";
      if (f.key === "comprador_email_1_pre") return split(planta?.email_1)[0] || "—";
      if (f.key === "comprador_email_1_post") return split(planta?.email_1)[1] || "—";
      if (f.key === "comprador_email_2_pre") return split(planta?.email_2)[0] || "—";
      if (f.key === "comprador_email_2_post") return split(planta?.email_2)[1] || "—";
    }
    if (f.section === "fecha") {
      const ahora = new Date();
      if (f.key === "ciudad") return v(planta?.distrito ?? proveedor?.distrito);
      if (f.key === "provincia") return v(planta?.provincia ?? proveedor?.provincia);
      if (f.key === "departamento") return v(planta?.departamento ?? proveedor?.departamento);
      if (f.key === "dia") return format(ahora, "d");
      if (f.key === "mes") return format(ahora, "MMMM", { locale: es });
      if (f.key === "anio") return format(ahora, "yyyy");
    }
    return "—";
  };

  const updateFieldPos = (
    section: "proveedor" | "comprador" | "fecha" | "comunicaciones",
    key: string,
    x: number,
    y: number
  ) => {
    if (!coords) return;
    const next = { ...coords };
    const sec = next[section] as Record<string, { x: number; y: number }>;
    sec[key] = { x, y };
    setCoords(next);
  };

  const handleSave = async () => {
    if (!coords) return;
    setSaving(true);
    try {
      const res = await fetch("/api/anexo1/coords", {
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
        <h1 className="text-2xl font-semibold">Calibración Anexo 1</h1>
        <p className="mt-2 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const fields = tab === "page1" ? FIELDS_PAGE1 : FIELDS_PAGE6;
  const pageNum = tab === "page1" ? 1 : 6;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Calibración Anexo 1</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastra los campos para ajustar su posición. Guarda cuando termines.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={tab === "page1" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("page1")}
        >
          Página 1
        </Button>
        <Button
          variant={tab === "page6" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("page6")}
        >
          Página 6
        </Button>
      </div>

      {coords && (
        <div className="relative inline-block overflow-auto rounded-lg border bg-muted/30">
          <div style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }} className="relative">
            <Document file="/anexo1-plantilla.pdf">
              <Page
                pageNumber={pageNum}
                width={PAGE_WIDTH}
                height={PAGE_HEIGHT}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            {fields.map((f) => {
              const pt = (coords[f.section] as Record<string, { x: number; y: number }>)[f.key];
              const fontSize = coords.fontSize ?? FONT_SIZE;
              if (!pt) return null;
              return (
                <DraggableField
                  key={`${f.section}-${f.key}`}
                  x={pt.x}
                  y={pdfToScreen(pt.y, fontSize)}
                  fontSize={fontSize}
                  title={f.label}
                  onDragEnd={(x, y) =>
                    updateFieldPos(f.section, f.key, x, screenToPdf(y, fontSize))
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
