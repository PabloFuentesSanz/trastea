import { describe, expect, it } from "vitest";
import { mapaDelMastil, nivelDeDominio, resumenDeDominio } from "./mastery";

const tarjeta = (
  id: string,
  extra: Partial<{ reps: number; intervalDays: number; lapses: number }> = {},
) => ({
  cardId: id,
  dueAt: 0,
  reps: extra.reps ?? 3,
  ease: 2.5,
  intervalDays: extra.intervalDays ?? 5,
  lapses: extra.lapses ?? 0,
});

describe("nivelDeDominio", () => {
  it("sin repasos, sin ver", () => {
    expect(nivelDeDominio({ reps: 0, intervalDays: 0, lapses: 0 })).toBe("sin-ver");
  });

  it("lo que vuelve dentro del día está flojo", () => {
    expect(nivelDeDominio({ reps: 2, intervalDays: 0.3, lapses: 0 })).toBe("floja");
  });

  it("lo que se ha caído dos veces también, aunque ahora aguante", () => {
    expect(nivelDeDominio({ reps: 6, intervalDays: 30, lapses: 2 })).toBe("floja");
  });

  it("de un día a tres semanas, en marcha", () => {
    expect(nivelDeDominio({ reps: 3, intervalDays: 5, lapses: 0 })).toBe("en-marcha");
  });

  it("a partir de tres semanas, dominada", () => {
    expect(nivelDeDominio({ reps: 7, intervalDays: 21, lapses: 0 })).toBe("dominada");
  });
});

describe("mapaDelMastil", () => {
  it("solo mira las notas del mástil, no los intervalos ni el oído", () => {
    const mapa = mapaDelMastil([
      tarjeta("fretboard_note:0:5"),
      tarjeta("ear_interval:7"),
      tarjeta("interval_name:0:0:0:7"),
    ]);
    expect(mapa).toHaveLength(1);
    expect(mapa[0].position).toEqual({ string: 0, fret: 5 });
  });

  it("cada posición con su nivel", () => {
    const mapa = mapaDelMastil([
      tarjeta("fretboard_note:0:5", { intervalDays: 40 }),
      tarjeta("fretboard_note:1:3", { intervalDays: 0.2 }),
    ]);
    expect(mapa.map((m) => m.nivel)).toEqual(["dominada", "floja"]);
  });

  it("una tarjeta con id ilegible no rompe el mapa", () => {
    expect(mapaDelMastil([tarjeta("fretboard_note:no:va")])).toEqual([]);
  });
});

describe("resumenDeDominio", () => {
  it("cuenta cuántas hay de cada", () => {
    const mapa = mapaDelMastil([
      tarjeta("fretboard_note:0:5", { intervalDays: 40 }),
      tarjeta("fretboard_note:0:7", { intervalDays: 40 }),
      tarjeta("fretboard_note:1:3", { intervalDays: 0.2 }),
    ]);
    expect(resumenDeDominio(mapa)).toEqual({
      dominadas: 2,
      enMarcha: 0,
      flojas: 1,
      vistas: 3,
    });
  });
});
