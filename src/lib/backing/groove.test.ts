import { describe, expect, it } from "vitest";
import { parseGrid } from "@/lib/music/grid";
import {
  BACKING_STYLES,
  backingLength,
  backingNotes,
  bassMidi,
  esGolpeAbajo,
  ordenDeRasgueo,
  type BackingStyle,
} from "./groove";
import { mod12, parseNote } from "@/lib/music/notes";

const notas = (spec: string, style: BackingStyle = "recto") =>
  backingNotes(parseGrid(spec), { style });

describe("backingNotes", () => {
  it("da bajo y acompañamiento para un compás", () => {
    const n = notas("C");
    expect(n.some((x) => x.voice === "bajo")).toBe(true);
    expect(n.some((x) => x.voice === "acorde")).toBe(true);
  });

  it("no se sale del compás", () => {
    for (const nota of notas("C")) {
      expect(nota.beat).toBeGreaterThanOrEqual(0);
      expect(nota.beat).toBeLessThan(4);
    }
  });

  it("parte el compás entre los acordes que lleve", () => {
    const n = notas("C G");
    const primeros = n.filter((x) => x.beat < 2);
    const segundos = n.filter((x) => x.beat >= 2);
    expect(primeros.length).toBeGreaterThan(0);
    expect(segundos.length).toBeGreaterThan(0);
  });

  it("con % repite el acorde anterior, no lo salta", () => {
    const n = notas("C | %");
    const c1 = n.filter((x) => x.beat < 4).map((x) => x.midi);
    const c2 = n.filter((x) => x.beat >= 4).map((x) => x.midi);
    expect(c2).toEqual(c1);
    expect(c2.length).toBeGreaterThan(0);
  });

  it("coloca cada compás detrás del anterior", () => {
    const n = notas("C | G | Am");
    expect(Math.max(...n.map((x) => x.beat))).toBeGreaterThanOrEqual(8);
    expect(Math.max(...n.map((x) => x.beat))).toBeLessThan(12);
  });

  it("toca solo notas del acorde", () => {
    const n = notas("Cmaj7");
    // Do mayor séptima: C E G B
    const permitidas = new Set([0, 4, 7, 11]);
    for (const nota of n) {
      expect(permitidas.has(mod12(nota.midi))).toBe(true);
    }
  });

  it("pone el bajo por debajo del acompañamiento", () => {
    const n = notas("C");
    const bajo = Math.max(...n.filter((x) => x.voice === "bajo").map((x) => x.midi));
    const acorde = Math.min(...n.filter((x) => x.voice === "acorde").map((x) => x.midi));
    expect(bajo).toBeLessThan(acorde);
  });

  it("empieza el bajo por la fundamental", () => {
    const n = notas("F");
    const primera = n
      .filter((x) => x.voice === "bajo")
      .sort((a, b) => a.beat - b.beat)[0];
    expect(mod12(primera.midi)).toBe(parseNote("F").pc);
  });

  it("conduce las voces: el acompañamiento no salta una octava entre acordes", () => {
    const n = backingNotes(parseGrid("Cmaj7 | Fmaj7 | Bbmaj7 | Ebmaj7"), {
      style: "swing",
    });
    const centros = [0, 1, 2, 3].map((compas) => {
      const midis = n
        .filter((x) => x.voice === "acorde" && Math.floor(x.beat / 4) === compas)
        .map((x) => x.midi);
      return midis.reduce((a, b) => a + b, 0) / midis.length;
    });
    for (let i = 1; i < centros.length; i++) {
      expect(Math.abs(centros[i] - centros[i - 1])).toBeLessThan(12);
    }
  });

  it("todos los estilos producen algo para la misma rejilla", () => {
    for (const style of BACKING_STYLES) {
      expect(notas("C | Am | F | G", style).length).toBeGreaterThan(0);
    }
  });

  it("el swing retrasa el contratiempo pero no el pulso", () => {
    const recto = notas("C7", "recto");
    const swing = notas("C7", "shuffle");
    const enPulso = (ns: typeof recto) => ns.filter((x) => Number.isInteger(x.beat));
    // los golpes que caen en pulso entero siguen en su sitio
    expect(enPulso(swing).length).toBeGreaterThan(0);
    for (const nota of enPulso(swing)) {
      expect(Number.isInteger(nota.beat)).toBe(true);
    }
    // y el estilo con swing coloca algo fuera de la rejilla recta de medios
    const medios = swing.filter((x) => !Number.isInteger(x.beat));
    expect(medios.some((x) => Math.abs((x.beat % 1) - 0.5) > 0.01)).toBe(true);
    expect(recto.length).toBeGreaterThan(0);
  });

  it("revienta con un cifrado que no existe", () => {
    expect(() => notas("Hmaj9")).toThrow();
  });
});

describe("backingLength", () => {
  it("mide la rejilla en pulsos", () => {
    expect(backingLength(parseGrid("C | G | Am | F"))).toBe(16);
  });
});

describe("bassMidi", () => {
  it("deja el bajo en el registro grave de la guitarra", () => {
    for (const nota of ["C", "F#", "Bb", "E", "A"]) {
      const midi = bassMidi(nota);
      expect(midi).toBeGreaterThanOrEqual(40);
      expect(midi).toBeLessThanOrEqual(52);
      expect(mod12(midi)).toBe(parseNote(nota).pc);
    }
  });
});

describe("el bajo se queda en su registro", () => {
  it("también cuando toca la 5ª, en cualquier tonalidad", () => {
    const raices = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
    for (const raiz of raices) {
      const n = backingNotes(parseGrid(raiz), { style: "swing" });
      const bajos = n.filter((x) => x.voice === "bajo").map((x) => x.midi);
      expect(bajos.length).toBeGreaterThan(1);
      for (const midi of bajos) {
        // de Mi grave al Mi de la 4ª cuerda, con margen de una cuarta abajo
        expect(midi).toBeGreaterThanOrEqual(35);
        expect(midi).toBeLessThanOrEqual(52);
      }
    }
  });
});

describe("rasgueo", () => {
  it("en el pulso la púa va hacia abajo; en la 'y', hacia arriba", () => {
    expect(esGolpeAbajo(0)).toBe(true);
    expect(esGolpeAbajo(2)).toBe(true);
    expect(esGolpeAbajo(1.5)).toBe(false);
    expect(esGolpeAbajo(0.5)).toBe(false);
  });

  it("hacia abajo empieza por la cuerda más grave", () => {
    const orden = ordenDeRasgueo([64, 48, 55], true);
    expect(orden.get(48)).toBe(0);
    expect(orden.get(64)).toBe(2);
  });

  it("hacia arriba, al revés", () => {
    const orden = ordenDeRasgueo([64, 48, 55], false);
    expect(orden.get(64)).toBe(0);
    expect(orden.get(48)).toBe(2);
  });

  it("las notas del acorde salen con su orden de rasgueo", () => {
    const notas = backingNotes(parseGrid("C"), { style: "recto" }).filter(
      (n) => n.voice === "acorde",
    );
    expect(notas.length).toBeGreaterThan(1);
    const indices = notas.map((n) => n.strumIndex);
    expect(indices.every((i) => typeof i === "number")).toBe(true);
    // en un mismo golpe no hay dos cuerdas con el mismo orden
    const delPrimerGolpe = notas.filter((n) => n.beat === notas[0].beat);
    expect(new Set(delPrimerGolpe.map((n) => n.strumIndex)).size).toBe(
      delPrimerGolpe.length,
    );
  });
});
