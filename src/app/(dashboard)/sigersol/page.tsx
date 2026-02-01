import { Badge } from "@/components/ui/badge";

export default function SigersolPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        Gestión Ambiental (SIGERSOL)
        <Badge variant="secondary">Próximamente</Badge>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Este módulo estará disponible próximamente.
      </p>
    </div>
  );
}
