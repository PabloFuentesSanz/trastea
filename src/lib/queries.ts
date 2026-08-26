import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { currentStreak } from "@/lib/streak";
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
  const latest = new Map<string, { exercise_slug: string; bpm: number; recorded_at: string }>();
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
