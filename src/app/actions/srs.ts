"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { dueDate, review, type Grade } from "@/lib/srs/scheduler";
import { parseCardId } from "@/lib/train/cards";

export interface SrsResult {
  ok: boolean;
  error?: string;
}

/**
 * Guarda el resultado de una tarjeta. Crea la fila la primera vez que se
 * responde: el mazo vive en código, la base de datos solo guarda progreso.
 */
export async function gradeCard(input: {
  cardId: string;
  grade: Grade;
}): Promise<SrsResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "demo" };
  const card = parseCardId(input.cardId);
  if (!card) return { ok: false, error: "tarjeta desconocida" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "demo" };

  const { data: existing } = await supabase
    .from("srs_cards")
    .select("id, interval_days, ease, reps, lapses")
    .eq("user_id", user.id)
    .eq("card_type", card.type)
    .eq("payload->>id", input.cardId)
    .maybeSingle();

  const state = existing
    ? {
        intervalDays: Number(existing.interval_days),
        ease: Number(existing.ease),
        reps: existing.reps,
        lapses: existing.lapses,
      }
    : { intervalDays: 0, ease: 2.5, reps: 0, lapses: 0 };

  const next = review(state, input.grade);
  const due = new Date(dueDate(next, Date.now())).toISOString();

  const row = {
    user_id: user.id,
    card_type: card.type,
    payload: { id: input.cardId },
    due_at: due,
    interval_days: next.intervalDays,
    ease: next.ease,
    reps: next.reps,
    lapses: next.lapses,
  };

  const { error } = existing
    ? await supabase.from("srs_cards").update(row).eq("id", existing.id)
    : await supabase.from("srs_cards").insert(row);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
