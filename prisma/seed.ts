import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { subDays } from "date-fns";

const connectionString =
  process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpiar datos existentes (orden por dependencias FK)
  await prisma.salidaProducto.deleteMany({});
  await prisma.recepcionResiduo.deleteMany({});
  await prisma.produccionTurno.deleteMany({});
  await prisma.maestroCliente.deleteMany({});
  await prisma.maestroProveedor.deleteMany({});
  await prisma.configuracionPlanta.deleteMany({});
  await prisma.stockProductoTerminado.deleteMany({});

  // 1. ConfiguracionPlanta
  await prisma.configuracionPlanta.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      razon_social: "Planta Demo S.A.C.",
      ruc: "20123456789",
      direccion: "Av. Industrial 123, Zona Franca",
      distrito: "Chiclayo",
      provincia: "Chiclayo",
      departamento: "Lambayeque",
      licencia_resolucion: "R.D. 067-2015-PRODUCE/DGSF",
      representante_legal: "Juan Pérez García",
      dni_representante: "12345678",
      peso_estandar_saco_kg: 50,
      email_1: "contacto@plantademo.com",
      email_2: "administracion@plantademo.com",
      registro_personas_juridicas: "SUNARP",
    },
    update: {},
  });

  // 2-4. Proveedores
  const proveedorExito = await prisma.maestroProveedor.upsert({
    where: { ruc: "20111111111" },
    create: {
      razon_social: "Pesquera Exito SAC",
      ruc: "20111111111",
      domicilio: "Calle Los Pescadores 100",
      distrito: "Pimentel",
      provincia: "Chiclayo",
      departamento: "Lambayeque",
      licencia: "RS-001-2020",
      representante: "María López Vega",
      dni_representante: "87654321",
      fecha_vencimiento: new Date("2030-01-01"),
      email_1: "ventas@pesqueraexito.com",
      email_2: "admin@pesqueraexito.com",
      registro_personas_juridicas: "SUNARP",
      activo: true,
    },
    update: {},
  });

  await prisma.maestroProveedor.upsert({
    where: { ruc: "20222222222" },
    create: {
      razon_social: "Pesquera Vencida EIRL",
      ruc: "20222222222",
      domicilio: "Av. Costanera 200",
      distrito: "Santa Rosa",
      provincia: "Chiclayo",
      departamento: "Lambayeque",
      licencia: "RS-002-2019",
      representante: "Carlos Vence Ruiz",
      dni_representante: "11223344",
      fecha_vencimiento: new Date("2024-01-01"),
      email_1: "info@pesqueravencida.com",
      registro_personas_juridicas: "SUNARP",
      activo: true,
    },
    update: {},
  });

  const proveedorDuplicada = await prisma.maestroProveedor.upsert({
    where: { ruc: "20333333333" },
    create: {
      razon_social: "Pesquera Duplicada SAC",
      ruc: "20333333333",
      domicilio: "Calle Residuos 50",
      distrito: "Pimentel",
      provincia: "Chiclayo",
      departamento: "Lambayeque",
      licencia: "RS-003-2021",
      representante: "Ana Duplicado Torres",
      dni_representante: "55443322",
      fecha_vencimiento: new Date("2026-12-31"),
      email_1: "operaciones@pesqueraduplicada.com",
      email_2: "gerencia@pesqueraduplicada.com",
      registro_personas_juridicas: "SUNARP",
      activo: true,
    },
    update: {},
  });

  // 5. Clientes
  let clienteNorte = await prisma.maestroCliente.findFirst({
    where: { ruc: "20444444444" },
  });
  if (!clienteNorte) {
    clienteNorte = await prisma.maestroCliente.create({
      data: {
        razon_social: "Acuícola Norte SAC",
        ruc: "20444444444",
      },
    });
  }

  let clienteSur = await prisma.maestroCliente.findFirst({
    where: { ruc: "20555555555" },
  });
  if (!clienteSur) {
    clienteSur = await prisma.maestroCliente.create({
      data: {
        razon_social: "Exportadora Sur EIRL",
        ruc: "20555555555",
      },
    });
  }

  // 6. StockProductoTerminado
  await prisma.stockProductoTerminado.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      saldo_harina_tm: 25.5,
      saldo_aceite_tm: 0,
    },
    update: {},
  });

  // 7. Turno Ayer (Balance Masas) - CERRADO
  const ayer = subDays(new Date(), 1);
  await prisma.produccionTurno.create({
    data: {
      fecha: ayer,
      turno: "DIA",
      estado: "CERRADO",
      mp_saldo_inicial: 45,
      mp_ingresos: 10,
      mp_procesada: 50,
      mp_saldo_final: 50,
      harina_sacos: 800,
      harina_tm: 40,
      aceite_tm: 0,
      factor_conversion: 1.25,
    },
  });

  // 8. Turno HOY ABIERTO (DIA o NOCHE según hora)
  const hoy = new Date();
  const turnoHoy = hoy.getHours() < 18 ? "DIA" : "NOCHE";
  const turnoAbierto = await prisma.produccionTurno.create({
    data: {
      fecha: hoy,
      turno: turnoHoy,
      estado: "ABIERTO",
      mp_saldo_inicial: 50,
      mp_ingresos: 0,
      mp_procesada: 0,
      mp_saldo_final: 50,
      harina_sacos: 0,
      harina_tm: 0,
      aceite_tm: 0,
      factor_conversion: 0,
    },
  });

  // 9. RecepcionResiduo con guía 001 - asignada al turno abierto
  await prisma.recepcionResiduo.create({
    data: {
      fecha_hora: new Date(),
      proveedor_id: proveedorDuplicada.id,
      especie: "Anchoveta",
      tipo_producto: "Residuo",
      peso_neto_tm: 5.2,
      placa_vehiculo: "ABC-123",
      guia_remision: "001",
      anexo_4: "A4-001",
      turno_id: turnoAbierto.id,
      cerrado: false,
    },
  });

  // 10. SalidaProducto (opcional - para Anexo 3)
  await prisma.salidaProducto.create({
    data: {
      fecha: ayer,
      cliente_id: clienteNorte.id,
      tipo_producto: "HARINA",
      peso_tm: 5,
      numero_sacos: 100,
      guia_remision: "GR-001-ayer",
    },
  });

  console.log("Seed completado correctamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
