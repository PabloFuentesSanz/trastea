import { describe, expect, it } from "vitest";
import { TUNINGS, getTuning } from "./tunings";
import { mod12, parseNote, pcToName, type NoteName } from "@/lib/music/notes";

/** Las letras que deletrean la afinación dentro del nombre: "Drop D (DADGBE)". */
function spelling(name: string): NoteName[] | null {
  const dentro = /\(([^)]+)\)/.exec(name)?.[1] ?? name;
  const notas = dentro.match(/[A-G](?:#|b)?/g);
  return notas && notas.length === 6 ? (notas as NoteName[]) : null;
}

describe("las afinaciones", () => {
  it("van de la 6ª a la 1ª y suben", () => {
    for (const [id, t] of Object.entries(TUNINGS)) {
      expect(t.midi, id).toHaveLength(6);
      // la 6ª es la más grave; entre cuerdas puede haber unísono (BDDDDD)
      for (let i = 1; i < t.midi.length; i += 1) {
        expect(t.midi[i], `${id}: cuerda ${6 - i}`).toBeGreaterThanOrEqual(t.midi[i - 1]);
      }
    }
  });

  it("caen en alturas de guitarra", () => {
    for (const [id, t] of Object.entries(TUNINGS)) {
      // de un Si grave de 7 cuerdas (34) a un Mi agudo (64)
      expect(Math.min(...t.midi), id).toBeGreaterThanOrEqual(34);
      expect(Math.max(...t.midi), id).toBeLessThanOrEqual(64);
    }
  });

  it("el nombre deletrea de verdad las cuerdas que declara", () => {
    // "Drop D (DADGBE)" tiene que sonar D-A-D-G-B-E. Sin esto, un MIDI mal
    // tecleado da una afinación con nombre correcto y notas equivocadas, y el
    // afinador manda al usuario a otra nota.
    let comprobadas = 0;
    for (const [id, t] of Object.entries(TUNINGS)) {
      const letras = spelling(t.name);
      if (!letras) continue;
      comprobadas += 1;
      const suena = t.midi.map((m) => pcToName(mod12(m), /b/.test(t.name)));
      const esperado = letras.map((n) => pcToName(parseNote(n).pc, /b/.test(t.name)));
      expect(suena, `${id} (${t.name})`).toEqual(esperado);
    }
    expect(comprobadas).toBe(Object.keys(TUNINGS).length);
  });

  it("el id coincide con su clave en la tabla", () => {
    for (const [clave, t] of Object.entries(TUNINGS)) expect(t.id).toBe(clave);
  });

  it("getTuning revienta con una que no existe, en vez de devolver la estándar", () => {
    expect(() => getTuning("no-existe")).toThrow(/no-existe/);
  });
});
