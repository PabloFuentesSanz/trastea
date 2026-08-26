"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getModule, getQuiz } from "@/lib/content/loader";
import { scoreQuiz, type QuizAnswers } from "@/lib/assessment/scoring";

export interface AssessmentResult {
  ok: boolean;
  error?: string;
  score?: number;
  passed?: boolean;
}

async function requireUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/** Corrige el quiz en servidor (la respuesta correcta nunca viaja al cliente). */
export async function submitQuiz(input: {
  moduleSlug: string;
  answers: QuizAnswers;
}): Promise<AssessmentResult> {
  const mod = getModule(input.moduleSlug);
  const quizSlug = mod?.frontmatter.assessment?.quiz_slug;
  const quiz = quizSlug ? getQuiz(quizSlug) : null;
  if (!quiz) return { ok: false, error: "quiz desconocido" };

  const result = scoreQuiz(
    quiz.frontmatter.questions,
    input.answers,
    quiz.frontmatter.pass_score,
  );

  const ctx = await requireUser();
  if (!ctx) {
    return { ok: false, error: "demo", score: result.score, passed: result.passed };
  }

  const { error } = await ctx.supabase.from("assessments").insert({
    user_id: ctx.user.id,
    module_slug: input.moduleSlug,
    type: "quiz",
    score: result.score,
    passed: result.passed,
    data: { correct: result.correct, total: result.total, wrong: result.wrong },
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/curso/${input.moduleSlug}`);
  return { ok: true, score: result.score, passed: result.passed };
}

/** Guarda el estado del checklist de la evaluación (una fila por módulo). */
export async function saveChecklist(input: {
  moduleSlug: string;
  done: string[];
}): Promise<AssessmentResult> {
  const mod = getModule(input.moduleSlug);
  const items = mod?.frontmatter.assessment?.checklist ?? [];
  if (items.length === 0) return { ok: false, error: "sin checklist" };

  const ctx = await requireUser();
  if (!ctx) return { ok: false, error: "demo" };

  const valid = input.done.filter((item) => items.includes(item));
  const passed = valid.length === items.length;

  const { data: existing } = await ctx.supabase
    .from("assessments")
    .select("id")
    .eq("user_id", ctx.user.id)
    .eq("module_slug", input.moduleSlug)
    .eq("type", "checklist")
    .maybeSingle();

  const row = {
    user_id: ctx.user.id,
    module_slug: input.moduleSlug,
    type: "checklist" as const,
    score: items.length === 0 ? 0 : valid.length / items.length,
    passed,
    data: { done: valid },
  };

  const { error } = existing
    ? await ctx.supabase.from("assessments").update(row).eq("id", existing.id)
    : await ctx.supabase.from("assessments").insert(row);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/curso/${input.moduleSlug}`);
  return { ok: true, passed };
}

/** Registra una grabación ya subida a Storage. */
export async function saveRecording(input: {
  storagePath: string;
  title: string;
  moduleSlug?: string;
  lessonSlug?: string;
  durationS?: number;
}): Promise<AssessmentResult> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, error: "demo" };

  const { error } = await ctx.supabase.from("recordings").insert({
    user_id: ctx.user.id,
    storage_path: input.storagePath,
    title: input.title.slice(0, 120),
    lesson_slug: input.lessonSlug ?? null,
    duration_s: input.durationS ? Math.round(input.durationS) : null,
  });
  if (error) return { ok: false, error: error.message };

  // Una grabación asociada a un módulo cuenta como pata de su evaluación
  if (input.moduleSlug) {
    await ctx.supabase.from("assessments").insert({
      user_id: ctx.user.id,
      module_slug: input.moduleSlug,
      type: "recording",
      passed: true,
      data: { storage_path: input.storagePath },
    });
    revalidatePath(`/curso/${input.moduleSlug}`);
  }
  revalidatePath("/grabaciones");
  return { ok: true };
}

export async function deleteRecording(input: {
  id: string;
  storagePath: string;
}): Promise<AssessmentResult> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, error: "demo" };

  await ctx.supabase.storage.from("recordings").remove([input.storagePath]);
  const { error } = await ctx.supabase
    .from("recordings")
    .delete()
    .eq("id", input.id)
    .eq("user_id", ctx.user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/grabaciones");
  return { ok: true };
}
