"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLesson, getOrderedLessons, nextLessonSlug } from "@/lib/content/loader";
import { nextStreak } from "@/lib/streak";
import type { UserLevel } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const DEMO: ActionResult = { ok: false, error: "demo" };

async function requireUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/** Primera lección real del curso (para onboarding y fallback de /hoy). */
export async function firstLessonSlug(): Promise<string | null> {
  const ordered = getOrderedLessons();
  return ordered[0]?.frontmatter.slug ?? null;
}

export async function saveOnboarding(input: {
  displayName: string;
  level: UserLevel;
}): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return DEMO;

  const start = await firstLessonSlug();
  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      display_name: input.displayName.slice(0, 80),
      level: input.level,
      current_lesson_slug: start,
    })
    .eq("id", ctx.user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function completeBlock(input: {
  lessonSlug: string;
  blockId: string;
}): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return DEMO;
  if (!getLesson(input.lessonSlug)) return { ok: false, error: "lección desconocida" };

  const { data: existing } = await ctx.supabase
    .from("lesson_progress")
    .select("id, blocks_done")
    .eq("user_id", ctx.user.id)
    .eq("lesson_slug", input.lessonSlug)
    .maybeSingle();

  const blocksDone = Array.from(
    new Set([...(existing?.blocks_done ?? []), input.blockId]),
  );

  const { error } = await ctx.supabase.from("lesson_progress").upsert(
    {
      user_id: ctx.user.id,
      lesson_slug: input.lessonSlug,
      status: "in_progress",
      blocks_done: blocksDone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_slug" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logBpm(input: {
  exerciseSlug: string;
  bpm: number;
  clean: boolean;
}): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return DEMO;
  if (input.bpm < 20 || input.bpm > 400)
    return { ok: false, error: "bpm fuera de rango" };

  const { error } = await ctx.supabase.from("exercise_records").insert({
    user_id: ctx.user.id,
    exercise_slug: input.exerciseSlug,
    bpm: Math.round(input.bpm),
    clean: input.clean,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Práctica que no es la lección del día: media hora trasteando, un rato con
 * el metrónomo, tocar canciones. Antes no había forma de registrarla, así que
 * un día de práctica de verdad rompía la racha y salía en blanco en el
 * calendario.
 */
export async function logFreeSession(input: {
  date: string;
  durationMin: number;
  mood?: number;
  notes?: string;
}): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return DEMO;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    return { ok: false, error: "fecha inválida" };
  if (input.durationMin <= 0 || input.durationMin > 600)
    return { ok: false, error: "duración fuera de rango" };

  const { error } = await ctx.supabase.from("practice_sessions").insert({
    user_id: ctx.user.id,
    date: input.date,
    lesson_slug: null,
    duration_min: Math.round(input.durationMin),
    blocks: [],
    mood: input.mood ?? null,
    notes: input.notes ?? null,
  });
  if (error) return { ok: false, error: error.message };

  const racha = await actualizarRacha(ctx, input.date);
  if (racha) return racha;

  revalidatePath("/", "layout");
  return { ok: true };
}

/** La racha y la fecha de última práctica, que se tocan desde dos sitios. */
async function actualizarRacha(
  ctx: NonNullable<Awaited<ReturnType<typeof requireUser>>>,
  date: string,
): Promise<ActionResult | null> {
  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("streak_days, last_practice_date")
    .eq("id", ctx.user.id)
    .maybeSingle();

  const streak = nextStreak(
    {
      streakDays: profile?.streak_days ?? 0,
      lastPracticeDate: profile?.last_practice_date ?? null,
    },
    date,
  );

  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      streak_days: streak.streakDays,
      last_practice_date: streak.lastPracticeDate,
    })
    .eq("id", ctx.user.id);
  return error ? { ok: false, error: error.message } : null;
}

export type CompletedBlockSummary = {
  id: string;
  type: string;
  min: number;
  bpm?: number;
};

export async function completeLesson(input: {
  lessonSlug: string;
  /** fecha local del usuario YYYY-MM-DD */
  date: string;
  durationMin: number;
  blocks: CompletedBlockSummary[];
  mood?: number;
  notes?: string;
}): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return DEMO;
  const lesson = getLesson(input.lessonSlug);
  if (!lesson) return { ok: false, error: "lección desconocida" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    return { ok: false, error: "fecha inválida" };

  const now = new Date().toISOString();

  const { error: sessionError } = await ctx.supabase.from("practice_sessions").insert({
    user_id: ctx.user.id,
    date: input.date,
    lesson_slug: input.lessonSlug,
    duration_min: Math.max(0, Math.round(input.durationMin)),
    blocks: input.blocks,
    mood: input.mood ?? null,
    notes: input.notes ?? null,
  });
  if (sessionError) return { ok: false, error: sessionError.message };

  const { error: progressError } = await ctx.supabase.from("lesson_progress").upsert(
    {
      user_id: ctx.user.id,
      lesson_slug: input.lessonSlug,
      status: "done",
      blocks_done: input.blocks.map((b) => b.id),
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_slug" },
  );
  if (progressError) return { ok: false, error: progressError.message };

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("streak_days, last_practice_date, current_lesson_slug")
    .eq("id", ctx.user.id)
    .maybeSingle();

  const streak = nextStreak(
    {
      streakDays: profile?.streak_days ?? 0,
      lastPracticeDate: profile?.last_practice_date ?? null,
    },
    input.date,
  );

  // Avanza la lección actual solo si se completó la que tocaba
  const next =
    profile?.current_lesson_slug === input.lessonSlug
      ? (nextLessonSlug(input.lessonSlug) ?? input.lessonSlug)
      : (profile?.current_lesson_slug ?? null);

  const { error: profileError } = await ctx.supabase
    .from("profiles")
    .update({
      streak_days: streak.streakDays,
      last_practice_date: streak.lastPracticeDate,
      current_lesson_slug: next,
    })
    .eq("id", ctx.user.id);
  if (profileError) return { ok: false, error: profileError.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
