"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Proveedor = {
  id: number;
  razon_social: string;
  ruc: string;
  domicilio: string | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  licencia: string | null;
  representante: string | null;
  dni_representante: string | null;
  fecha_vencimiento: string | null;
  activo: boolean;
};

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/proveedores");
        if (res.ok) setProveedores(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const hoy = new Date();
  const esVencido = (fv: string | null) =>
    fv ? new Date(fv) < hoy : false;

  const handleImprimirConvenio = async (p: Proveedor) => {
    setGeneratingId(p.id);
    try {
      const res = await fetch(`/api/anexo1?proveedor_id=${p.id}`);
      if (!res.ok) throw new Error("Error al generar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `convenio-anexo1-${p.ruc}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <p className="mt-2 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Proveedores</h1>
      <p className="text-muted-foreground">
        Lista de proveedores y convenios de abastecimiento.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Proveedores registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RUC</TableHead>
                <TableHead>Razón Social</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Representante</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proveedores.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.ruc}</TableCell>
                  <TableCell>{p.razon_social}</TableCell>
                  <TableCell>{p.licencia ?? "—"}</TableCell>
                  <TableCell>{p.representante ?? "—"}</TableCell>
                  <TableCell>
                    {p.fecha_vencimiento ? (
                      <>
                        {format(new Date(p.fecha_vencimiento), "dd/MM/yy")}
                        {esVencido(p.fecha_vencimiento) && (
                          <Badge
                            variant="destructive"
                            className="ml-2 text-xs"
                          >
                            Vencido
                          </Badge>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={generatingId === p.id}
                      onClick={() => handleImprimirConvenio(p)}
                    >
                      <FileText className="mr-2 size-4" />
                      {generatingId === p.id
                        ? "Generando..."
                        : "Imprimir Convenio (Anexo 1)"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {proveedores.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No hay proveedores registrados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
