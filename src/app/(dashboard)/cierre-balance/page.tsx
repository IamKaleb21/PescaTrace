"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";

type Turno = {
  id: number;
  fecha: string;
  turno: string;
  recepciones: unknown[];
};

type Anexo3Data = {
  turno: Record<string, unknown>;
  salidas_stock: Record<string, unknown>;
};

function escapeCSV(val: unknown): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row).map(escapeCSV).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Anexos3Page() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/produccion/turnos")
      .then((res) => (res.ok ? res.json() : { turnos: [] }))
      .then((data) => setTurnos(data.turnos ?? []))
      .finally(() => setLoading(false));
  }, []);

  const porMes = turnos.reduce<Record<string, Turno[]>>((acc, t) => {
    const d = new Date(t.fecha);
    const key = format(d, "yyyy-MM");
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const meses = Object.keys(porMes).sort().reverse();

  const handleExportCSV = async (turno: Turno) => {
    setExportingId(turno.id);
    try {
      const res = await fetch(`/api/produccion/anexo3?turno_id=${turno.id}`);
      if (!res.ok) throw new Error("Error al obtener datos");
      const data: Anexo3Data = await res.json();
      const fechaStr = format(new Date(turno.fecha), "yyyy-MM-dd");
      const row = {
        fecha: fechaStr,
        turno: turno.turno,
        ...data.turno,
        ...data.salidas_stock,
      };
      downloadCSV([row], `sitrapesca-${fechaStr}-${turno.turno}.csv`);
    } finally {
      setExportingId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Cierre y Balance</h1>
        <p className="mt-2 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cierre y Balance</h1>
        <p className="mt-2 text-muted-foreground">
          Turnos cerrados agrupados por mes. Ver PDF o exportar CSV SITRAPESCA.
        </p>
      </div>

      {meses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-2 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay turnos cerrados. Cierra un turno en Producción para generar
              Anexos 3.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {meses.map((key) => {
            const turnosDelMes = porMes[key];
            const d = new Date(key + "-01");
            const label = format(d, "LLLL yyyy", { locale: es });
            const labelCapitalized =
              label.charAt(0).toUpperCase() + label.slice(1);

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{labelCapitalized}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {turnosDelMes.map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                      >
                        <span className="font-medium">
                          {format(new Date(t.fecha), "dd/MM/yy", {
                            locale: es,
                          })}{" "}
                          · {t.turno}
                        </span>
                        <div className="flex gap-2">
                          <Button asChild variant="default" size="sm">
                            <Link
                              href={`/api/anexo3?turno_id=${t.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2"
                            >
                              <FileText className="size-4" />
                              Ver PDF
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportCSV(t)}
                            disabled={exportingId === t.id}
                          >
                            <Download className="size-4" />
                            {exportingId === t.id ? "..." : "Exportar CSV"}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
