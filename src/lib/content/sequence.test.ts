import { describe, expect, it } from "vitest";
import { ordenarSemanas, type SemanaFuente } from "./sequence";

const tronco = (modulo: string, orden: number, semanas: number[]): SemanaFuente[] =>
  semanas.map((s) => ({
    slug: `${modulo}-w${String(s).padStart(2, "0")}`,
    order: s,
    moduleSlug: modulo,
    moduleOrder: orden,
  }));

describe("ordenarSemanas", () => {
  it("sin semanas de estilo, es módulo → semana", () => {
    const fuente = [...tronco("b", 2, [5, 6]), ...tronco("a", 1, [1, 2])];
    expect(ordenarSemanas(fuente).map((s) => s.slug)).toEqual([
      "a-w01",
      "a-w02",
      "b-w05",
      "b-w06",
    ]);
  });

  it("una semana con `after` se cuela justo detrás de la que nombra", () => {
    const fuente: SemanaFuente[] = [
      ...tronco("a", 1, [1, 2, 3]),
      {
        slug: "estilos-blues",
        order: 1,
        moduleSlug: "estilos",
        moduleOrder: 9,
        after: "a-w01",
      },
    ];
    expect(ordenarSemanas(fuente).map((s) => s.slug)).toEqual([
      "a-w01",
      "estilos-blues",
      "a-w02",
      "a-w03",
    ]);
  });

  it("dos semanas detrás de la misma van por su `order`", () => {
    const fuente: SemanaFuente[] = [
      ...tronco("a", 1, [1, 2]),
      {
        slug: "estilos-rock",
        order: 2,
        moduleSlug: "estilos",
        moduleOrder: 9,
        after: "a-w02",
      },
      {
        slug: "estilos-blues",
        order: 1,
        moduleSlug: "estilos",
        moduleOrder: 9,
        after: "a-w02",
      },
    ];
    expect(ordenarSemanas(fuente).map((s) => s.slug)).toEqual([
      "a-w01",
      "a-w02",
      "estilos-blues",
      "estilos-rock",
    ]);
  });

  it("la semana de estilo hereda el número de semana de su ancla para el nivel", () => {
    const fuente: SemanaFuente[] = [
      ...tronco("a", 1, [1, 2]),
      {
        slug: "estilos-blues",
        order: 1,
        moduleSlug: "estilos",
        moduleOrder: 9,
        after: "a-w02",
      },
    ];
    const blues = ordenarSemanas(fuente).find((s) => s.slug === "estilos-blues");
    expect(blues?.semanaDeNivel).toBe(2);
    expect(blues?.posicion).toBe(3);
  });

  it("un módulo puede fijar la semana de nivel de todas sus semanas", () => {
    const fuente: SemanaFuente[] = [
      {
        slug: "cero-w03",
        order: 3,
        moduleSlug: "cero",
        moduleOrder: 1,
        semanaDeNivel: 1,
      },
      {
        slug: "estilos-folk",
        order: 1,
        moduleSlug: "estilos",
        moduleOrder: 9,
        after: "cero-w03",
      },
    ];
    expect(ordenarSemanas(fuente).map((s) => s.semanaDeNivel)).toEqual([1, 1]);
  });

  it("un `after` que no existe deja la semana fuera de la secuencia y lo dice", () => {
    const fuente: SemanaFuente[] = [
      ...tronco("a", 1, [1]),
      {
        slug: "estilos-jazz",
        order: 1,
        moduleSlug: "estilos",
        moduleOrder: 9,
        after: "b-w99",
      },
    ];
    const secuencia = ordenarSemanas(fuente);
    expect(secuencia.map((s) => s.slug)).toEqual(["a-w01"]);
    expect(secuencia.huerfanas).toEqual(["estilos-jazz"]);
  });

  it("una semana de estilo no puede ser ancla de otra: se cuelga de la del tronco", () => {
    const fuente: SemanaFuente[] = [
      ...tronco("a", 1, [1, 2]),
      {
        slug: "estilos-blues",
        order: 1,
        moduleSlug: "estilos",
        moduleOrder: 9,
        after: "a-w01",
      },
      {
        slug: "estilos-rock",
        order: 2,
        moduleSlug: "estilos",
        moduleOrder: 9,
        after: "estilos-blues",
      },
    ];
    const secuencia = ordenarSemanas(fuente);
    expect(secuencia.map((s) => s.slug)).toEqual(["a-w01", "estilos-blues", "a-w02"]);
    expect(secuencia.huerfanas).toEqual(["estilos-rock"]);
  });
});
