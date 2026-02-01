import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const proveedores = await prisma.maestroProveedor.findMany({
      orderBy: { razon_social: "asc" },
    });
    return NextResponse.json(proveedores);
  } catch (error) {
    console.error("GET /api/proveedores:", error);
    return NextResponse.json(
      { error: "Error al obtener proveedores" },
      { status: 500 }
    );
  }
}
