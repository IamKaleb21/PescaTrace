"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { CSVLink } from "react-csv";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { redondear3 } from "@/lib/numeros";

const PESO_SACO_KG = 0.05;

const produccionSchema = z.object({
  mp_procesada: z.number().min(0, "MP procesada >= 0"),
  harina_sacos: z.number().int().min(0, "Sacos >= 0"),
});

type ProduccionForm = z.infer<typeof produccionSchema>;

type TurnoActual = {
  id: number;
  fecha: string;
  turno: string;
  mp_saldo_inicial: number;
  recepciones: { id: number; peso_neto_tm: number }[];
};

type TurnoCerradoItem = {
  id: number;
  fecha: string;
  turno: string;
  mp_ingresos: number;
  mp_procesada: number;
  harina_tm: number;
  factor_conversion: number;
  recepciones: { id: number }[];
};

export default function ProduccionPage() {
  const [turnoActual, setTurnoActual] = useState<TurnoActual | null>(null);
  const [turnoCerrado, setTurnoCerrado] = useState<{
    id: number;
    fecha: string;
    turno: string;
  } | null>(null);
  const [anexo3Data, setAnexo3Data] = useState<Record<string, unknown> | null>(null);
  const [stock, setStock] = useState<{ saldo_harina_tm: number; saldo_aceite_tm: number } | null>(null);
  const [turnosCerrados, setTurnosCerrados] = useState<TurnoCerradoItem[]>([]);
  const [fechaTurnos, setFechaTurnos] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [sinTurno, setSinTurno] = useState(false);

  const form = useForm<ProduccionForm>({
    resolver: zodResolver(produccionSchema),
    defaultValues: {
      mp_procesada: 0,
      harina_sacos: 0,
    },
  });

  const mpProcesada = form.watch("mp_procesada");
  const harinaSacos = form.watch("harina_sacos");

  const mpIngresos = turnoActual
    ? redondear3(turnoActual.recepciones.reduce((s, r) => s + r.peso_neto_tm, 0))
    : 0;
  const mpSaldoInicial = turnoActual ? turnoActual.mp_saldo_inicial : 0;
  const harinaTm = redondear3(harinaSacos * PESO_SACO_KG);
  const mpSaldoFinal = redondear3(mpSaldoInicial + mpIngresos - (mpProcesada ?? 0));
  const factor =
    harinaTm > 0 && mpProcesada != null && mpProcesada > 0
      ? redondear3(mpProcesada / harinaTm)
      : null;

  const fetchData = useCallback(async () => {
    const [actualRes, stockRes] = await Promise.all([
      fetch("/api/produccion/actual"),
      fetch("/api/stock"),
    ]);
    if (actualRes.ok) {
      const t = await actualRes.json();
      setTurnoActual({
        id: t.id,
        fecha: t.fecha,
        turno: t.turno,
        mp_saldo_inicial: t.mp_saldo_inicial ?? 0,
        recepciones: t.recepciones ?? [],
      });
      setSinTurno(false);
    } else {
      setTurnoActual(null);
      setSinTurno(true);
    }
    if (stockRes.ok) setStock(await stockRes.json());
  }, []);

  const fetchTurnos = useCallback(async () => {
    const res = await fetch(`/api/produccion/turnos?fecha=${fechaTurnos}`);
    if (res.ok) {
      const data = await res.json();
      setTurnosCerrados(data.turnos ?? []);
    }
  }, [fechaTurnos]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  useEffect(() => {
    fetchTurnos();
  }, [fetchTurnos]);

  const onSubmit = async (values: ProduccionForm) => {
    if (harinaTm <= 0) {
      toast.error("Ingrese la cantidad de harina producida para calcular el factor");
      return;
    }
    const factorNum = typeof factor === "number" ? factor : Number(factor);
    if (isNaN(factorNum) || factorNum <= 0) {
      toast.error("Factor inválido. Verifique MP procesada y sacos.");
      return;
    }

    try {
      const res = await fetch("/api/produccion/cerrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mp_procesada: values.mp_procesada,
          harina_sacos: values.harina_sacos,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cerrar turno");
      }

      const turno = await res.json();
      const fechaStr = format(new Date(turno.fecha), "yyyy-MM-dd");
      setTurnoCerrado({
        id: turno.id,
        fecha: fechaStr,
        turno: turno.turno,
      });

      const anexoRes = await fetch(`/api/produccion/anexo3?turno_id=${turno.id}`);
      if (anexoRes.ok) {
        setAnexo3Data(await anexoRes.json());
      }

      toast.success("Turno cerrado correctamente");
      form.reset({ mp_procesada: 0, harina_sacos: 0 });
      fetchData();
      fetchTurnos();
      setStock(null);
      fetch("/api/stock").then((r) => (r.ok ? r.json() : null)).then(setStock);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cerrar turno");
    }
  };

  const handleCerrarOtro = () => {
    setTurnoCerrado(null);
    setAnexo3Data(null);
    fetchData();
    fetchTurnos();
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Producción</h1>
        <p className="mt-2 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const tablaTurnos = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Turnos cerrados</CardTitle>
        <div>
          <label htmlFor="fecha-turnos" className="sr-only">
            Fecha
          </label>
          <Input
            id="fecha-turnos"
            type="date"
            value={fechaTurnos}
            onChange={(e) => setFechaTurnos(e.target.value)}
            className="w-40"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>MP Ingresos (TM)</TableHead>
              <TableHead>MP Procesada (TM)</TableHead>
              <TableHead>Harina TM</TableHead>
              <TableHead>Factor</TableHead>
              <TableHead>Recepciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turnosCerrados.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{format(new Date(t.fecha), "dd/MM/yy")}</TableCell>
                <TableCell>{t.turno}</TableCell>
                <TableCell>{redondear3(t.mp_ingresos)}</TableCell>
                <TableCell>{redondear3(t.mp_procesada)}</TableCell>
                <TableCell>{redondear3(t.harina_tm)}</TableCell>
                <TableCell>{redondear3(t.factor_conversion)}</TableCell>
                <TableCell>{t.recepciones?.length ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {turnosCerrados.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No hay turnos cerrados para esta fecha.
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (sinTurno) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Producción</h1>
          <p className="mt-2 text-muted-foreground">
            No hay turno abierto. Cierra un turno para que se cree el siguiente automáticamente.
          </p>
        </div>
        {stock != null && (
          <div className="rounded-lg border bg-muted/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Stock actual: </span>
            <span className="font-medium">Harina {redondear3(stock.saldo_harina_tm)} TM</span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-medium">Aceite {redondear3(stock.saldo_aceite_tm)} TM</span>
          </div>
        )}
        {tablaTurnos}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Producción</h1>
          <p className="text-muted-foreground">
            Cierre de turno y balance de masas.
          </p>
        </div>
        {stock != null && (
          <div className="rounded-lg border bg-muted/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Stock actual: </span>
            <span className="font-medium">Harina {redondear3(stock.saldo_harina_tm)} TM</span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-medium">Aceite {redondear3(stock.saldo_aceite_tm)} TM</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Cierre de Turno</CardTitle>
              {turnoActual && (
                <p className="text-sm font-normal text-muted-foreground">
                  Turno actual: {turnoActual.turno} · {format(new Date(turnoActual.fecha), "dd/MM/yy")} · {turnoActual.recepciones.length} recepciones
                </p>
              )}
            </div>
            {turnoActual && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href="/api/anexo3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <FileText className="size-4" />
                  Vista previa Anexo 3
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>MP Saldo Inicial (TM)</Label>
                <Input
                  type="text"
                  readOnly
                  value={redondear3(mpSaldoInicial)}
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label>MP Ingresos (TM)</Label>
                <Input
                  type="text"
                  readOnly
                  value={redondear3(mpIngresos)}
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label>MP Procesada (TM)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("mp_procesada", {
                    valueAsNumber: true,
                  })}
                  className="mt-1"
                />
                {form.formState.errors.mp_procesada && (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.mp_procesada.message}
                  </p>
                )}
              </div>
              <div>
                <Label>MP Saldo Final (TM)</Label>
                <Input
                  type="text"
                  readOnly
                  value={redondear3(mpSaldoFinal)}
                  className="mt-1 bg-muted"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Sacos Harina</Label>
                <Input
                  type="number"
                  min={0}
                  {...form.register("harina_sacos", {
                    valueAsNumber: true,
                  })}
                  className="mt-1"
                />
                {form.formState.errors.harina_sacos && (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.harina_sacos.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Harina TM (Sacos × 0.050)</Label>
                <Input
                  type="text"
                  readOnly
                  value={harinaTm}
                  className="mt-1 bg-muted"
                />
              </div>
              <div>
                <Label>Factor de Conversión</Label>
                <Input
                  type="text"
                  readOnly
                  value={factor ?? "—"}
                  className="mt-1 bg-muted"
                />
                {harinaTm <= 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ingrese harina producida para calcular
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!!turnoCerrado}>
                Cerrar Turno
              </Button>
              {turnoCerrado && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCerrarOtro}
                >
                  Cerrar otro turno
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {turnoCerrado && anexo3Data && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="default" size="sm">
              <Link
                href={`/api/anexo3?turno_id=${turnoCerrado.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-4"
              >
                <FileText className="size-4" />
                Ver PDF Anexo 3
              </Link>
            </Button>
            <CSVLink
              data={[
                {
                  fecha: turnoCerrado.fecha,
                  turno: turnoCerrado.turno,
                  ...(anexo3Data.turno as Record<string, unknown>),
                  ...(anexo3Data.salidas_stock as Record<string, unknown>),
                },
              ]}
              filename={`sitrapesca-${turnoCerrado.fecha}.csv`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="size-4" />
              Exportar SITRAPESCA (CSV)
            </CSVLink>
          </CardContent>
        </Card>
      )}

      {tablaTurnos}
    </div>
  );
}
