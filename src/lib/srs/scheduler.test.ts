import { describe, expect, it } from "vitest";
import {
  dueDate,
  MIN_EASE,
  MAX_EASE,
  NEW_CARD,
  RELEARN_INTERVAL,
  review,
  selectSession,
  sessionStats,
  type CardState,
} from "./scheduler";

const DAY = 24 * 60 * 60 * 1000;

/** Azar determinista: nada de Math.random dentro de un test. */
function secuencia(semilla: number) {
  let x = semilla;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

describe("review — primera vez", () => {
  it("acertar una tarjeta nueva la manda a mañana", () => {
    const next = review(NEW_CARD, "good");
    expect(next.intervalDays).toBe(1);
    expect(next.reps).toBe(1);
    expect(next.ease).toBeGreaterThan(NEW_CARD.ease);
  });

  it("si cuesta, vuelve dentro de la misma sesión", () => {
    const next = review(NEW_CARD, "hard");
    expect(next.intervalDays).toBe(RELEARN_INTERVAL);
    expect(next.reps).toBe(1);
    expect(next.ease).toBeLessThan(NEW_CARD.ease);
  });

  it("fallar una tarjeta nueva no cuenta como lapso", () => {
    const next = review(NEW_CARD, "again");
    expect(next.reps).toBe(0);
    expect(next.lapses).toBe(0);
    expect(next.intervalDays).toBe(RELEARN_INTERVAL);
  });
});

describe("review — progresión", () => {
  it("acertando crece 1 → 3 → intervalo por ease", () => {
    let card = review(NEW_CARD, "good");
    expect(card.intervalDays).toBe(1);
    card = review(card, "good");
    expect(card.intervalDays).toBe(3);
    card = review(card, "good");
    expect(card.intervalDays).toBeGreaterThan(3);
    expect(card.reps).toBe(3);
  });

  it("'cuesta' crece más despacio que 'bien'", () => {
    const base: CardState = { intervalDays: 10, ease: 2.5, reps: 3, lapses: 0 };
    expect(review(base, "hard").intervalDays).toBeLessThan(
      review(base, "good").intervalDays,
    );
  });

  it("fallar una tarjeta consolidada suma lapso y la devuelve al principio", () => {
    const mature: CardState = { intervalDays: 30, ease: 2.5, reps: 5, lapses: 1 };
    const next = review(mature, "again");
    expect(next.reps).toBe(0);
    expect(next.lapses).toBe(2);
    expect(next.intervalDays).toBe(RELEARN_INTERVAL);
  });
});

describe("review — ease acotada", () => {
  it("nunca baja del suelo por muchos fallos", () => {
    let card = NEW_CARD;
    for (let i = 0; i < 20; i++) card = review(card, "again");
    expect(card.ease).toBe(MIN_EASE);
  });

  it("nunca sube del techo por muchos aciertos", () => {
    let card = NEW_CARD;
    for (let i = 0; i < 20; i++) card = review(card, "good");
    expect(card.ease).toBeLessThanOrEqual(MAX_EASE);
  });
});

describe("dueDate", () => {
  it("convierte el intervalo en un instante futuro", () => {
    const now = Date.parse("2026-08-26T10:00:00Z");
    expect(dueDate({ ...NEW_CARD, intervalDays: 1 }, now)).toBe(now + DAY);
    expect(dueDate({ ...NEW_CARD, intervalDays: 0 }, now)).toBe(now);
  });
});

describe("selectSession", () => {
  const now = Date.parse("2026-08-26T10:00:00Z");
  const deck = [
    { card: "vencida-hace-3d", dueAt: now - 3 * DAY, reps: 4 },
    { card: "vencida-hoy", dueAt: now - 1000, reps: 2 },
    { card: "futura", dueAt: now + 5 * DAY, reps: 3 },
    { card: "nueva-1", dueAt: now, reps: 0 },
    { card: "nueva-2", dueAt: now, reps: 0 },
  ];

  it("prioriza lo vencido, lo más atrasado primero", () => {
    expect(selectSession(deck, now, 2)).toEqual(["vencida-hace-3d", "vencida-hoy"]);
  });

  it("rellena con tarjetas nuevas cuando falta", () => {
    const sesion = selectSession(deck, now, 4);
    // lo vencido va primero y en orden; las nuevas van barajadas detrás, así
    // que aquí se comprueba cuáles son, no en qué orden salen
    expect(sesion.slice(0, 2)).toEqual(["vencida-hace-3d", "vencida-hoy"]);
    expect(sesion.slice(2).sort()).toEqual(["nueva-1", "nueva-2"]);
  });

  it("las nuevas no salen siempre en el mismo orden", () => {
    // Aquí vivía el fallo: las nuevas tienen todas el mismo `dueAt`, el orden
    // estable las dejaba tal cual venían del mazo y la sesión era SIEMPRE las
    // primeras 20 cartas. En "reconocer intervalos" avanzado eso significaba
    // veinte preguntas seguidas en la 6ª cuerda, y cambiar de nivel no
    // cambiaba nada de lo que veías.
    const nuevas = Array.from({ length: 50 }, (_, i) => ({
      card: `n${i}`,
      dueAt: now,
      reps: 0,
    }));
    const a = selectSession(nuevas, now, 10, secuencia(0.9));
    const b = selectSession(nuevas, now, 10, secuencia(0.1));
    expect(a).not.toEqual(b);
    // y no son las diez primeras del mazo
    expect(a).not.toEqual(nuevas.slice(0, 10).map((c) => c.card));
  });

  it("con el mismo azar da lo mismo: nada de sorpresas en el servidor", () => {
    const nuevas = Array.from({ length: 30 }, (_, i) => ({
      card: `n${i}`,
      dueAt: now,
      reps: 0,
    }));
    expect(selectSession(nuevas, now, 8, secuencia(0.42))).toEqual(
      selectSession(nuevas, now, 8, secuencia(0.42)),
    );
  });

  it("lo vencido sigue mandando, y en orden: eso no se baraja", () => {
    const mezcla = [
      { card: "nueva", dueAt: now, reps: 0 },
      { card: "vencida-hace-3d", dueAt: now - 3 * DAY, reps: 4 },
      { card: "vencida-hoy", dueAt: now - 1000, reps: 2 },
    ];
    const sesion = selectSession(mezcla, now, 3, secuencia(0.7));
    expect(sesion.slice(0, 2)).toEqual(["vencida-hace-3d", "vencida-hoy"]);
  });

  it("baraja sin perder ni duplicar tarjetas", () => {
    const nuevas = Array.from({ length: 25 }, (_, i) => ({
      card: `n${i}`,
      dueAt: now,
      reps: 0,
    }));
    const sesion = selectSession(nuevas, now, 25, secuencia(0.33));
    expect(new Set(sesion).size).toBe(25);
    expect([...sesion].sort()).toEqual(nuevas.map((c) => c.card).sort());
  });

  it("un mazo pequeño da una sesión entera, no dos preguntas", () => {
    // "Acordes de oído" nivel 1 son dos tarjetas (mayor y menor) y la sesión
    // se acababa en dos preguntas. En los ejercicios de oído la repetición ES
    // el ejercicio: la raíz se sortea en cada pregunta, así que la misma
    // tarjeta suena distinta cada vez.
    const dos = [
      { card: "mayor", dueAt: now, reps: 0 },
      { card: "menor", dueAt: now, reps: 0 },
    ];
    const sesion = selectSession(dos, now, 12, secuencia(5));
    expect(sesion).toHaveLength(12);
    expect(new Set(sesion)).toEqual(new Set(["mayor", "menor"]));
  });

  it("al repetir no encadena la misma dos veces seguidas", () => {
    const dos = [
      { card: "mayor", dueAt: now, reps: 0 },
      { card: "menor", dueAt: now, reps: 0 },
    ];
    const sesion = selectSession(dos, now, 12, secuencia(5));
    for (let i = 1; i < sesion.length; i += 1) {
      expect(sesion[i], `posición ${i}`).not.toBe(sesion[i - 1]);
    }
  });

  it("con una sola tarjeta no se queda colgado", () => {
    const una = [{ card: "sola", dueAt: now, reps: 0 }];
    expect(selectSession(una, now, 5, secuencia(3))).toEqual([
      "sola",
      "sola",
      "sola",
      "sola",
      "sola",
    ]);
  });

  it("un mazo grande no repite ninguna en la misma sesión", () => {
    const muchas = Array.from({ length: 60 }, (_, i) => ({
      card: `n${i}`,
      dueAt: now,
      reps: 0,
    }));
    const sesion = selectSession(muchas, now, 20, secuencia(11));
    expect(new Set(sesion).size).toBe(20);
  });

  it("con el mazo vacío devuelve una sesión vacía", () => {
    expect(selectSession([], now, 10, secuencia(1))).toEqual([]);
  });

  it("nunca incluye tarjetas que aún no tocan", () => {
    expect(selectSession(deck, now, 10)).not.toContain("futura");
  });

  it("con mazo vacío devuelve sesión vacía", () => {
    expect(selectSession([], now, 10)).toEqual([]);
  });
});

describe("sessionStats", () => {
  it("cuenta vencidas y nuevas por separado", () => {
    const now = Date.parse("2026-08-26T10:00:00Z");
    const stats = sessionStats(
      [
        { card: "a", dueAt: now - DAY, reps: 3 },
        { card: "b", dueAt: now + DAY, reps: 3 },
        { card: "c", dueAt: now, reps: 0 },
      ],
      now,
    );
    expect(stats).toEqual({ due: 1, fresh: 1, total: 3 });
  });
});
