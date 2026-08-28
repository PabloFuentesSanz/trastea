import { describe, expect, it } from "vitest";
import { metasDeBpm, recortarMetas, resumenDeMetas } from "./goals";

const EJERCICIOS = [
  { slug: "cromatico-1234", titulo: "Cromático 1-2-3-4", objetivo: 110 },
  { slug: "3nps-7-patrones", titulo: "3nps, 7 patrones", objetivo: 100 },
  { slug: "cantar-grados", titulo: "Cantar grados", objetivo: undefined },
];

const HOY = Date.parse("2026-08-28T10:00:00Z");
const dias = (n: number) => new Date(HOY - n * 86_400_000).toISOString();

describe("metasDeBpm", () => {
  it("se queda con el mejor bpm de cada ejercicio, no con el último", () => {
    const metas = metasDeBpm(
      EJERCICIOS,
      [
        { exercise_slug: "cromatico-1234", bpm: 104, recorded_at: dias(10) },
        { exercise_slug: "cromatico-1234", bpm: 96, recorded_at: dias(1) },
      ],
      HOY,
    );
    expect(metas[0].mejor).toBe(104);
    expect(metas[0].ultimo).toBe(96);
  });

  it("dice cuánto falta, y cuándo está conseguida", () => {
    const [cerca, hecha] = metasDeBpm(
      EJERCICIOS,
      [
        { exercise_slug: "cromatico-1234", bpm: 104, recorded_at: dias(2) },
        { exercise_slug: "3nps-7-patrones", bpm: 100, recorded_at: dias(2) },
      ],
      HOY,
    );
    expect(cerca.faltan).toBe(6);
    expect(cerca.estado).toBe("cerca");
    expect(hecha.faltan).toBe(0);
    expect(hecha.estado).toBe("conseguida");
  });

  it("un ejercicio sin registros queda pendiente, no a cero", () => {
    const metas = metasDeBpm(EJERCICIOS, [], HOY);
    expect(metas[0].estado).toBe("sin-empezar");
    expect(metas[0].mejor).toBeUndefined();
  });

  it("marca como parada la meta sin tocar en tres semanas", () => {
    const [meta] = metasDeBpm(
      EJERCICIOS,
      [{ exercise_slug: "cromatico-1234", bpm: 90, recorded_at: dias(30) }],
      HOY,
    );
    expect(meta.estado).toBe("parada");
    expect(meta.diasSinTocar).toBe(30);
  });

  it("solo cuenta los ejercicios que tienen objetivo", () => {
    expect(metasDeBpm(EJERCICIOS, [], HOY)).toHaveLength(2);
  });

  it("ordena por lo que está a punto de caer, y deja lo hecho al final", () => {
    const metas = metasDeBpm(
      EJERCICIOS,
      [
        { exercise_slug: "cromatico-1234", bpm: 110, recorded_at: dias(1) },
        { exercise_slug: "3nps-7-patrones", bpm: 96, recorded_at: dias(1) },
      ],
      HOY,
    );
    expect(metas.map((m) => m.slug)).toEqual(["3nps-7-patrones", "cromatico-1234"]);
  });
});

describe("resumenDeMetas", () => {
  it("cuenta conseguidas sobre el total", () => {
    const metas = metasDeBpm(
      EJERCICIOS,
      [{ exercise_slug: "cromatico-1234", bpm: 110, recorded_at: dias(1) }],
      HOY,
    );
    expect(resumenDeMetas(metas)).toEqual({ conseguidas: 1, total: 2 });
  });
});

describe("recortarMetas", () => {
  const meta = (slug: string, estado: "cerca" | "sin-empezar") => ({
    slug,
    titulo: slug,
    objetivo: 100,
    faltan: 10,
    estado,
  });

  it("enseña todas las que están en juego y corta la cola de sin empezar", () => {
    const metas = [
      ...Array.from({ length: 10 }, (_, i) => meta(`viva-${i}`, "cerca")),
      ...Array.from({ length: 20 }, (_, i) => meta(`quieta-${i}`, "sin-empezar")),
    ];
    const { visibles, ocultas } = recortarMetas(metas, 6);
    expect(visibles.filter((m) => m.estado === "cerca")).toHaveLength(10);
    expect(visibles.filter((m) => m.estado === "sin-empezar")).toHaveLength(6);
    expect(ocultas).toBe(14);
  });

  it("si caben todas, no oculta nada", () => {
    const { ocultas } = recortarMetas([meta("a", "sin-empezar")], 6);
    expect(ocultas).toBe(0);
  });
});
