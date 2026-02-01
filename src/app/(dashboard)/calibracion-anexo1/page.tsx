"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CalibracionAnexo1Viewer = dynamic(
  () =>
    import("@/components/calibracion-anexo1-viewer").then(
      (m) => m.CalibracionAnexo1Viewer
    ),
  { ssr: false, loading: () => <p className="text-muted-foreground">Cargando...</p> }
);

const isDev = process.env.NODE_ENV === "development";

export default function CalibracionAnexo1Page() {
  if (!isDev) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">
          La calibración solo está disponible en modo desarrollo.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }
  return <CalibracionAnexo1Viewer />;
}
