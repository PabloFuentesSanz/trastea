import { describe, expect, it } from "vitest";
import {
  ANSWER_OPTIONS,
  answerFor,
  buildFretboardDeck,
  cardId,
  guitarStringNumber,
  isCorrect,
  parseCardId,
} from "./deck";

describe("buildFretboardDeck", () => {
  it("por defecto son 6 cuerdas × 13 trastes", () => {
    expect(buildFretboardDeck()).toHaveLength(78);
  });

  it("se puede limitar a unas cuerdas y un traste máximo", () => {
    const deck = buildFretboardDeck({ strings: [0], maxFret: 5 });
    expect(deck).toHaveLength(6);
    expect(deck.every((c) => c.string === 0)).toBe(true);
    expect(Math.max(...deck.map((c) => c.fret))).toBe(5);
  });

  it("no genera tarjetas duplicadas", () => {
    const ids = buildFretboardDeck().map(cardId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("cardId / parseCardId", () => {
  it("ida y vuelta", () => {
    const card = { type: "fretboard_note", string: 2, fret: 7 } as const;
    expect(parseCardId(cardId(card))).toEqual(card);
  });

  it("rechaza ids inválidos", () => {
    expect(parseCardId("otra_cosa:1:2")).toBeNull();
    expect(parseCardId("fretboard_note:x:2")).toBeNull();
  });
});

describe("answerFor", () => {
  it("acierta las cuerdas al aire de la afinación estándar", () => {
    expect(answerFor({ type: "fretboard_note", string: 0, fret: 0 }).sharp).toBe("E");
    expect(answerFor({ type: "fretboard_note", string: 1, fret: 0 }).sharp).toBe("A");
    expect(answerFor({ type: "fretboard_note", string: 5, fret: 0 }).sharp).toBe("E");
  });

  it("el traste 3 de la 6ª es Sol y el 5 de la 5ª es Re", () => {
    expect(answerFor({ type: "fretboard_note", string: 0, fret: 3 }).sharp).toBe("G");
    expect(answerFor({ type: "fretboard_note", string: 1, fret: 5 }).sharp).toBe("D");
  });

  it("el traste 12 repite la cuerda al aire", () => {
    for (let s = 0; s < 6; s++) {
      const open = answerFor({ type: "fretboard_note", string: s, fret: 0 });
      const twelve = answerFor({ type: "fretboard_note", string: s, fret: 12 });
      expect(twelve.pc).toBe(open.pc);
    }
  });

  it("ofrece los dos nombres de una enarmonía", () => {
    const note = answerFor({ type: "fretboard_note", string: 0, fret: 2 });
    expect(note.sharp).toBe("F#");
    expect(note.flat).toBe("Gb");
  });

  it("respeta otras afinaciones", () => {
    const dropD = answerFor({ type: "fretboard_note", string: 0, fret: 0 }, "drop-d");
    expect(dropD.sharp).toBe("D");
  });
});

describe("isCorrect", () => {
  const card = { type: "fretboard_note", string: 0, fret: 1 } as const;

  it("acepta la nota correcta", () => {
    expect(isCorrect(card, 5)).toBe(true); // F
  });

  it("rechaza cualquier otra", () => {
    expect(isCorrect(card, 4)).toBe(false);
  });

  it("es indiferente a la octava del pitch class", () => {
    expect(isCorrect(card, 17)).toBe(true);
  });
});

describe("opciones y numeración", () => {
  it("hay 12 opciones de respuesta empezando en Do", () => {
    expect(ANSWER_OPTIONS).toHaveLength(12);
    expect(ANSWER_OPTIONS[0].label).toBe("C");
  });

  it("el índice 0 es la 6ª cuerda para el guitarrista", () => {
    expect(guitarStringNumber(0)).toBe(6);
    expect(guitarStringNumber(5)).toBe(1);
  });
});
