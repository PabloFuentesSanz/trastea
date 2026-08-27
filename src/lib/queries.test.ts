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
  count?: number;
}

const llamadas: Llamada[] = [];
let respuesta: unknown[] = [];
/** respuestas por tabla, para las funciones que consultan varias */
let porTabla: Record<string, unknown[]> = {};
let firmadas: { path: string; signedUrl: string }[] = [];

function builder(tabla: string) {
  const registro: Llamada = { tabla, eq: [], in: [] };
  llamadas.push(registro);
  const datos = () => porTabla[tabla] ?? respuesta;
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
    gte(col: string, val: unknown) {
      registro.eq.push([`gte:${col}`, val]);
      return api;
    },
    order: () => api,
    limit: () => api,
    maybeSingle: () =>
      Promise.resolve({ data: (datos()[0] as unknown) ?? null, error: null }),
    then: (
      resolve: (r: { data: unknown[]; error: null }) => unknown,
    ): Promise<unknown> => {
      registro.count = datos().length;
      // el doble APLICA los filtros: si no, un `.eq()` de más no se nota y el
      // test pasa igual con el fallo dentro
      const filas = (datos() as Record<string, unknown>[]).filter(
        (fila) =>
          registro.eq.every(([col, val]) => !(col in fila) || fila[col] === val) &&
          registro.in.every(([col, vals]) => !(col in fila) || vals.includes(fila[col])),
      );
      return Promise.resolve(
        resolve({ data: filas, error: null, count: filas.length } as never),
      );
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
      storage: {
        from: () => ({
          createSignedUrls: () => Promise.resolve({ data: firmadas, error: null }),
        }),
      },
    }),
}));

const {
  getSrsProgress,
  getTrainingDeck,
  getDashboardData,
  getExerciseHistory,
  getModuleAssessment,
  getRecordings,
  getPracticeCalendar,
} = await import("./queries");

beforeEach(() => {
  llamadas.length = 0;
  respuesta = [];
  porTabla = {};
  firmadas = [];
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

const hoy = new Date().toISOString().slice(0, 10);

describe("getDashboardData", () => {
  it("suma los minutos de la semana y cuenta las sesiones", async () => {
    porTabla = {
      profiles: [{ streak_days: 4, last_practice_date: hoy }],
      practice_sessions: [
        { duration_min: 20, date: hoy },
        { duration_min: 35, date: hoy },
      ],
      exercise_records: [],
      lesson_progress: [],
    };
    const d = await getDashboardData("u1");
    expect(d.weekMinutes).toBe(55);
    expect(d.sessionsThisWeek).toBe(2);
  });

  it("de cada ejercicio enseña el registro más reciente, no todos", async () => {
    porTabla = {
      profiles: [],
      practice_sessions: [],
      // vienen ordenados de más nuevo a más viejo
      exercise_records: [
        {
          exercise_slug: "cromatico-1234",
          bpm: 110,
          recorded_at: "2026-08-20T10:00:00Z",
        },
        { exercise_slug: "cromatico-1234", bpm: 90, recorded_at: "2026-08-10T10:00:00Z" },
        { exercise_slug: "octavas", bpm: 70, recorded_at: "2026-08-19T10:00:00Z" },
      ],
      lesson_progress: [],
    };
    const d = await getDashboardData("u1");
    expect(d.latestBpms).toHaveLength(2);
    expect(d.latestBpms.find((r) => r.exercise_slug === "cromatico-1234")?.bpm).toBe(110);
  });

  it("pide solo la última semana de sesiones", async () => {
    porTabla = {
      profiles: [],
      practice_sessions: [],
      exercise_records: [],
      lesson_progress: [],
    };
    await getDashboardData("u1");
    const sesiones = llamadas.find((l) => l.tabla === "practice_sessions")!;
    const [, desde] = sesiones.eq.find(([col]) => col.startsWith("gte:"))!;
    const dias = Math.round((Date.parse(hoy) - Date.parse(String(desde))) / 86_400_000);
    expect(dias).toBe(6);
  });

  it("cada consulta se ata al usuario que la pide", async () => {
    porTabla = {
      profiles: [],
      practice_sessions: [],
      exercise_records: [],
      lesson_progress: [],
    };
    await getDashboardData("u1");
    for (const l of llamadas) {
      const atada = l.eq.some(
        ([col, val]) => (col === "user_id" || col === "id") && val === "u1",
      );
      expect(atada, `${l.tabla} no filtra por usuario`).toBe(true);
    }
  });
});

describe("getExerciseHistory", () => {
  const intento = (bpm: number, clean: boolean, dia: string) => ({
    bpm,
    clean,
    recorded_at: `${dia}T10:00:00Z`,
  });

  it("la mejor marca solo cuenta si salió limpia", async () => {
    respuesta = [
      intento(100, true, "2026-08-01"),
      intento(130, false, "2026-08-02"),
      intento(110, true, "2026-08-03"),
    ];
    const h = await getExerciseHistory("u1", "cromatico-1234");
    expect(h.bestClean).toBe(110);
    expect(h.times).toBe(3);
  });

  it("cuenta días distintos, no intentos", async () => {
    respuesta = [
      intento(90, true, "2026-08-01"),
      intento(95, true, "2026-08-01"),
      intento(100, true, "2026-08-02"),
    ];
    expect((await getExerciseHistory("u1", "x")).days).toBe(2);
  });

  it("sin ningún intento limpio no inventa una marca", async () => {
    respuesta = [intento(120, false, "2026-08-01")];
    expect((await getExerciseHistory("u1", "x")).bestClean).toBeNull();
  });

  it("sin usuario no consulta la base", async () => {
    const h = await getExerciseHistory(null, "x");
    expect(llamadas).toHaveLength(0);
    expect(h.times).toBe(0);
  });
});

describe("getModuleAssessment", () => {
  it("el quiz cuenta solo si está aprobado", async () => {
    respuesta = [{ type: "quiz", passed: false, data: null }];
    expect((await getModuleAssessment("u1", "a-cimientos")).quizPassed).toBe(false);
    respuesta = [{ type: "quiz", passed: true, data: null }];
    expect((await getModuleAssessment("u1", "a-cimientos")).quizPassed).toBe(true);
  });

  it("de la checklist se queda con las cadenas y tira lo demás", async () => {
    respuesta = [
      { type: "checklist", passed: null, data: { done: ["a", 3, null, "b"] } },
    ];
    expect((await getModuleAssessment("u1", "a")).checklistDone).toEqual(["a", "b"]);
  });

  it("un data corrupto no revienta la página", async () => {
    respuesta = [{ type: "checklist", passed: null, data: "no soy un objeto" }];
    expect((await getModuleAssessment("u1", "a")).checklistDone).toEqual([]);
  });
});

describe("getRecordings", () => {
  it("empareja cada grabación con SU url firmada, no por orden", async () => {
    respuesta = [
      {
        id: "1",
        title: "a",
        storage_path: "u1/a.webm",
        lesson_slug: null,
        duration_s: 10,
        created_at: "2026-08-02",
      },
      {
        id: "2",
        title: "b",
        storage_path: "u1/b.webm",
        lesson_slug: null,
        duration_s: 20,
        created_at: "2026-08-01",
      },
    ];
    // el storage devuelve las urls en otro orden a propósito
    firmadas = [
      { path: "u1/b.webm", signedUrl: "https://x/b" },
      { path: "u1/a.webm", signedUrl: "https://x/a" },
    ];
    const grabaciones = await getRecordings("u1");
    expect(grabaciones.find((g) => g.id === "1")?.url).toBe("https://x/a");
    expect(grabaciones.find((g) => g.id === "2")?.url).toBe("https://x/b");
  });

  it("si una url no viene, la grabación sigue apareciendo", async () => {
    respuesta = [
      {
        id: "1",
        title: "a",
        storage_path: "u1/a.webm",
        lesson_slug: null,
        duration_s: 10,
        created_at: "2026-08-02",
      },
    ];
    firmadas = [];
    const [g] = await getRecordings("u1");
    expect(g.url).toBeNull();
    expect(g.title).toBe("a");
  });

  it("sin grabaciones no pide urls firmadas", async () => {
    respuesta = [];
    expect(await getRecordings("u1")).toEqual([]);
  });
});

describe("getPracticeCalendar", () => {
  it("devuelve minutos por día y trata el nulo como cero", async () => {
    respuesta = [
      { date: "2026-08-01", duration_min: 30 },
      { date: "2026-08-02", duration_min: null },
    ];
    expect(await getPracticeCalendar("u1")).toEqual([
      { date: "2026-08-01", minutes: 30 },
      { date: "2026-08-02", minutes: 0 },
    ]);
  });
});
