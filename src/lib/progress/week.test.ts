import { describe, expect, it } from "vitest";
import { semanaCerrada, resumenSemanal } from "./week";

describe("semanaCerrada", () => {
  it("va de lunes a domingo", () => {
    // 2026-08-28 es viernes
    const s = semanaCerrada("2026-08-28", 0);
    expect(s).toEqual({ desde: "2026-08-24", hasta: "2026-08-30" });
  });

  it("el domingo sigue siendo su propia semana, no la siguiente", () => {
    expect(semanaCerrada("2026-08-30", 0).desde).toBe("2026-08-24");
  });

  it("con desplazamiento se mira la semana pasada", () => {
    expect(semanaCerrada("2026-08-28", 1)).toEqual({
      desde: "2026-08-17",
      hasta: "2026-08-23",
    });
  });
});

const sesion = (
  date: string,
  min: number,
  extra: Partial<{
    notes: string | null;
    mood: number | null;
    lesson_slug: string | null;
  }> = {},
) => ({
  date,
  duration_min: min,
  lesson_slug: extra.lesson_slug ?? "a-w01-d1",
  notes: extra.notes ?? null,
  mood: extra.mood ?? null,
});

const registro = (slug: string, bpm: number, iso: string) => ({
  exercise_slug: slug,
  bpm,
  recorded_at: iso,
});

describe("resumenSemanal", () => {
  const rango = { desde: "2026-08-24", hasta: "2026-08-30" };

  it("suma solo lo que cae dentro de la semana", () => {
    const r = resumenSemanal(
      rango,
      [sesion("2026-08-24", 40), sesion("2026-08-26", 30), sesion("2026-08-23", 60)],
      [],
      [],
    );
    expect(r.minutos).toBe(70);
    expect(r.dias).toBe(2);
    expect(r.sesiones).toBe(2);
  });

  it("cuenta un día una vez aunque haya dos sesiones", () => {
    const r = resumenSemanal(
      rango,
      [sesion("2026-08-24", 20), sesion("2026-08-24", 20)],
      [],
      [],
    );
    expect(r.dias).toBe(1);
    expect(r.sesiones).toBe(2);
  });

  it("dice qué ejercicios subieron y cuánto", () => {
    const r = resumenSemanal(
      rango,
      [],
      [
        registro("cromatico", 90, "2026-08-20T10:00:00Z"),
        registro("cromatico", 100, "2026-08-25T10:00:00Z"),
        registro("3nps", 80, "2026-08-26T10:00:00Z"),
      ],
      [],
    );
    expect(r.subidas).toEqual([
      { slug: "cromatico", desde: 90, hasta: 100, ganancia: 10 },
      { slug: "3nps", desde: 0, hasta: 80, ganancia: 80 },
    ]);
  });

  it("no cuenta como subida quedarse igual o bajar", () => {
    const r = resumenSemanal(
      rango,
      [],
      [
        registro("cromatico", 100, "2026-08-20T10:00:00Z"),
        registro("cromatico", 96, "2026-08-25T10:00:00Z"),
      ],
      [],
    );
    expect(r.subidas).toEqual([]);
  });

  it("recoge las notas del diario, con su fecha", () => {
    const r = resumenSemanal(
      rango,
      [sesion("2026-08-25", 40, { notes: "el cambio a Bb no llega" })],
      [],
      [],
    );
    expect(r.notas).toEqual([{ date: "2026-08-25", texto: "el cambio a Bb no llega" }]);
  });

  it("cuenta las lecciones terminadas en la semana", () => {
    const r = resumenSemanal(
      rango,
      [],
      [],
      [
        { lesson_slug: "a-w01-d1", completed_at: "2026-08-25T12:00:00Z" },
        { lesson_slug: "a-w01-d2", completed_at: "2026-08-31T12:00:00Z" },
      ],
    );
    expect(r.lecciones).toEqual(["a-w01-d1"]);
  });

  it("una semana vacía no miente: todo a cero", () => {
    const r = resumenSemanal(rango, [], [], []);
    expect(r).toMatchObject({ minutos: 0, dias: 0, sesiones: 0, subidas: [], notas: [] });
  });
});
