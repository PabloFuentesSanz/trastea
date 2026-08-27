import { describe, expect, it } from "vitest";
import {
  CARD_TYPES,
  cardId,
  checkAnswer,
  intervalBetweenPositions,
  parseCardId,
  positionsForPitch,
  type TrainCard,
} from "./cards";

const EJEMPLOS: TrainCard[] = [
  { type: "fretboard_note", string: 0, fret: 5 },
  { type: "interval_name", from: { string: 5, fret: 5 }, to: { string: 5, fret: 9 } },
  { type: "interval_build", from: { string: 4, fret: 3 }, semitones: 7 },
  { type: "chord_notes", root: "C", chordId: "m7" },
  { type: "ear_interval", semitones: 4 },
  { type: "ear_chord", chordId: "dim7" },
];

describe("identidad de las tarjetas", () => {
  it("cada tarjeta va y vuelve de su id sin perder nada", () => {
    for (const card of EJEMPLOS) {
      expect(parseCardId(cardId(card)), cardId(card)).toEqual(card);
    }
  });

  it("dos tarjetas distintas nunca comparten id", () => {
    const ids = EJEMPLOS.map(cardId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("el id empieza por el tipo, que es lo que guarda la base de datos", () => {
    for (const card of EJEMPLOS) {
      expect(cardId(card).startsWith(`${card.type}:`)).toBe(true);
    }
  });

  it("hay un ejemplo por cada tipo declarado", () => {
    expect(new Set(EJEMPLOS.map((c) => c.type))).toEqual(new Set(CARD_TYPES));
  });

  it("rechaza lo que no entiende en vez de inventarse una tarjeta", () => {
    expect(parseCardId("")).toBeNull();
    expect(parseCardId("marciano:1:2")).toBeNull();
    expect(parseCardId("fretboard_note:x:2")).toBeNull();
    expect(parseCardId("fretboard_note:0")).toBeNull();
    expect(parseCardId("chord_notes:H:m7")).toBeNull();
    expect(parseCardId("chord_notes:C:noexiste")).toBeNull();
    expect(parseCardId("ear_interval:99")).toBeNull();
  });
});

describe("intervalBetweenPositions", () => {
  it("cuenta semitonos en la misma cuerda", () => {
    expect(intervalBetweenPositions({ string: 5, fret: 5 }, { string: 5, fret: 9 })).toBe(
      4,
    );
  });

  it("cruza cuerdas bien: 6ª al aire a 5ª al aire son cinco semitonos", () => {
    expect(intervalBetweenPositions({ string: 0, fret: 0 }, { string: 1, fret: 0 })).toBe(
      5,
    );
  });

  it("la tercera menor del sol a la si es de cuatro, no de tres", () => {
    // 3ª cuerda al aire (G) → 2ª cuerda al aire (B): tercera mayor
    expect(intervalBetweenPositions({ string: 3, fret: 0 }, { string: 4, fret: 0 })).toBe(
      4,
    );
  });

  it("es negativo si la segunda nota está por debajo", () => {
    expect(intervalBetweenPositions({ string: 5, fret: 9 }, { string: 5, fret: 5 })).toBe(
      -4,
    );
  });
});

describe("positionsForPitch", () => {
  it("encuentra todas las formas de tocar la misma altura", () => {
    // el Mi de la 1ª al aire está también en 2ª/5, 3ª/9, 4ª/14…
    const posiciones = positionsForPitch(64, { maxFret: 12 });
    expect(posiciones).toContainEqual({ string: 5, fret: 0 });
    expect(posiciones).toContainEqual({ string: 4, fret: 5 });
    expect(posiciones).toContainEqual({ string: 3, fret: 9 });
    expect(posiciones.length).toBeGreaterThan(2);
  });

  it("no se sale del traste máximo", () => {
    for (const p of positionsForPitch(64, { maxFret: 5 })) {
      expect(p.fret).toBeLessThanOrEqual(5);
    }
  });

  it("una altura imposible no devuelve nada", () => {
    expect(positionsForPitch(20, { maxFret: 12 })).toEqual([]);
  });
});

describe("checkAnswer", () => {
  it("nota del mástil: acepta la enarmonía", () => {
    const card: TrainCard = { type: "fretboard_note", string: 0, fret: 6 };
    // 6ª cuerda traste 6 es Sib / La#
    expect(checkAnswer(card, { pc: 10 })).toBe(true);
    expect(checkAnswer(card, { pc: 9 })).toBe(false);
  });

  it("nombre del intervalo: se responde con semitonos", () => {
    const card: TrainCard = {
      type: "interval_name",
      from: { string: 5, fret: 5 },
      to: { string: 5, fret: 9 },
    };
    expect(checkAnswer(card, { semitones: 4 })).toBe(true);
    expect(checkAnswer(card, { semitones: 3 })).toBe(false);
  });

  it("construir un intervalo: vale cualquier posición con esa altura", () => {
    // 4ª cuerda traste 3 es Fa (MIDI 53); su quinta justa es Do (60)
    const card: TrainCard = {
      type: "interval_build",
      from: { string: 4, fret: 3 },
      semitones: 7,
    };
    expect(checkAnswer(card, { position: { string: 4, fret: 10 } })).toBe(true);
    expect(checkAnswer(card, { position: { string: 5, fret: 5 } })).toBe(true);
    // la octava equivocada no cuenta: se pide una altura, no una nota
    expect(checkAnswer(card, { position: { string: 1, fret: 3 } })).toBe(false);
  });

  it("notas del acorde: el conjunto entero, en cualquier orden", () => {
    const card: TrainCard = { type: "chord_notes", root: "C", chordId: "m7" };
    // Cm7 = C Eb G Bb → 0, 3, 7, 10
    expect(checkAnswer(card, { pcs: [10, 0, 7, 3] })).toBe(true);
    expect(checkAnswer(card, { pcs: [0, 3, 7] })).toBe(false);
    expect(checkAnswer(card, { pcs: [0, 4, 7, 10] })).toBe(false);
  });

  it("notas del acorde: repetir una nota no cuela como acierto", () => {
    const card: TrainCard = { type: "chord_notes", root: "C", chordId: "major" };
    expect(checkAnswer(card, { pcs: [0, 0, 4, 7] })).toBe(true);
    expect(checkAnswer(card, { pcs: [0, 4] })).toBe(false);
  });

  it("intervalo de oído: se responde con semitonos", () => {
    const card: TrainCard = { type: "ear_interval", semitones: 7 };
    expect(checkAnswer(card, { semitones: 7 })).toBe(true);
    expect(checkAnswer(card, { semitones: 5 })).toBe(false);
  });

  it("acorde de oído: se responde con el tipo", () => {
    const card: TrainCard = { type: "ear_chord", chordId: "m7" };
    expect(checkAnswer(card, { chordId: "m7" })).toBe(true);
    expect(checkAnswer(card, { chordId: "7" })).toBe(false);
  });

  it("una respuesta que no encaja con el tipo de tarjeta es un fallo, no un error", () => {
    const card: TrainCard = { type: "ear_interval", semitones: 7 };
    expect(checkAnswer(card, { pc: 7 })).toBe(false);
  });
});
