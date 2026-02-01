-- AlterTable
ALTER TABLE "ConfiguracionPlanta" ADD COLUMN "email_1" TEXT;
ALTER TABLE "ConfiguracionPlanta" ADD COLUMN "email_2" TEXT;
ALTER TABLE "ConfiguracionPlanta" ADD COLUMN "registro_personas_juridicas" TEXT DEFAULT 'SUNARP';

-- AlterTable
ALTER TABLE "MaestroProveedor" ADD COLUMN "email_1" TEXT;
ALTER TABLE "MaestroProveedor" ADD COLUMN "email_2" TEXT;
ALTER TABLE "MaestroProveedor" ADD COLUMN "registro_personas_juridicas" TEXT;
