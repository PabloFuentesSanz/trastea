import { describe, expect, it } from "vitest";
import { promptFor } from "./prompts";
import type { TrainCard } from "./cards";

const TODAS: TrainCard[] = [
  { type: "fretboard_note", string: 0, fret: 5 },
  { type: "interval_name", from: { string: 5, fret: 5 }, to: { string: 5, fret: 9 } },
  { type: "interval_build", from: { string: 4, fret: 3 }, semitones: 7 },
  { type: "chord_notes", root: "C", chordId: "m7" },
  { type: "ear_interval", semitones: 4 },
  { type: "ear_chord", chordId: "dim7" },
];

describe("promptFor", () => {
  it("toda tarjeta tiene pregunta y respuesta, sin excepciones", () => {
    for (const card of TODAS) {
      const p = promptFor(card);
      expect(p.question.length, card.type).toBeGreaterThan(0);
      expect(p.answerLabel.length, card.type).toBeGreaterThan(0);
    }
  });

  it("nota del mástil: pregunta por la cuerda del guitarrista, no por el índice", () => {
    // índice 0 es la 6ª cuerda
    const p = promptFor({ type: "fretboard_note", string: 0, fret: 5 });
    expect(p.question).toContain("cuerda 6");
    expect(p.question).toContain("traste 5");
    expect(p.answerLabel).toBe("A");
  });

  it("nota del mástil: enseña la enarmonía cuando la hay", () => {
    const p = promptFor({ type: "fretboard_note", string: 0, fret: 6 });
    expect(p.answerLabel).toBe("A# (o Bb)");
  });

  it("nombrar intervalo: responde con el nombre, no con los semitonos", () => {
    const p = promptFor({
      type: "interval_name",
      from: { string: 5, fret: 5 },
      to: { string: 5, fret: 9 },
    });
    expect(p.answerLabel).toBe("3ª mayor");
  });

  it("construir intervalo: dice de qué nota se parte y adónde hay que ir", () => {
    const p = promptFor({
      type: "interval_build",
      from: { string: 4, fret: 3 },
      semitones: 7,
    });
    // 2ª cuerda traste 3 es Re; su quinta justa es La
    expect(p.question).toContain("5ª justa");
    expect(p.question).toContain("D");
    expect(p.answerLabel).toContain("A");
  });

  it("notas del acorde: la respuesta son las notas deletreadas", () => {
    const p = promptFor({ type: "chord_notes", root: "C", chordId: "m7" });
    expect(p.question).toContain("Cm7");
    expect(p.answerLabel).toBe("C · Eb · G · Bb");
  });

  it("intervalo de oído: no se chiva del intervalo en la pregunta", () => {
    const p = promptFor({ type: "ear_interval", semitones: 4 });
    expect(p.question).not.toContain("3ª mayor");
    expect(p.answerLabel).toBe("3ª mayor");
    expect(p.hint).toContain("Saints");
  });

  it("acorde de oído: tampoco se chiva", () => {
    const p = promptFor({ type: "ear_chord", chordId: "m7" });
    expect(p.question.toLowerCase()).not.toContain("menor séptima");
    expect(p.answerLabel).toBe("Menor séptima");
  });
});
