import { describe, expect, it } from "vitest";
import { impulseResponse, panPorAltura, variacionDeAtaque } from "./room";

describe("impulseResponse", () => {
  const sr = 48000;
  const ir = impulseResponse(sr, 1.2, 3, 7);

  it("da dos canales del largo pedido", () => {
    expect(ir).toHaveLength(2);
    expect(ir[0].length).toBe(Math.round(sr * 1.2));
    expect(ir[1].length).toBe(ir[0].length);
  });

  it("se apaga: el final pesa mucho menos que el principio", () => {
    const energia = (c: Float32Array, desde: number, hasta: number) => {
      let s = 0;
      for (let i = desde; i < hasta; i++) s += c[i] * c[i];
      return s / (hasta - desde);
    };
    const principio = energia(ir[0], 0, sr * 0.1);
    const final = energia(ir[0], ir[0].length - sr * 0.1, ir[0].length);
    expect(final).toBeLessThan(principio / 100);
  });

  it("los dos canales no son el mismo ruido: de ahí sale el ancho", () => {
    // a partir del predelay, donde ya hay sala
    let iguales = 0;
    const desde = Math.round(sr * 0.02);
    for (let i = desde; i < desde + 1000; i++) if (ir[0][i] === ir[1][i]) iguales += 1;
    expect(iguales).toBeLessThan(50);
  });

  it("empieza en silencio: el sonido directo llega antes que la sala", () => {
    expect(Math.abs(ir[0][0])).toBeLessThan(1e-6);
    expect(Math.abs(ir[0][Math.round(sr * 0.004)])).toBeLessThan(1e-6);
  });

  it("con la misma semilla sale la misma sala", () => {
    expect([...impulseResponse(sr, 0.2, 3, 42)[0].slice(0, 20)]).toEqual([
      ...impulseResponse(sr, 0.2, 3, 42)[0].slice(0, 20),
    ]);
  });
});

describe("panPorAltura", () => {
  it("las graves al centro, las agudas se abren", () => {
    expect(Math.abs(panPorAltura(40))).toBeLessThan(0.1);
    expect(panPorAltura(88)).toBeGreaterThan(0.15);
  });

  it("nunca se va del todo a un lado", () => {
    for (const midi of [20, 40, 60, 80, 110]) {
      expect(Math.abs(panPorAltura(midi))).toBeLessThanOrEqual(0.35);
    }
  });
});

describe("variacionDeAtaque", () => {
  it("dos pulsaciones no salen idénticas", () => {
    const a = variacionDeAtaque(() => 0.1);
    const b = variacionDeAtaque(() => 0.9);
    expect(a.cents).not.toBe(b.cents);
    expect(a.ganancia).not.toBe(b.ganancia);
  });

  it("la desafinación es de guitarrista, no de principiante", () => {
    for (const r of [0, 0.25, 0.5, 0.75, 1]) {
      expect(Math.abs(variacionDeAtaque(() => r).cents)).toBeLessThanOrEqual(7);
    }
  });

  it("el volumen se mueve poco: es color, no un bajón", () => {
    for (const r of [0, 0.5, 1]) {
      const g = variacionDeAtaque(() => r).ganancia;
      expect(g).toBeGreaterThan(0.88);
      expect(g).toBeLessThan(1.12);
    }
  });
});
