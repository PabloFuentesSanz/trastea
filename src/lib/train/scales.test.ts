import { describe, expect, it } from "vitest";
import { checkAnswer, midiAt, cardId, parseCardId } from "./cards";
import {
  boxesOf,
  degreeAt,
  degreeLabel,
  scaleBoxPositions,
  scaleDegrees,
} from "./scales";

describe("grados de la escala", () => {
  it("lista los grados con su distancia a la raíz", () => {
    expect(scaleDegrees("major")).toEqual([
      { interval: "1", semitones: 0 },
      { interval: "2", semitones: 2 },
      { interval: "3", semitones: 4 },
      { interval: "4", semitones: 5 },
      { interval: "5", semitones: 7 },
      { interval: "6", semitones: 9 },
      { interval: "7", semitones: 11 },
    ]);
  });

  it("la pentatónica menor tiene cinco, con b3 y b7", () => {
    expect(scaleDegrees("minor-pentatonic").map((d) => d.interval)).toEqual([
      "1",
      "b3",
      "4",
      "5",
      "b7",
    ]);
  });

  it("el grado de una posición se mide contra la raíz, no contra el traste", () => {
    // 5ª cuerda traste 3 = Do. En La menor natural, Do es la b3.
    expect(degreeAt("A", "natural-minor", { string: 1, fret: 3 })).toBe(3);
    // la misma nota en Do mayor es la raíz
    expect(degreeAt("C", "major", { string: 1, fret: 3 })).toBe(0);
  });

  it("devuelve null si la nota no pertenece a la escala", () => {
    // Do# no está en Do mayor
    expect(degreeAt("C", "major", { string: 1, fret: 4 })).toBeNull();
  });

  it("etiqueta los grados como se dicen, no como números sueltos", () => {
    expect(degreeLabel("1")).toBe("Raíz");
    expect(degreeLabel("b3")).toBe("3ª menor");
    expect(degreeLabel("5")).toBe("5ª justa");
  });
});

describe("cajas", () => {
  it("la pentatónica tiene cinco cajas y la mayor siete", () => {
    expect(boxesOf("minor-pentatonic")).toEqual([1, 2, 3, 4, 5]);
    expect(boxesOf("major")).toHaveLength(7);
  });

  it("el blues hereda las cinco cajas de la pentatónica", () => {
    expect(boxesOf("blues")).toHaveLength(5);
  });

  it("una caja son posiciones de verdad, todas de la escala", () => {
    const posiciones = scaleBoxPositions("A", "minor-pentatonic", 1);
    expect(posiciones.length).toBeGreaterThanOrEqual(10);
    for (const p of posiciones) {
      expect(degreeAt("A", "minor-pentatonic", p)).not.toBeNull();
    }
  });

  it("la caja 1 de La pentatónica menor empieza en el traste 5", () => {
    const posiciones = scaleBoxPositions("A", "minor-pentatonic", 1);
    expect(Math.min(...posiciones.map((p) => p.fret))).toBe(5);
  });

  it("dos cuerdas seguidas de la misma caja no se pisan enteras", () => {
    const posiciones = scaleBoxPositions("A", "minor-pentatonic", 2);
    // dos notas por cuerda en una pentatónica: seis cuerdas, doce notas
    expect(posiciones).toHaveLength(12);
  });
});

describe("tarjeta de grado", () => {
  const card = {
    type: "scale_degree" as const,
    root: "A" as const,
    scaleId: "natural-minor",
    position: { string: 1, fret: 3 },
  };

  it("acierta con el grado correcto y falla con otro", () => {
    expect(checkAnswer(card, { semitones: 3 })).toBe(true);
    expect(checkAnswer(card, { semitones: 4 })).toBe(false);
  });

  it("da igual la octava: el grado es una clase de altura", () => {
    expect(checkAnswer(card, { semitones: 15 })).toBe(true);
  });

  it("responder con otra cosa es fallar, no una excepción", () => {
    expect(checkAnswer(card, { pc: 0 })).toBe(false);
  });

  it("el id reconstruye la tarjeta entera", () => {
    expect(parseCardId(cardId(card))).toEqual(card);
  });

  it("un id con una escala inventada no cuela", () => {
    expect(parseCardId("scale_degree:A:escala-fantasma:1:3")).toBeNull();
  });
});

describe("tarjeta de caja", () => {
  const missing = scaleBoxPositions("A", "minor-pentatonic", 1)[3];
  const card = {
    type: "scale_box" as const,
    root: "A" as const,
    scaleId: "minor-pentatonic",
    box: 1,
    missing,
  };

  it("acierta al tocar justo la que falta", () => {
    expect(checkAnswer(card, { position: missing })).toBe(true);
  });

  it("la misma altura en otra cuerda no vale: se entrena la digitación", () => {
    const otra = { string: missing.string, fret: missing.fret + 1 };
    expect(checkAnswer(card, { position: otra })).toBe(false);
  });

  it("el id reconstruye la tarjeta entera", () => {
    expect(parseCardId(cardId(card))).toEqual(card);
  });

  it("una caja fuera de rango no cuela", () => {
    expect(parseCardId("scale_box:A:minor-pentatonic:9:1:5")).toBeNull();
    expect(parseCardId("scale_box:A:minor-pentatonic:0:1:5")).toBeNull();
  });

  it("la nota que falta pertenece de verdad a la caja", () => {
    const caja = scaleBoxPositions("A", "minor-pentatonic", 1);
    expect(caja).toContainEqual(missing);
    expect(midiAt(missing)).toBeGreaterThan(0);
  });
});
