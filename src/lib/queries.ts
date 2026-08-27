import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { currentStreak } from "@/lib/streak";
import { cardId, type TrainCard } from "@/lib/train/cards";
import { selectSession, sessionStats, type DueCard } from "@/lib/srs/scheduler";
import type {
  ExerciseRecordRow,
  LessonProgressRow,
  PracticeSessionRow,
  ProfileRow,
} from "@/lib/supabase/types";

export interface AppUserContext {
  configured: boolean;
  userId: string | null;
  profile: ProfileRow | null;
}

export async function getUserContext(): Promise<AppUserContext> {
  if (!isSupabaseConfigured()) {
    return { configured: false, userId: null, profile: null };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, userId: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { configured: true, userId: user.id, profile: profile ?? null };
}

function todayLocal(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface DashboardData {
  streak: number;
  weekMinutes: number;
  sessionsThisWeek: number;
  latestBpms: { exercise_slug: string; bpm: number; recorded_at: string }[];
  doneLessons: number;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);

  const [profileRes, sessionsRes, recordsRes, progressRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("streak_days, last_practice_date")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("practice_sessions")
      .select("duration_min, date")
      .eq("user_id", userId)
      .gte("date", since),
    supabase
      .from("exercise_records")
      .select("exercise_slug, bpm, recorded_at")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(30),
    supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "done"),
  ]);

  const sessions = sessionsRes.data ?? [];
  // último registro por ejercicio
  const latest = new Map<
    string,
    { exercise_slug: string; bpm: number; recorded_at: string }
  >();
  for (const r of recordsRes.data ?? []) {
    if (!latest.has(r.exercise_slug)) latest.set(r.exercise_slug, r);
  }

  return {
    streak: currentStreak(
      {
        streakDays: profileRes.data?.streak_days ?? 0,
        lastPracticeDate: profileRes.data?.last_practice_date ?? null,
      },
      todayLocal(),
    ),
    weekMinutes: sessions.reduce((sum, s) => sum + s.duration_min, 0),
    sessionsThisWeek: sessions.length,
    latestBpms: [...latest.values()].slice(0, 5),
    doneLessons: progressRes.count ?? 0,
  };
}

export async function getLessonProgressMap(
  userId: string,
): Promise<Map<string, LessonProgressRow>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId);
  return new Map((data ?? []).map((row) => [row.lesson_slug, row]));
}

export async function getLessonProgress(
  userId: string,
  lessonSlug: string,
): Promise<LessonProgressRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_slug", lessonSlug)
    .maybeSingle();
  return data ?? null;
}

export async function getRecentSessions(
  userId: string,
  limit = 20,
): Promise<PracticeSessionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export interface ExerciseAttempt {
  bpm: number;
  clean: boolean;
  recordedAt: string;
}

export interface ExerciseHistory {
  attempts: ExerciseAttempt[];
  /** cuántas veces se ha registrado */
  times: number;
  /** el bpm más alto alcanzado limpio */
  bestClean: number | null;
  /** el último registrado, limpio o no */
  last: ExerciseAttempt | null;
  /** días distintos en los que se ha practicado */
  days: number;
}

/**
 * Todo lo que se sabe de un ejercicio: cuándo lo has hecho, a qué bpm y si
 * salió limpio. El campo `clean` se guardaba desde el principio y no se
 * enseñaba en ninguna parte.
 */
export async function getExerciseHistory(
  userId: string | null,
  exerciseSlug: string,
): Promise<ExerciseHistory> {
  const vacio: ExerciseHistory = {
    attempts: [],
    times: 0,
    bestClean: null,
    last: null,
    days: 0,
  };
  if (!userId || !isSupabaseConfigured()) return vacio;

  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_records")
    .select("bpm, clean, recorded_at")
    .eq("user_id", userId)
    .eq("exercise_slug", exerciseSlug)
    .order("recorded_at", { ascending: true })
    .limit(400);

  const attempts: ExerciseAttempt[] = (data ?? []).map((r) => ({
    bpm: r.bpm,
    clean: r.clean,
    recordedAt: r.recorded_at,
  }));
  if (attempts.length === 0) return vacio;

  const limpios = attempts.filter((a) => a.clean).map((a) => a.bpm);
  return {
    attempts,
    times: attempts.length,
    bestClean: limpios.length > 0 ? Math.max(...limpios) : null,
    last: attempts[attempts.length - 1],
    days: new Set(attempts.map((a) => a.recordedAt.slice(0, 10))).size,
  };
}

/** Minutos por día de los últimos `weeks` semanas, para el calendario. */
export async function getPracticeCalendar(
  userId: string,
  weeks = 26,
): Promise<{ date: string; minutes: number }[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - weeks * 7 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("practice_sessions")
    .select("date, duration_min")
    .eq("user_id", userId)
    .gte("date", since);
  return (data ?? []).map((s) => ({ date: s.date, minutes: s.duration_min ?? 0 }));
}

export async function getBpmRecords(userId: string): Promise<ExerciseRecordRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_records")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true })
    .limit(500);
  return data ?? [];
}

export interface SrsProgressRow {
  cardId: string;
  dueAt: number;
  reps: number;
  ease: number;
  intervalDays: number;
  lapses: number;
}

/** Progreso SRS del usuario, indexado por id de tarjeta. */
export async function getSrsProgress(userId: string): Promise<SrsProgressRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("srs_cards")
    .select("payload, due_at, reps, ease, interval_days, lapses")
    .eq("user_id", userId)
    .eq("card_type", "fretboard_note");

  return (data ?? []).flatMap((row) => {
    const payload = row.payload as { id?: unknown } | null;
    const cardId = typeof payload?.id === "string" ? payload.id : null;
    if (!cardId) return [];
    return [
      {
        cardId,
        dueAt: Date.parse(row.due_at),
        reps: row.reps,
        ease: Number(row.ease),
        intervalDays: Number(row.interval_days),
        lapses: row.lapses,
      },
    ];
  });
}

export interface TrainingDeck {
  session: TrainCard[];
  due: number;
  fresh: number;
  total: number;
  learned: number;
}

/**
 * Mazo de la sesión de hoy: cruza el mazo (código) con el progreso (base de
 * datos) y elige qué preguntar. Aquí vive el reloj, no en el render.
 */
export async function getTrainingDeck(
  userId: string | null,
  deck: readonly TrainCard[],
  sessionSize: number,
): Promise<TrainingDeck> {
  const progress = userId ? await getSrsProgress(userId) : [];
  const byId = new Map(progress.map((p) => [p.cardId, p]));
  const now = Date.now();

  const dueCards: DueCard<TrainCard>[] = deck.map((card) => {
    const saved = byId.get(cardId(card));
    return { card, dueAt: saved?.dueAt ?? now, reps: saved?.reps ?? 0 };
  });

  const stats = sessionStats(dueCards, now);
  return {
    session: selectSession(dueCards, now, sessionSize),
    ...stats,
    // "consolidada" = acertada al menos una vez y con un día o más de espera,
    // y solo de este mazo: el progreso de otro entrenamiento no cuenta aquí
    learned: dueCards.filter((c) => {
      const saved = byId.get(cardId(c.card));
      return saved !== undefined && saved.reps > 0 && saved.intervalDays >= 1;
    }).length,
  };
}

export interface ModuleAssessmentSnapshot {
  quizPassed: boolean;
  checklistDone: string[];
  hasRecording: boolean;
}

/** Estado de la evaluación de un módulo: quiz, checklist y grabación. */
export async function getModuleAssessment(
  userId: string,
  moduleSlug: string,
): Promise<ModuleAssessmentSnapshot> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("type, passed, data")
    .eq("user_id", userId)
    .eq("module_slug", moduleSlug);

  const rows = data ?? [];
  const checklistRow = rows.find((r) => r.type === "checklist");
  const checklistData = checklistRow?.data as { done?: unknown } | null;

  return {
    quizPassed: rows.some((r) => r.type === "quiz" && r.passed),
    checklistDone: Array.isArray(checklistData?.done)
      ? (checklistData.done as unknown[]).filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    hasRecording: rows.some((r) => r.type === "recording"),
  };
}

export interface RecordingItem {
  id: string;
  title: string;
  storagePath: string;
  lessonSlug: string | null;
  durationS: number | null;
  createdAt: string;
  /** URL firmada, válida un rato */
  url: string | null;
}

export async function getRecordings(userId: string): Promise<RecordingItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recordings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: signed } = await supabase.storage.from("recordings").createSignedUrls(
    rows.map((r) => r.storage_path),
    60 * 60,
  );
  const urlByPath = new Map(
    (signed ?? []).map((s) => [s.path ?? "", s.signedUrl ?? null]),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    storagePath: row.storage_path,
    lessonSlug: row.lesson_slug,
    durationS: row.duration_s,
    createdAt: row.created_at,
    url: urlByPath.get(row.storage_path) ?? null,
  }));
}
