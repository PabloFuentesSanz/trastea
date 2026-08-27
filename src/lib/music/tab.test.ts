import { describe, expect, it } from "vitest";
import { foreignNotes, foreignPerBar, parseTab, tabDuration } from "./tab";

describe("parseTab", () => {
  it("lee una columna por token, cuerda:traste", () => {
    const bars = parseTab("6:5 6:7 5:5");
    expect(bars).toHaveLength(1);
    expect(bars[0].columns).toHaveLength(3);
    expect(bars[0].columns[0].events).toEqual([{ string: 6, fret: 5 }]);
    expect(bars[0].columns[2].events).toEqual([{ string: 5, fret: 5 }]);
  });

  it("parte en compases con la barra", () => {
    const bars = parseTab("6:5 6:7 | 5:5 5:7");
    expect(bars.map((b) => b.columns.length)).toEqual([2, 2]);
  });

  it("ignora barras sobrantes al principio, al final y repetidas", () => {
    expect(parseTab("| 6:5 || 6:7 |").map((b) => b.columns.length)).toEqual([1, 1]);
  });

  it("apila varias cuerdas en la misma columna con +", () => {
    const [bar] = parseTab("6:3+5:2+4:0");
    expect(bar.columns[0].events).toEqual([
      { string: 6, fret: 3 },
      { string: 5, fret: 2 },
      { string: 4, fret: 0 },
    ]);
  });

  it("admite cuerdas al aire y trastes de dos cifras", () => {
    const [bar] = parseTab("1:0 1:12 1:17");
    expect(bar.columns.map((c) => c.events[0].fret)).toEqual([0, 12, 17]);
  });

  it("lee la nota muerta como x", () => {
    const [bar] = parseTab("6:x");
    expect(bar.columns[0].events[0].fret).toBe("x");
  });

  it("marca el silencio con un guion", () => {
    const [bar] = parseTab("6:5 - 6:7");
    expect(bar.columns[1].events).toEqual([]);
    expect(bar.columns[1].rest).toBe(true);
  });

  it("marca el acento con > al final del token", () => {
    const [bar] = parseTab("6:5> 6:7");
    expect(bar.columns[0].accent).toBe(true);
    expect(bar.columns[1].accent).toBe(false);
  });

  it("marca el palm mute con . al final del token", () => {
    const [bar] = parseTab("6:0. 6:0.>");
    expect(bar.columns[0].palmMute).toBe(true);
    expect(bar.columns[1].palmMute).toBe(true);
    expect(bar.columns[1].accent).toBe(true);
  });

  it("lee ligados y slides como enlace hacia la columna siguiente", () => {
    const [bar] = parseTab("6:5 h 6:7 p 6:5 s 6:9");
    expect(bar.columns.map((c) => c.link)).toEqual(["h", "p", "s", undefined]);
    expect(bar.columns).toHaveLength(4);
  });

  it("marca el bend con b al final del token", () => {
    const [bar] = parseTab("3:7b 3:7");
    expect(bar.columns[0].bend).toBe(true);
    expect(bar.columns[1].bend).toBe(false);
  });

  it("acepta comas y saltos de línea como separadores", () => {
    const bars = parseTab("6:5, 6:7\n| 5:5");
    expect(bars.map((b) => b.columns.length)).toEqual([2, 1]);
  });

  it("recuerda en qué compás empieza cada uno para numerarlos", () => {
    const bars = parseTab("6:5 | 6:7 | 6:8");
    expect(bars.map((b) => b.number)).toEqual([1, 2, 3]);
  });

  describe("errores", () => {
    it("rechaza una tab vacía", () => {
      expect(() => parseTab("   ")).toThrow(/vacía/i);
    });

    it("rechaza una cuerda fuera del rango 1-6", () => {
      expect(() => parseTab("7:5")).toThrow(/cuerda/i);
      expect(() => parseTab("0:5")).toThrow(/cuerda/i);
    });

    it("rechaza un traste fuera del rango 0-24", () => {
      expect(() => parseTab("6:25")).toThrow(/traste/i);
    });

    it("rechaza un token que no entiende", () => {
      expect(() => parseTab("6-5")).toThrow(/6-5/);
    });

    it("rechaza dos notas en la misma cuerda y columna", () => {
      expect(() => parseTab("6:5+6:7")).toThrow(/misma cuerda/i);
    });

    it("rechaza un enlace sin nota antes o después", () => {
      expect(() => parseTab("h 6:5")).toThrow(/ligado/i);
      expect(() => parseTab("6:5 h")).toThrow(/ligado/i);
      expect(() => parseTab("6:5 h | 6:7")).toThrow(/ligado/i);
    });
  });
});

describe("tabDuration", () => {
  it("cuenta las columnas de todos los compases", () => {
    expect(tabDuration(parseTab("6:5 6:7 | 5:5"))).toBe(3);
  });
});

describe("foreignNotes", () => {
  // afinado estándar de la 6ª a la 1ª
  const STANDARD = [40, 45, 50, 55, 59, 64];
  // Sol mayor: G A B C D E F#
  const SOL_MAYOR = [7, 9, 11, 0, 2, 4, 6];

  it("no encuentra nada si toda la tab está en la escala", () => {
    // patrón de 3 notas por cuerda de Sol mayor
    expect(
      foreignNotes(parseTab("6:3 6:5 6:7 5:3 5:5 5:7 4:4 4:5 4:7"), SOL_MAYOR, STANDARD),
    ).toEqual([]);
  });

  it("señala la nota de fuera diciendo dónde está", () => {
    // 4ª cuerda traste 6 es un Sol#, que no está en Sol mayor
    expect(foreignNotes(parseTab("6:3 4:6"), SOL_MAYOR, STANDARD)).toEqual(["4:6"]);
  });

  it("ignora las notas muertas", () => {
    expect(foreignNotes(parseTab("6:x"), SOL_MAYOR, STANDARD)).toEqual([]);
  });
});

describe("foreignPerBar", () => {
  const STANDARD = [40, 45, 50, 55, 59, 64];
  const CM7 = [0, 3, 7, 10]; // C Eb G Bb
  const F7 = [5, 9, 0, 3]; // F A C Eb

  it("acepta un arpegio por compás", () => {
    expect(foreignPerBar(parseTab("5:3 5:6 | 6:1 6:5"), [CM7, F7], STANDARD)).toEqual([]);
  });

  it("dice en qué compás está la nota ajena", () => {
    // 5ª cuerda traste 4 es un Do#: no está en Cm7
    expect(foreignPerBar(parseTab("5:3 5:4 | 6:1"), [CM7, F7], STANDARD)).toEqual([
      "compás 1: 5:4",
    ]);
  });

  it("deja pasar los compases para los que no se declara acorde", () => {
    expect(foreignPerBar(parseTab("5:3 | 5:4"), [CM7], STANDARD)).toEqual([]);
  });
});
