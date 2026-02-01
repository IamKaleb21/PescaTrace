-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProduccionTurno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turno" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CERRADO',
    "mp_saldo_inicial" REAL NOT NULL,
    "mp_ingresos" REAL NOT NULL,
    "mp_procesada" REAL NOT NULL,
    "mp_saldo_final" REAL NOT NULL,
    "harina_sacos" INTEGER NOT NULL,
    "harina_tm" REAL NOT NULL,
    "aceite_tm" REAL DEFAULT 0,
    "factor_conversion" REAL NOT NULL
);
INSERT INTO "new_ProduccionTurno" ("aceite_tm", "factor_conversion", "fecha", "harina_sacos", "harina_tm", "id", "mp_ingresos", "mp_procesada", "mp_saldo_final", "mp_saldo_inicial", "turno") SELECT "aceite_tm", "factor_conversion", "fecha", "harina_sacos", "harina_tm", "id", "mp_ingresos", "mp_procesada", "mp_saldo_final", "mp_saldo_inicial", "turno" FROM "ProduccionTurno";
DROP TABLE "ProduccionTurno";
ALTER TABLE "new_ProduccionTurno" RENAME TO "ProduccionTurno";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
