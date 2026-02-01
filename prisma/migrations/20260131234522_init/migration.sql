-- CreateTable
CREATE TABLE "ConfiguracionPlanta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "razon_social" TEXT NOT NULL DEFAULT 'Planta Demo S.A.C.',
    "ruc" TEXT NOT NULL DEFAULT '20123456789',
    "direccion" TEXT,
    "distrito" TEXT,
    "provincia" TEXT,
    "departamento" TEXT,
    "licencia_resolucion" TEXT,
    "representante_legal" TEXT,
    "dni_representante" TEXT,
    "peso_estandar_saco_kg" REAL NOT NULL DEFAULT 50.00
);

-- CreateTable
CREATE TABLE "MaestroProveedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "razon_social" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "domicilio" TEXT,
    "distrito" TEXT,
    "provincia" TEXT,
    "departamento" TEXT,
    "licencia" TEXT,
    "representante" TEXT,
    "dni_representante" TEXT,
    "fecha_vencimiento" DATETIME,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "MaestroCliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "razon_social" TEXT NOT NULL,
    "ruc" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RecepcionResiduo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha_hora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor_id" INTEGER NOT NULL,
    "especie" TEXT NOT NULL,
    "tipo_producto" TEXT NOT NULL,
    "peso_neto_tm" REAL NOT NULL,
    "placa_vehiculo" TEXT NOT NULL,
    "guia_remision" TEXT NOT NULL,
    "anexo_4" TEXT NOT NULL,
    "turno_id" INTEGER,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RecepcionResiduo_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "MaestroProveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecepcionResiduo_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "ProduccionTurno" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProduccionTurno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turno" TEXT NOT NULL,
    "mp_saldo_inicial" REAL NOT NULL,
    "mp_ingresos" REAL NOT NULL,
    "mp_procesada" REAL NOT NULL,
    "mp_saldo_final" REAL NOT NULL,
    "harina_sacos" INTEGER NOT NULL,
    "harina_tm" REAL NOT NULL,
    "aceite_tm" REAL DEFAULT 0,
    "factor_conversion" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "SalidaProducto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cliente_id" INTEGER NOT NULL,
    "tipo_producto" TEXT NOT NULL DEFAULT 'HARINA',
    "peso_tm" REAL NOT NULL,
    "numero_sacos" INTEGER NOT NULL,
    "guia_remision" TEXT NOT NULL,
    CONSTRAINT "SalidaProducto_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "MaestroCliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockProductoTerminado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "saldo_harina_tm" REAL NOT NULL DEFAULT 0,
    "saldo_aceite_tm" REAL NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MaestroProveedor_ruc_key" ON "MaestroProveedor"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "RecepcionResiduo_proveedor_id_guia_remision_key" ON "RecepcionResiduo"("proveedor_id", "guia_remision");
