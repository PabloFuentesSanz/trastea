import { describe, expect, it } from "vitest";
import { resumenDeEjercicio } from "./exercise-summary";

const cuerpo = `
<Ficha
  queEs="Un dedo por traste, cuatro trastes seguidos, las seis cuerdas"
  paraQue="Independencia de dedos y púa alterna estricta"
  puas="⊓ ∨ ⊓ ∨ sin excepción"
/>

## El patrón
`;

describe("resumenDeEjercicio", () => {
  it("saca qué es y para qué de la ficha de arriba", () => {
    expect(resumenDeEjercicio(cuerpo)).toEqual({
      queEs: "Un dedo por traste, cuatro trastes seguidos, las seis cuerdas",
      paraQue: "Independencia de dedos y púa alterna estricta",
    });
  });

  it("sin ficha, nada: no se inventa un resumen", () => {
    expect(resumenDeEjercicio("## Solo prosa\n\nHola.")).toEqual({});
  });

  it("una ficha sin esas dos claves tampoco vale", () => {
    expect(resumenDeEjercicio('<Ficha formula="1 - 3 - 5" />')).toEqual({});
  });
});
