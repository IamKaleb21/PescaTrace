# PescaTrace

Sistema de trazabilidad para plantas de harina de pescado en Perú. Gestiona recepción de residuos/descarte, producción de turnos, salidas y generación de documentos oficiales (Anexo 1 Convenio, Anexo 3 Declaración Jurada) según R.D. 067-2015-PRODUCE/DGSF.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| Base de datos | SQLite (Prisma 7 + @prisma/adapter-better-sqlite3) |
| UI | shadcn/ui + Tailwind CSS |
| Formularios | react-hook-form + zod |
| PDF | @react-pdf/renderer |
| Exportación | react-csv |
| Package Manager | pnpm |

## Requisitos

- Node.js 18+
- pnpm

## Instalación

```bash
pnpm install
```

### Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="file:./prisma/dev.db"
```

### Base de datos

```bash
# Aplicar migraciones
pnpm prisma migrate dev

# Ejecutar seed (datos de prueba)
pnpm prisma db seed
```

### Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### Build

```bash
pnpm build
pnpm start
```

## Módulos

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Panel principal |
| `/recepcion` | Registro de recepción de residuos |
| `/produccion` | Gestión de turnos de producción |
| `/proveedores` | Maestro de proveedores |
| `/salidas` | Registro de despachos |
| `/cierre-balance` | Cierre y balance |

### Herramientas (solo desarrollo)

- **Calibración Anexo 1** — Ajuste de coordenadas para el Anexo 1 (Convenio)
- **Calibración Anexo 3** — Ajuste de coordenadas para el Anexo 3 (Declaración Jurada)
- **Exportar SIGERSOL** — En desarrollo (WIP)

## Modelos principales

- **ConfiguracionPlanta** — Datos de la planta (RUC, dirección, representante, etc.)
- **MaestroProveedor** — Proveedores con licencia y fecha de vencimiento
- **MaestroCliente** — Clientes para salidas
- **RecepcionResiduo** — Recepciones con especie, peso, guía de remisión
- **ProduccionTurno** — Turnos de producción con MP y factor de conversión
- **SalidaProducto** — Despachos de harina/aceite
- **StockProductoTerminado** — Saldo de productos terminados

## API

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/api/configuracion` | Datos de la planta |
| GET | `/api/produccion/ultimo` | Último turno (saldo inicial) |
| GET | `/api/proveedores` | Lista de proveedores |
| GET | `/api/clientes` | Lista de clientes |
| GET | `/api/recepcion?fecha=YYYY-MM-DD` | Recepciones del día |
| POST | `/api/recepcion` | Crear recepción |
| POST | `/api/produccion/cerrar` | Cerrar turno y vincular recepciones |
| POST | `/api/salidas` | Registrar despacho |

## Lógica de negocio

- **Guía duplicada:** Constraint único `[proveedor_id, guia_remision]` en RecepcionResiduo.
- **Saldo inicial:** El `mp_saldo_final` del último turno es el `mp_saldo_inicial` del siguiente.
- **Factor:** `HarinaTM = Sacos × 0.050` (saco 50 kg), `Factor = MP_Procesada / HarinaTM`.
- **Stock:** Se actualiza al cerrar turno (incrementa) y al registrar salida (decrementa).

## Licencia

Código abierto bajo [MIT](LICENSE).
