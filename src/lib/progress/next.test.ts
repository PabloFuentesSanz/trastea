import { describe, expect, it } from "vitest";
import { queTocaAhora, type Situacion } from "./next";

const base: Situacion = {
  siguienteLeccion: {
    slug: "a-cimientos-w03-d2",
    titulo: "Dos posiciones",
    href: "/hoy",
  },
  repasosVencidos: 0,
  metas: [],
  moduloParaEvaluar: null,
  diasSinPracticar: 0,
};

describe("queTocaAhora", () => {
  it("lo primero es siempre la sesión de hoy", () => {
    const [primera] = queTocaAhora(base);
    expect(primera.tipo).toBe("leccion");
    expect(primera.href).toBe("/hoy");
  });

  it("los repasos vencidos entran, con su número", () => {
    const acciones = queTocaAhora({ ...base, repasosVencidos: 14 });
    const repaso = acciones.find((a) => a.tipo === "repaso");
    expect(repaso?.texto).toContain("14");
  });

  it("sin repasos vencidos no se inventa la tarjeta", () => {
    expect(queTocaAhora(base).some((a) => a.tipo === "repaso")).toBe(false);
  });

  it("propone la meta que está a punto de caer", () => {
    const acciones = queTocaAhora({
      ...base,
      metas: [
        {
          slug: "cromatico-1234",
          titulo: "Cromático",
          objetivo: 110,
          mejor: 106,
          faltan: 4,
          estado: "cerca",
        },
      ],
    });
    const meta = acciones.find((a) => a.tipo === "meta");
    expect(meta?.texto).toContain("4 bpm");
    expect(meta?.href).toBe("/ejercicios/cromatico-1234");
  });

  it("y rescata la que lleva semanas parada", () => {
    const acciones = queTocaAhora({
      ...base,
      metas: [
        {
          slug: "3nps-7-patrones",
          titulo: "3nps",
          objetivo: 100,
          mejor: 80,
          faltan: 20,
          diasSinTocar: 40,
          estado: "parada",
        },
      ],
    });
    expect(acciones.find((a) => a.tipo === "rescate")?.texto).toContain("40 días");
  });

  it("si un módulo está terminado, toca su evaluación", () => {
    const acciones = queTocaAhora({
      ...base,
      moduloParaEvaluar: { slug: "a-cimientos", titulo: "Módulo A" },
    });
    const eval_ = acciones.find((a) => a.tipo === "evaluacion");
    expect(eval_?.href).toBe("/curso/a-cimientos/evaluacion");
  });

  it("no propone más de cuatro cosas: una lista larga no es un plan", () => {
    const acciones = queTocaAhora({
      ...base,
      repasosVencidos: 5,
      moduloParaEvaluar: { slug: "a-cimientos", titulo: "Módulo A" },
      metas: [
        { slug: "a", titulo: "A", objetivo: 100, mejor: 96, faltan: 4, estado: "cerca" },
        {
          slug: "b",
          titulo: "B",
          objetivo: 100,
          mejor: 60,
          faltan: 40,
          diasSinTocar: 30,
          estado: "parada",
        },
      ],
    });
    expect(acciones.length).toBeLessThanOrEqual(4);
  });
});
