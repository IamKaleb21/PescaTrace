import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const clientes = await prisma.maestroCliente.findMany({
      orderBy: { razon_social: "asc" },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("GET /api/clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}
