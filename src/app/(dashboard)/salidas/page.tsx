"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { redondear3 } from "@/lib/numeros";

const salidaSchema = z.object({
  cliente_id: z.string().min(1, "Seleccione cliente"),
  peso_tm: z.number().min(0.01, "Peso debe ser mayor a 0"),
  numero_sacos: z.number().int().min(1, "Nº sacos >= 1"),
  guia_remision: z.string().min(1, "Guía de remisión requerida"),
});

type SalidaForm = z.infer<typeof salidaSchema>;

type Cliente = {
  id: number;
  razon_social: string;
  ruc: string;
};

type Salida = {
  id: number;
  fecha: string;
  tipo_producto: string;
  peso_tm: number;
  numero_sacos: number;
  guia_remision: string;
  cliente: { razon_social: string; ruc: string };
};

export default function SalidasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [stock, setStock] = useState<{ saldo_harina_tm: number; saldo_aceite_tm: number } | null>(null);
  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [fechaSalidas, setFechaSalidas] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);

  const form = useForm<SalidaForm>({
    resolver: zodResolver(salidaSchema),
    defaultValues: {
      peso_tm: 0,
      numero_sacos: 0,
      guia_remision: "",
    },
  });

  const fetchSalidas = useCallback(async () => {
    const res = await fetch(`/api/salidas?fecha=${fechaSalidas}`);
    if (res.ok) setSalidas(await res.json());
  }, [fechaSalidas]);

  useEffect(() => {
    Promise.all([
      fetch("/api/clientes").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/stock").then((res) => (res.ok ? res.json() : null)),
    ]).then(([c, s]) => {
      setClientes(c);
      setStock(s);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSalidas();
  }, [fetchSalidas]);

  const onSubmit = async (values: SalidaForm) => {
    try {
      const res = await fetch("/api/salidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: Number(values.cliente_id),
          peso_tm: values.peso_tm,
          numero_sacos: values.numero_sacos,
          guia_remision: values.guia_remision,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al registrar salida");
      }

      toast.success("Despacho registrado");
      form.reset({ cliente_id: "", peso_tm: 0, numero_sacos: 0, guia_remision: "" });
      fetch("/api/stock").then((res) => { if (res.ok) res.json().then(setStock); });
      fetchSalidas();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al registrar salida");
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Salidas</h1>
        <p className="mt-2 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Salidas</h1>
          <p className="text-muted-foreground">
            Registro de despachos.
          </p>
        </div>
        {stock != null && (
          <div className="rounded-lg border bg-muted/50 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Stock actual: </span>
            <span className="font-medium">Harina {stock.saldo_harina_tm.toFixed(2)} TM</span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-medium">Aceite {stock.saldo_aceite_tm.toFixed(2)} TM</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar despacho</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 max-w-md"
          >
            <div>
              <Label>Cliente</Label>
              <Select
                onValueChange={(v) =>
                  form.setValue("cliente_id", v, { shouldValidate: true })
                }
                value={form.watch("cliente_id") ?? ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.razon_social} ({c.ruc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.cliente_id && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.cliente_id.message}
                </p>
              )}
            </div>

            <div>
              <Label>Peso (TM)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                {...form.register("peso_tm", { valueAsNumber: true })}
                className="mt-1"
              />
              {form.formState.errors.peso_tm && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.peso_tm.message}
                </p>
              )}
            </div>

            <div>
              <Label>Nº Sacos</Label>
              <Input
                type="number"
                min={1}
                {...form.register("numero_sacos", { valueAsNumber: true })}
                className="mt-1"
              />
              {form.formState.errors.numero_sacos && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.numero_sacos.message}
                </p>
              )}
            </div>

            <div>
              <Label>Guía de Remisión</Label>
              <Input
                type="text"
                {...form.register("guia_remision")}
                className="mt-1"
              />
              {form.formState.errors.guia_remision && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.guia_remision.message}
                </p>
              )}
            </div>

            <Button type="submit">Registrar despacho</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Despachos del día</CardTitle>
          <div>
            <Label htmlFor="fecha-salidas" className="sr-only">
              Fecha
            </Label>
            <Input
              id="fecha-salidas"
              type="date"
              value={fechaSalidas}
              onChange={(e) => setFechaSalidas(e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Peso TM</TableHead>
                <TableHead>Nº Sacos</TableHead>
                <TableHead>Guía</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salidas.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{format(new Date(s.fecha), "HH:mm")}</TableCell>
                  <TableCell>{s.cliente.razon_social}</TableCell>
                  <TableCell>{s.tipo_producto}</TableCell>
                  <TableCell>{redondear3(s.peso_tm)}</TableCell>
                  <TableCell>{s.numero_sacos}</TableCell>
                  <TableCell>{s.guia_remision}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {salidas.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No hay despachos para esta fecha.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
