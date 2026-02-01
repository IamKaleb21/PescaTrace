"use client";

import { useEffect, useState } from "react";
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

const recepcionSchema = z.object({
  proveedor_id: z.string().min(1, "Seleccione proveedor"),
  especie: z.enum(["Anchoveta", "Blanca"]),
  tipo_producto: z.enum(["Residuo", "Descarte"]),
  peso_neto_tm: z.number().min(0.01, "Peso debe ser mayor a 0"),
  placa_vehiculo: z.string().min(1, "Placa requerida"),
  guia_remision: z
    .string()
    .min(1, "Guía requerida")
    .regex(/^[A-Za-z0-9\-]+$/, "Guía: solo letras, números y guiones"),
  anexo_4: z.string().min(1, "Anexo 4 requerido"),
});

type RecepcionForm = z.infer<typeof recepcionSchema>;

type Proveedor = {
  id: number;
  razon_social: string;
  ruc: string;
  licencia: string | null;
  fecha_vencimiento: string | null;
};

type Recepcion = {
  id: number;
  fecha_hora: string;
  especie: string;
  tipo_producto: string;
  peso_neto_tm: number;
  placa_vehiculo: string;
  guia_remision: string;
  anexo_4: string;
  proveedor: { razon_social: string };
};

export default function RecepcionPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [fecha, setFecha] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );

  const form = useForm<RecepcionForm>({
    resolver: zodResolver(recepcionSchema),
    defaultValues: {
      especie: "Anchoveta",
      tipo_producto: "Residuo",
    },
  });

  const proveedorId = form.watch("proveedor_id");
  const proveedorSeleccionado = proveedores.find(
    (p) => p.id === Number(proveedorId)
  );
  const convenioVencido =
    proveedorSeleccionado?.fecha_vencimiento &&
    new Date(proveedorSeleccionado.fecha_vencimiento) < new Date();

  const fetchProveedores = async () => {
    const res = await fetch("/api/proveedores");
    if (res.ok) setProveedores(await res.json());
  };

  const fetchRecepciones = async () => {
    const res = await fetch(`/api/recepcion?fecha=${fecha}`);
    if (res.ok) setRecepciones(await res.json());
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  useEffect(() => {
    fetchRecepciones();
  }, [fecha]);

  const onSubmit = async (data: RecepcionForm) => {
    try {
      const res = await fetch("/api/recepcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          proveedor_id: Number(data.proveedor_id),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 409) {
        toast.error(json.error || "Guía Duplicada");
        return;
      }

      if (!res.ok) {
        toast.error(json.error || "Error al registrar recepción");
        return;
      }

      toast.success("Recepción registrada");
      form.reset();
      fetchRecepciones();
    } catch {
      toast.error("Error al registrar recepción");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Recepción</h1>
      <p className="text-muted-foreground">
        Registro de recepción de residuos y descartes.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Nueva recepción</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select
                onValueChange={(v) =>
                  form.setValue("proveedor_id", v, { shouldValidate: true })
                }
                value={form.watch("proveedor_id") ?? ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.proveedor_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.proveedor_id.message}
                </p>
              )}
              {proveedorSeleccionado && (
                <p className="text-sm text-muted-foreground">
                  Licencia: {proveedorSeleccionado.licencia ?? "—"}
                </p>
              )}
              {convenioVencido && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Convenio vencido — Este proveedor tiene convenio vencido
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Especie</Label>
              <Select
                onValueChange={(v) =>
                  form.setValue("especie", v as "Anchoveta" | "Blanca")
                }
                value={form.watch("especie")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anchoveta">Anchoveta</SelectItem>
                  <SelectItem value="Blanca">Blanca</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo producto</Label>
              <Select
                onValueChange={(v) =>
                  form.setValue("tipo_producto", v as "Residuo" | "Descarte")
                }
                value={form.watch("tipo_producto")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residuo">Residuo</SelectItem>
                  <SelectItem value="Descarte">Descarte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Peso neto (TM)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("peso_neto_tm", {
                  setValueAs: (v) =>
                    v === "" || v === undefined ? undefined : parseFloat(v),
                })}
              />
              {form.formState.errors.peso_neto_tm && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.peso_neto_tm.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Placa vehículo</Label>
              <Input {...form.register("placa_vehiculo")} />
              {form.formState.errors.placa_vehiculo && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.placa_vehiculo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Guía de remisión</Label>
              <Input {...form.register("guia_remision")} />
              {form.formState.errors.guia_remision && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.guia_remision.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Anexo 4</Label>
              <Input {...form.register("anexo_4")} />
              {form.formState.errors.anexo_4 && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.anexo_4.message}
                </p>
              )}
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <Button type="submit">Registrar recepción</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recepciones del día</CardTitle>
          <div>
            <Label htmlFor="fecha-recepciones" className="sr-only">
              Fecha
            </Label>
            <Input
              id="fecha-recepciones"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Especie</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Peso TM</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Guía</TableHead>
                <TableHead>Anexo 4</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recepciones.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {format(new Date(r.fecha_hora), "HH:mm")}
                  </TableCell>
                  <TableCell>{r.proveedor.razon_social}</TableCell>
                  <TableCell>{r.especie}</TableCell>
                  <TableCell>{r.tipo_producto}</TableCell>
                  <TableCell>{r.peso_neto_tm}</TableCell>
                  <TableCell>{r.placa_vehiculo}</TableCell>
                  <TableCell>{r.guia_remision}</TableCell>
                  <TableCell>{r.anexo_4}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {recepciones.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No hay recepciones para esta fecha.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
