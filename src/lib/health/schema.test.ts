import { describe, expect, it } from "vitest";
import { schemaSummary, TABLAS_USADAS } from "./schema";

describe("schemaSummary", () => {
  it("con todo aplicado, dice que sí", async () => {
    const r = await schemaSummary(async () => null);
    expect(r.ok).toBe(true);
    expect(r.faltan).toEqual([]);
    expect(Object.keys(r.tablas)).toEqual([...TABLAS_USADAS]);
  });

  it("señala la tabla que falta y repite lo que dijo la base de datos", async () => {
    const r = await schemaSummary(async (t) =>
      t === "srs_cards" ? 'relation "public.srs_cards" does not exist' : null,
    );
    expect(r.ok).toBe(false);
    expect(r.faltan).toEqual(["srs_cards"]);
    expect(r.tablas.srs_cards).toContain("does not exist");
    expect(r.tablas.profiles).toBe("ok");
  });

  it("si falla todo, las lista todas en vez de parar en la primera", async () => {
    const r = await schemaSummary(async () => "sin permisos");
    expect(r.faltan).toHaveLength(TABLAS_USADAS.length);
  });

  it("comprueba todas las tablas a las que el código escribe de verdad", () => {
    // si alguien añade una tabla y no la mete aquí, el diagnóstico miente
    expect(TABLAS_USADAS).toContain("srs_cards");
    expect(TABLAS_USADAS).toContain("exercise_records");
    expect(TABLAS_USADAS).toContain("recordings");
  });
});
