"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageCheck, TrendingUp, BarChart3 } from "lucide-react";
import { redondear3 } from "@/lib/numeros";

type Stock = {
  saldo_harina_tm: number;
  saldo_aceite_tm: number;
};

export default function DashboardPage() {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stock")
      .then((res) => (res.ok ? res.json() : null))
      .then(setStock)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const harina = redondear3(stock?.saldo_harina_tm ?? 0);
  const aceite = redondear3(stock?.saldo_aceite_tm ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visión general de la planta y métricas clave.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium">Stock de producto terminado</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Harina (TM)</CardTitle>
              <PackageCheck className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{harina.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aceite (TM)</CardTitle>
              <PackageCheck className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{aceite.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Métricas</h2>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="mb-2 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Métricas de producción y despachos próximamente
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Gráficos</h2>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="mb-2 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Gráficos de tendencias y reportes próximamente
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
