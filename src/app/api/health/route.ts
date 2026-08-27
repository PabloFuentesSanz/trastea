import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { CARD_TYPES } from "@/lib/train/cards";
import { schemaSummary, TABLAS_USADAS } from "@/lib/health/schema";

/**
 * Diagnóstico de configuración y de esquema. No expone secretos: solo dice
 * qué variables ve el servidor, de qué proyecto es la URL y si la base de
 * datos desplegada tiene lo que el código espera.
 *
 * Lo segundo existe porque el fallo típico no es "no hay Supabase": es que el
 * código va por delante de las migraciones. Eso, desde fuera, se ve como una
 * app que funciona y no guarda nada.
 *
 * Se evalúa siempre en runtime para reflejar el entorno real del deploy.
 */
export const dynamic = "force-dynamic";

async function comprobarEsquema() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const resumen = await schemaSummary(async (tabla) => {
    // head + count no trae datos: solo comprueba que la tabla existe y
    // responde. Con RLS y sin sesión, una tabla que está da 0 filas; una que
    // falta da error de esquema.
    const { error } = await supabase
      .from(tabla as (typeof TABLAS_USADAS)[number])
      .select("*", { count: "exact", head: true });
    return error ? error.message : null;
  });
  return {
    ...resumen,
    /**
     * Los tipos de tarjeta que el código sabe generar. Si la migración que
     * los añade no está aplicada, el CHECK de `srs_cards` los rechaza y el
     * entrenamiento no guarda nada. Compáralos con el constraint si el
     * entrenamiento no registra progreso.
     */
    cardTypesEsperados: CARD_TYPES,
  };
}

export async function GET() {
  const url = supabaseUrl();
  const key = supabaseKey();
  const esquema = await comprobarEsquema();

  return NextResponse.json({
    supabaseConfigured: Boolean(url && key),
    url: {
      present: Boolean(url),
      // solo el host, para confirmar que apunta a tu proyecto
      host: url ? new URL(url).host : null,
    },
    key: {
      present: Boolean(key),
      // qué nombre de variable se está usando y cómo empieza la clave
      variable: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
          : null,
      prefix: key ? `${key.slice(0, 12)}…` : null,
    },
    esquema,
    env: process.env.VERCEL_ENV ?? "local",
  });
}
