import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CARD_TYPES } from "./cards";

/**
 * Los tipos de tarjeta viven escritos en tres sitios: el modelo, el CHECK de
 * la migración y los tipos de Supabase. Nada obliga a que coincidan, y si se
 * separan el fallo aparece en producción al insertar una fila. Aquí se
 * comparan los tres.
 */

const MIGRATIONS = "supabase/migrations";

/** El último CHECK de card_type que aparece en las migraciones, en orden. */
function tiposEnMigraciones(): string[] {
  const ficheros = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let ultimo: string[] = [];
  for (const f of ficheros) {
    const sql = readFileSync(join(MIGRATIONS, f), "utf8");
    for (const m of sql.matchAll(/card_type\s+in\s*\(([^)]*)\)/gi)) {
      ultimo = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    }
  }
  return ultimo;
}

function tiposEnSupabase(): string[] {
  const ts = readFileSync("src/lib/supabase/types.ts", "utf8");
  const bloque = /export type SrsCardType =([\s\S]*?);/.exec(ts);
  if (!bloque) return [];
  return [...bloque[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

describe("tipos de tarjeta", () => {
  it("la migración declara exactamente los del modelo", () => {
    expect([...tiposEnMigraciones()].sort()).toEqual([...CARD_TYPES].sort());
  });

  it("los tipos de Supabase declaran exactamente los del modelo", () => {
    expect([...tiposEnSupabase()].sort()).toEqual([...CARD_TYPES].sort());
  });

  it("de verdad se ha leído algo: si no, este test no vale nada", () => {
    expect(tiposEnMigraciones().length).toBeGreaterThan(0);
    expect(tiposEnSupabase().length).toBeGreaterThan(0);
  });
});
