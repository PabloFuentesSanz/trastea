import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Doble del cliente de Supabase que apunta qué consulta se construye.
 *
 * Estas funciones solo se ejecutan con sesión iniciada, así que en modo demo
 * —que es como se prueba todo lo demás— no pasan nunca por aquí. Lo que se
 * comprueba no es la base de datos, es la consulta: un `.eq()` de más filtra
 * datos que sí existen y la app se queda tan tranquila.
 */
interface Llamada {
  tabla: string;
  select?: string;
  eq: [string, unknown][];
  in: [string, unknown[]][];
}

const llamadas: Llamada[] = [];
let respuesta: unknown[] = [];

function builder(tabla: string) {
  const registro: Llamada = { tabla, eq: [], in: [] };
  llamadas.push(registro);
  const api = {
    select(cols: string) {
      registro.select = cols;
      return api;
    },
    eq(col: string, val: unknown) {
      registro.eq.push([col, val]);
      return api;
    },
    in(col: string, vals: unknown[]) {
      registro.in.push([col, vals]);
      return api;
    },
    order: () => api,
    limit: () => api,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (
      resolve: (r: { data: unknown[]; error: null }) => unknown,
    ): Promise<unknown> => {
      // el doble APLICA los filtros: si no, un `.eq()` de más no se nota y el
      // test pasa igual con el fallo dentro
      const filas = (respuesta as Record<string, unknown>[]).filter(
        (fila) =>
          registro.eq.every(([col, val]) => !(col in fila) || fila[col] === val) &&
          registro.in.every(([col, vals]) => !(col in fila) || vals.includes(fila[col])),
      );
      return Promise.resolve(resolve({ data: filas, error: null }));
    },
  };
  return api;
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: () => true,
  createClient: () =>
    Promise.resolve({
      from: (tabla: string) => builder(tabla),
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    }),
}));

const { getSrsProgress, getTrainingDeck } = await import("./queries");

beforeEach(() => {
  llamadas.length = 0;
  respuesta = [];
});

const fila = (cardId: string, extra: Record<string, unknown> = {}) => ({
  payload: { id: cardId },
  // el tipo va en la fila para que el doble pueda filtrar por él
  card_type: cardId.split(":")[0],
  user_id: "u1",
  due_at: new Date(Date.now() - 86_400_000).toISOString(),
  reps: 3,
  ease: 2.5,
  interval_days: 2,
  lapses: 0,
  ...extra,
});

describe("getSrsProgress", () => {
  it("no se queda con un solo tipo de tarjeta", async () => {
    // Aquí vivía el fallo: filtraba por 'fretboard_note', que era el único
    // entrenamiento que había cuando se escribió. Con nueve entrenamientos,
    // ocho no leían nunca su progreso: siempre "sin estrenar", nunca repetían
    // lo fallado y "consolidadas" se quedaba en cero para siempre.
    await getSrsProgress("u1");
    const consulta = llamadas.find((l) => l.tabla === "srs_cards");
    expect(consulta).toBeDefined();
    expect(consulta!.eq.map(([col]) => col)).not.toContain("card_type");
  });

  it("filtra por usuario, que eso sí", async () => {
    await getSrsProgress("u1");
    expect(llamadas[0].eq).toContainEqual(["user_id", "u1"]);
  });

  it("acota a los tipos que pide el mazo, para no traerse todo", async () => {
    await getSrsProgress("u1", ["ear_interval", "scale_box"]);
    expect(llamadas[0].in).toContainEqual(["card_type", ["ear_interval", "scale_box"]]);
  });

  it("devuelve el progreso con su id de tarjeta", async () => {
    respuesta = [fila("ear_interval:7")];
    const progreso = await getSrsProgress("u1");
    expect(progreso).toHaveLength(1);
    expect(progreso[0].cardId).toBe("ear_interval:7");
    expect(progreso[0].reps).toBe(3);
  });

  it("descarta filas sin id en el payload en vez de reventar", async () => {
    respuesta = [{ ...fila("x"), payload: {} }];
    expect(await getSrsProgress("u1")).toEqual([]);
  });
});

describe("getTrainingDeck", () => {
  it("cuenta como consolidada una tarjeta de oído, no solo las del mástil", async () => {
    respuesta = [fila("ear_interval:7")];
    const deck = await getTrainingDeck(
      "u1",
      [{ type: "ear_interval", semitones: 7 }],
      10,
    );
    expect(deck.learned).toBe(1);
    expect(deck.fresh).toBe(0);
  });

  it("sin usuario no consulta nada y todo está sin estrenar", async () => {
    const deck = await getTrainingDeck(
      null,
      [{ type: "ear_interval", semitones: 7 }],
      10,
    );
    expect(llamadas).toHaveLength(0);
    expect(deck.fresh).toBe(1);
    expect(deck.learned).toBe(0);
  });

  it("pide solo los tipos de tarjeta que hay en el mazo", async () => {
    await getTrainingDeck(
      "u1",
      [
        { type: "ear_interval", semitones: 7 },
        {
          type: "scale_box",
          root: "A",
          scaleId: "minor-pentatonic",
          box: 1,
          missing: { string: 0, fret: 8 },
        },
      ],
      10,
    );
    const [, tipos] = llamadas[0].in[0];
    expect([...tipos].sort()).toEqual(["ear_interval", "scale_box"]);
  });
});
