import { describe, expect, it } from "vitest";
import { tituloSinDia } from "./lesson-title";

describe("tituloSinDia", () => {
  it("quita el 'día N' del final, que la miga de pan ya dice", () => {
    expect(
      tituloSinDia("Tres notas por cuerda: los tres primeros patrones — día 1"),
    ).toBe("Tres notas por cuerda: los tres primeros patrones");
    expect(tituloSinDia("Evaluación final: doce semanas después — día 5")).toBe(
      "Evaluación final: doce semanas después",
    );
  });

  it("no toca un título que no lo lleva", () => {
    expect(tituloSinDia("El diapasón existe")).toBe("El diapasón existe");
  });

  it("no se come un 'día' que forma parte del título", () => {
    expect(tituloSinDia("El día que entendiste el mástil")).toBe(
      "El día que entendiste el mástil",
    );
    expect(tituloSinDia("Tres días seguidos — día 2")).toBe("Tres días seguidos");
  });
});
