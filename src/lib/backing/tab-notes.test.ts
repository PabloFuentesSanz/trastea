import { describe, expect, it } from "vitest";
import { parseTab } from "@/lib/music/tab";
import { tabLength, tabNotes } from "./tab-notes";

const notas = (spec: string, perBeat = 2, swing = false) =>
  tabNotes(parseTab(spec), { perBeat, swing });

describe("tabNotes", () => {
  it("reparte una columna por figura", () => {
    // cuatro corcheas ocupan dos pulsos: 0, 0.5, 1, 1.5
    expect(notas("6:5 6:6 6:7 6:8").map((n) => n.beat)).toEqual([0, 0.5, 1, 1.5]);
  });

  it("cambia el reparto con las columnas por pulso", () => {
    expect(notas("6:5 6:6 6:7", 3).map((n) => n.beat)).toEqual([0, 1 / 3, 2 / 3]);
    expect(notas("6:5 6:6", 1).map((n) => n.beat)).toEqual([0, 1]);
  });

  it("cuenta los compases seguidos, no reinicia en cada uno", () => {
    const n = notas("6:5 6:6 6:7 6:8 | 5:5");
    expect(n[n.length - 1].beat).toBe(2);
  });

  it("convierte cuerda y traste en la altura que suena", () => {
    // 6ª al aire es Mi (40) y 1ª cuerda traste 3 es Sol (67)
    expect(notas("6:0").map((n) => n.midi)).toEqual([40]);
    expect(notas("1:3").map((n) => n.midi)).toEqual([67]);
  });

  it("el silencio no suena pero ocupa su sitio", () => {
    const n = notas("6:5 - 6:7");
    expect(n).toHaveLength(2);
    expect(n[1].beat).toBe(1);
  });

  it("una columna con varias cuerdas suena a la vez", () => {
    const n = notas("6:3+5:2+4:0");
    expect(n).toHaveLength(3);
    expect(new Set(n.map((x) => x.beat)).size).toBe(1);
  });

  it("el acento suena más fuerte", () => {
    const [acentuada, normal] = notas("6:5> 6:5");
    expect(acentuada.velocity).toBeGreaterThan(normal.velocity);
  });

  it("el palm mute acorta la nota", () => {
    const [muteada] = notas("6:0.");
    const [abierta] = notas("6:0");
    expect(muteada.duration).toBeLessThan(abierta.duration);
  });

  it("el bend sube la altura lo que diga", () => {
    const [sinBend] = notas("3:7");
    const [medioTono] = notas("3:7b1");
    const [unTono] = notas("3:7b2");
    expect(medioTono.midi).toBe(sinBend.midi + 1);
    expect(unTono.midi).toBe(sinBend.midi + 2);
  });

  it("la nota muerta es percusión, no altura", () => {
    const [muerta] = notas("6:x");
    expect(muerta.voice).toBe("muerta");
  });

  it("con swing, el contratiempo se retrasa y el pulso no", () => {
    const recto = notas("6:5 6:6 6:7 6:8", 2, false).map((n) => n.beat);
    const conSwing = notas("6:5 6:6 6:7 6:8", 2, true).map((n) => n.beat);
    expect(conSwing[0]).toBe(recto[0]);
    expect(conSwing[2]).toBe(recto[2]);
    expect(conSwing[1]).toBeGreaterThan(recto[1]);
    expect(conSwing[3]).toBeGreaterThan(recto[3]);
  });

  it("no aplica swing a las semicorcheas", () => {
    const recto = notas("6:5 6:6 6:7 6:8", 4, false).map((n) => n.beat);
    const conSwing = notas("6:5 6:6 6:7 6:8", 4, true).map((n) => n.beat);
    expect(conSwing).toEqual(recto);
  });
});

describe("tabLength", () => {
  it("mide la tab en pulsos, redondeando al compás", () => {
    // ocho corcheas son cuatro pulsos
    expect(tabLength(parseTab("6:5 6:5 6:5 6:5 6:5 6:5 6:5 6:5"), { perBeat: 2 })).toBe(
      4,
    );
  });

  it("no deja una vuelta más corta que lo que suena", () => {
    const bars = parseTab("6:5 6:6 6:7");
    expect(tabLength(bars, { perBeat: 2 })).toBeGreaterThanOrEqual(1.5);
  });
});

describe("la nota dura hasta la siguiente", () => {
  it("una nota seguida de silencios suena todo ese hueco", () => {
    // en la notación, "X - - -" es una redonda, no una negra y tres silencios
    const [redonda] = tabNotes(parseTab("6:5 - - -"), { perBeat: 1 });
    const [negra] = tabNotes(parseTab("6:5 6:5"), { perBeat: 1 });
    expect(redonda.duration).toBeCloseTo(negra.duration * 4);
  });

  it("la última nota también se estira hasta el final", () => {
    const [, ultima] = tabNotes(parseTab("6:5 6:7 - -"), { perBeat: 1 });
    expect(ultima.duration).toBeGreaterThan(1);
  });

  it("el palm mute sigue cortando aunque haya hueco detrás", () => {
    const [muteada] = tabNotes(parseTab("6:0. - - -"), { perBeat: 1 });
    const [abierta] = tabNotes(parseTab("6:0 - - -"), { perBeat: 1 });
    expect(muteada.duration).toBeLessThan(abierta.duration);
  });
});
