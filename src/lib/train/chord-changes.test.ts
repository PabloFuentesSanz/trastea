import { describe, expect, it } from "vitest";
import {
  PAREJAS,
  cambiosPorMinuto,
  parejaPorId,
  parejasDeNivel,
  siguientePareja,
  valorarCambios,
} from "./chord-changes";

describe("parejas de acordes", () => {
  it("cada pareja tiene un id único y dos acordes distintos", () => {
    const ids = new Set(PAREJAS.map((p) => p.id));
    expect(ids.size).toBe(PAREJAS.length);
    for (const p of PAREJAS) expect(p.acordes[0]).not.toBe(p.acordes[1]);
  });

  it("el nivel 1 son los acordes de la primera semana de Desde cero", () => {
    const nombres = new Set(parejasDeNivel(1).flatMap((p) => p.acordes));
    expect(nombres.has("Em")).toBe(true);
    expect(nombres.has("Am")).toBe(true);
    expect(nombres.has("F")).toBe(false);
  });

  it("se busca por id y devuelve undefined si no existe", () => {
    expect(parejaPorId("em-am")?.acordes).toEqual(["Em", "Am"]);
    expect(parejaPorId("x-y")).toBeUndefined();
  });

  it("la siguiente pareja es la que sigue en el mismo nivel, y al acabar el nivel, la primera del siguiente", () => {
    const nivel1 = parejasDeNivel(1);
    expect(siguientePareja(nivel1[0].id)?.id).toBe(nivel1[1].id);
    expect(siguientePareja(nivel1[nivel1.length - 1].id)?.id).toBe(
      parejasDeNivel(2)[0].id,
    );
  });
});

describe("valorarCambios", () => {
  it("normaliza a cambios por minuto aunque la sesión no dure 60 segundos", () => {
    expect(cambiosPorMinuto(15, 30)).toBe(30);
    expect(cambiosPorMinuto(0, 60)).toBe(0);
    expect(cambiosPorMinuto(10, 0)).toBe(0);
  });

  it("cada tramo tiene su etiqueta y su consejo, y a partir de 30 se puede pasar de pareja", () => {
    expect(valorarCambios(5).listaParaSubir).toBe(false);
    expect(valorarCambios(29).listaParaSubir).toBe(false);
    expect(valorarCambios(30).listaParaSubir).toBe(true);
    expect(valorarCambios(30).etiqueta).not.toBe(valorarCambios(5).etiqueta);
    expect(valorarCambios(70).etiqueta).not.toBe(valorarCambios(30).etiqueta);
  });
});
