import { describe, expect, it } from "vitest";
import {
  barBeats,
  columnStarts,
  foreignNotes,
  foreignPerBar,
  parseTab,
  tabBeats,
  tabDuration,
} from "./tab";

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

describe("cantidad de bend", () => {
  it("acepta un bend sin decir cuánto", () => {
    const [bar] = parseTab("3:7b");
    expect(bar.columns[0].bend).toBe(true);
    expect(bar.columns[0].bendSemitones).toBeUndefined();
  });

  it("lee los semitonos que sube", () => {
    const [bar] = parseTab("3:7b1 3:7b2");
    expect(bar.columns.map((c) => c.bendSemitones)).toEqual([1, 2]);
  });

  it("combina la cantidad con el acento", () => {
    const [bar] = parseTab("3:7b2>");
    expect(bar.columns[0].bendSemitones).toBe(2);
    expect(bar.columns[0].accent).toBe(true);
  });

  it("no confunde el bend con un traste que acabe en otra cifra", () => {
    const [bar] = parseTab("3:12");
    expect(bar.columns[0].bend).toBe(false);
    expect(bar.columns[0].events[0].fret).toBe(12);
  });
});

describe("figuras mezcladas", () => {
  it("sin figura declarada, cada columna dura lo que diga perBeat", () => {
    const [bar] = parseTab("6:5 6:7 5:5", { perBeat: 2 });
    expect(bar.columns.map((c) => c.beats)).toEqual([0.5, 0.5, 0.5]);
  });

  it("perBeat 4 son semicorcheas", () => {
    const [bar] = parseTab("6:5 6:7", { perBeat: 4 });
    expect(bar.columns.map((c) => c.beats)).toEqual([0.25, 0.25]);
  });

  it("[16] cambia la figura a partir de ahí", () => {
    const [bar] = parseTab("6:5 [16] 6:7 6:8");
    expect(bar.columns.map((c) => c.beats)).toEqual([0.5, 0.25, 0.25]);
  });

  it("la figura no se reinicia al pasar de compás, igual que en papel", () => {
    const bars = parseTab("[16] 6:5 6:7 | 6:8 6:9");
    expect(bars[1].columns.map((c) => c.beats)).toEqual([0.25, 0.25]);
  });

  it("el tresillo son tres columnas en un pulso", () => {
    const [bar] = parseTab("[8t] 6:5 6:7 6:8");
    expect(barBeats(bar)).toBeCloseTo(1, 10);
  });

  it("el puntillo alarga la figura la mitad", () => {
    const [bar] = parseTab("[4.] 6:5 [8] 6:7");
    expect(bar.columns.map((c) => c.beats)).toEqual([1.5, 0.5]);
  });

  it("la redonda y la blanca duran cuatro y dos pulsos", () => {
    const [bar] = parseTab("[1] 6:5 [2] 6:7");
    expect(bar.columns.map((c) => c.beats)).toEqual([4, 2]);
  });

  it("una figura que no existe revienta diciendo cuál", () => {
    expect(() => parseTab("[7] 6:5")).toThrow(/\[7\]/);
    expect(() => parseTab("[negra] 6:5")).toThrow(/\[negra\]/);
  });

  it("una figura sin notas detrás es un despiste, no una tab", () => {
    expect(() => parseTab("6:5 [16]")).toThrow(/sin notas/);
  });

  it("el caso real: un compás de corcheas y otro de semicorcheas miden igual", () => {
    const bars = parseTab(
      "6:0. 6:0. 6:0. 6:0. | [16] 6:0. 6:0. 6:0. 6:0. 6:0. 6:0. 6:0. 6:0.",
    );
    expect(bars.map(barBeats)).toEqual([2, 2]);
  });

  it("el otro caso real: corcheas, tresillos y semicorcheas, dos pulsos cada uno", () => {
    const bars = parseTab(
      "6:x> 6:x 6:x> 6:x | [8t] 6:x> 6:x 6:x 6:x> 6:x 6:x | [16] 6:x> 6:x 6:x 6:x 6:x> 6:x 6:x 6:x",
    );
    expect(bars.map((b) => Math.round(barBeats(b) * 1000) / 1000)).toEqual([2, 2, 2]);
  });

  it("las barras de la plica salen de la figura, no de la duración", () => {
    // el tresillo de corchea dura 1/3, MÁS que una semicorchea, y aun así
    // lleva una barra menos: por la duración no se puede deducir
    const [tresillos] = parseTab("[8t] 6:5 6:7 6:8");
    const [semis] = parseTab("[16] 6:5 6:7");
    expect(tresillos.columns[0].beats).toBeGreaterThan(semis.columns[0].beats);
    expect(tresillos.columns[0].figure.beams).toBe(1);
    expect(semis.columns[0].figure.beams).toBe(2);
    expect(tresillos.columns[0].figure.triplet).toBe(true);
  });

  it("porPulso 3 son tresillos de corchea, no una figura inventada", () => {
    const [bar] = parseTab("6:5 6:7 6:8", { perBeat: 3 });
    expect(bar.columns[0].figure).toEqual({
      beats: 1 / 3,
      beams: 1,
      triplet: true,
      dotted: false,
    });
  });

  it("la negra no lleva barras y la corchea con puntillo lleva una", () => {
    const [bar] = parseTab("[4] 6:5 [8.] 6:7");
    expect(bar.columns.map((c) => c.figure.beams)).toEqual([0, 1]);
    expect(bar.columns[1].figure.dotted).toBe(true);
  });

  it("los ligados siguen atándose a la columna siguiente aunque cambie la figura", () => {
    const [bar] = parseTab("6:5 h [16] 6:7");
    expect(bar.columns[0].link).toBe("h");
    expect(bar.columns[1].beats).toBe(0.25);
  });
});

describe("dónde cae cada columna", () => {
  it("acumula duraciones en vez de contar columnas", () => {
    const bars = parseTab("6:5 6:7 | [16] 6:8 6:9");
    expect(columnStarts(bars)).toEqual([0, 0.5, 1, 1.25]);
  });

  it("tabBeats es lo que dura la tab entera", () => {
    expect(tabBeats(parseTab("6:5 6:7 | [16] 6:8 6:9"))).toBe(1.5);
  });

  it("una tab regular mide lo mismo que antes: columnas entre perBeat", () => {
    const bars = parseTab("6:5 6:6 6:7 6:8 | 5:5 5:6 5:7 5:8", { perBeat: 4 });
    expect(tabBeats(bars)).toBe(2);
  });
});
