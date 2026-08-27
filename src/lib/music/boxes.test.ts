import { describe, expect, it } from "vitest";
import { scaleBox, boxCount, boxWindow, type ScaleBoxOptions } from "./boxes";
import { getTuning } from "@/data/tunings";
import { getScale } from "@/data/scales";

const STANDARD = getTuning("standard").midi;

/** Trastes por cuerda, de la 6ª a la 1ª, tal y como se dibujan. */
function byString(options: ScaleBoxOptions): number[][] {
  const positions = scaleBox(options);
  return [0, 1, 2, 3, 4, 5].map((string) =>
    positions
      .filter((p) => p.string === string)
      .map((p) => p.fret)
      .sort((a, b) => a - b),
  );
}

function pentatonic(box: number): ScaleBoxOptions {
  return {
    root: "A",
    intervals: getScale("minor-pentatonic").intervals,
    tuningMidi: STANDARD,
    box,
  };
}

/**
 * Las cinco cajas de La menor pentatónica tal y como las estudia todo el
 * mundo. Si el modelo no reproduce EXACTAMENTE esto, está mal: no es una
 * ventana rectangular de trastes, es un patrón de digitación.
 */
describe("las cinco cajas de la pentatónica menor", () => {
  it("caja 1 — la del traste 5", () => {
    expect(byString(pentatonic(1))).toEqual([
      [5, 8],
      [5, 7],
      [5, 7],
      [5, 7],
      [5, 8],
      [5, 8],
    ]);
  });

  it("caja 2 — traste 8, con el estirón de la 5ª cuerda", () => {
    expect(byString(pentatonic(2))).toEqual([
      [8, 10],
      [7, 10],
      [7, 10],
      [7, 9],
      [8, 10],
      [8, 10],
    ]);
  });

  it("caja 3 — traste 10", () => {
    expect(byString(pentatonic(3))).toEqual([
      [10, 12],
      [10, 12],
      [10, 12],
      [9, 12],
      [10, 13],
      [10, 12],
    ]);
  });

  it("caja 4 — traste 12", () => {
    expect(byString(pentatonic(4))).toEqual([
      [12, 15],
      [12, 15],
      [12, 14],
      [12, 14],
      [13, 15],
      [12, 15],
    ]);
  });

  it("caja 5 — traste 15", () => {
    expect(byString(pentatonic(5))).toEqual([
      [15, 17],
      [15, 17],
      [14, 17],
      [14, 17],
      [15, 17],
      [15, 17],
    ]);
  });
});

describe("lo que una ventana rectangular hacía mal", () => {
  it("la caja 2 baja al traste 7, no empieza en el 8", () => {
    // el recorte "desde 8 hasta 10" se comía estas tres notas
    const frets = byString(pentatonic(2));
    expect(frets[1]).toContain(7);
    expect(frets[2]).toContain(7);
    expect(frets[3]).toContain(7);
  });

  it("la caja 3 llega al traste 13 en la 2ª cuerda", () => {
    // el recorte "desde 10 hasta 12" perdía esta nota
    expect(byString(pentatonic(3))[4]).toContain(13);
  });

  it("cada caja tiene dos notas por cuerda, doce en total", () => {
    for (let box = 1; box <= 5; box++) {
      expect(scaleBox(pentatonic(box))).toHaveLength(12);
      for (const frets of byString(pentatonic(box))) expect(frets).toHaveLength(2);
    }
  });

  it("las cajas vecinas comparten notas, pero no se solapan enteras", () => {
    const key = (p: { string: number; fret: number }) => `${p.string}:${p.fret}`;
    const uno = new Set(scaleBox(pentatonic(1)).map(key));
    const dos = new Set(scaleBox(pentatonic(2)).map(key));
    const comunes = [...uno].filter((k) => dos.has(k));
    expect(comunes.length).toBeGreaterThan(0);
    expect(comunes.length).toBeLessThan(uno.size);
  });
});

describe("el invariante que importa", () => {
  it("toda nota de toda caja pertenece a la escala", () => {
    // escribir posiciones a mano metía notas ajenas (un Si en la pentatónica
    // de La, por ejemplo). Deducirlas de la fórmula lo hace imposible.
    const permitidas = new Set(["A", "C", "D", "E", "G"]);
    for (let box = 1; box <= 5; box++) {
      for (const p of scaleBox(pentatonic(box))) {
        expect(permitidas).toContain(p.note);
      }
    }
  });

  it("las notas de una caja suben siempre de altura", () => {
    for (let box = 1; box <= 5; box++) {
      const midis = scaleBox(pentatonic(box)).map((p) => p.midi);
      expect(midis).toEqual([...midis].sort((a, b) => a - b));
    }
  });

  it("las cinco cajas juntas cubren el mástil sin huecos", () => {
    const cubierto = new Set<string>();
    for (let box = 1; box <= 5; box++) {
      for (const p of scaleBox(pentatonic(box))) cubierto.add(`${p.string}:${p.fret}`);
    }
    // entre el traste 5 y el 17 no puede faltar ninguna nota de la escala
    const permitidas = new Set([9, 0, 2, 4, 7]);
    const tuning = STANDARD;
    for (let string = 0; string < 6; string++) {
      for (let fret = 5; fret <= 17; fret++) {
        const pc = (tuning[string] + fret) % 12;
        if (!permitidas.has(pc)) continue;
        expect(cubierto).toContain(`${string}:${fret}`);
      }
    }
  });
});

describe("intervalos y raíces dentro de la caja", () => {
  it("nombra el intervalo de cada nota respecto a la raíz de la escala", () => {
    const caja1 = scaleBox(pentatonic(1));
    const raices = caja1.filter((p) => p.isRoot);
    // en la caja 1 de La hay tres La: 6ª/5, 4ª/7 y 1ª/5
    expect(raices).toHaveLength(3);
    expect(raices.map((p) => `${p.string}:${p.fret}`).sort()).toEqual([
      "0:5",
      "2:7",
      "5:5",
    ]);
  });

  it("deletrea las notas según la tonalidad", () => {
    const caja = scaleBox({
      root: "F",
      intervals: getScale("major").intervals,
      tuningMidi: STANDARD,
      box: 1,
      notesPerString: 3,
    });
    // en Fa mayor se escribe Sib, nunca La#
    expect(caja.map((p) => p.note)).toContain("Bb");
    expect(caja.map((p) => p.note)).not.toContain("A#");
  });
});

describe("escalas de siete notas", () => {
  it("por defecto van a tres notas por cuerda", () => {
    const caja = scaleBox({
      root: "G",
      intervals: getScale("major").intervals,
      tuningMidi: STANDARD,
      box: 1,
    });
    expect(caja).toHaveLength(18);
  });

  it("admite dos notas por cuerda si se pide", () => {
    const caja = scaleBox({
      root: "G",
      intervals: getScale("major").intervals,
      tuningMidi: STANDARD,
      box: 1,
      notesPerString: 2,
    });
    expect(caja).toHaveLength(12);
  });

  it("hay tantas cajas como notas tiene la escala", () => {
    expect(boxCount(getScale("minor-pentatonic").intervals)).toBe(5);
    expect(boxCount(getScale("major").intervals)).toBe(7);
    expect(boxCount(getScale("blues").intervals)).toBe(6);
  });
});

describe("errores de autoría", () => {
  it("una caja que no existe revienta en vez de dibujar otra", () => {
    expect(() => scaleBox(pentatonic(0))).toThrow(/caja/i);
    expect(() => scaleBox(pentatonic(6))).toThrow(/caja/i);
  });
});

describe("escalas que heredan la digitación", () => {
  const bluesBox1 = () =>
    scaleBox({
      root: "A",
      intervals: getScale("blues").intervals,
      tuningMidi: STANDARD,
      box: 1,
      parentIntervals: getScale("minor-pentatonic").intervals,
    });

  it("la caja de blues es la de la pentatónica con la b5 dentro", () => {
    const frets = bluesBox1().reduce<number[][]>(
      (acc, p) => {
        acc[p.string].push(p.fret);
        return acc;
      },
      [[], [], [], [], [], []],
    );
    // la caja 1 de la pentatónica más los dos Mib que caen al alcance:
    // 5ª cuerda traste 6 y 3ª cuerda traste 8. (En la 4ª cuerda el traste 8
    // es un Sib, no un Mib: el texto original de la ficha se equivocaba.)
    expect(frets[1]).toContain(6);
    expect(frets[3]).toContain(8);
    expect(bluesBox1()).toHaveLength(14);
  });

  it("toda nota sigue perteneciendo a la escala de blues", () => {
    const permitidas = new Set(["A", "C", "D", "Eb", "E", "G"]);
    for (const p of bluesBox1()) expect(permitidas).toContain(p.note);
  });

  it("el blues tiene cinco cajas, no seis", () => {
    expect(
      boxCount(getScale("blues").intervals, getScale("minor-pentatonic").intervals),
    ).toBe(5);
  });

  it("las notas de la caja siguen ordenadas por altura", () => {
    const midis = bluesBox1().map((p) => p.midi);
    expect(midis).toEqual([...midis].sort((a, b) => a - b));
  });
});

describe("boxWindow", () => {
  it("enmarca la caja con un traste de aire a cada lado", () => {
    expect(boxWindow(scaleBox(pentatonic(1)))).toEqual({ fromFret: 4, toFret: 9 });
  });

  it("no baja del traste 0", () => {
    const caja = scaleBox({
      root: "E",
      intervals: getScale("minor-pentatonic").intervals,
      tuningMidi: STANDARD,
      box: 1,
    });
    expect(boxWindow(caja).fromFret).toBe(0);
  });

  it("sin posiciones devuelve el mástil entero", () => {
    expect(boxWindow([])).toEqual({ fromFret: 0, toFret: 15 });
  });
});

describe("startFret", () => {
  it("baja la caja de octava sin cambiar su forma", () => {
    const opciones = {
      root: "C" as const,
      intervals: getScale("major").intervals,
      tuningMidi: STANDARD,
      box: 5,
      notesPerString: 3,
    };
    const alto = scaleBox(opciones);
    const bajo = scaleBox({ ...opciones, startFret: 0 });

    expect(bajo).toHaveLength(alto.length);
    // doce trastes justos, nota por nota
    expect(bajo.map((p) => p.fret + 12)).toEqual(alto.map((p) => p.fret));
    expect(bajo.map((p) => p.interval)).toEqual(alto.map((p) => p.interval));
  });
});
