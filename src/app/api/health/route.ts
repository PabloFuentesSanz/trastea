import { NextResponse } from "next/server";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Diagnóstico de configuración. No expone secretos: solo dice qué variables
 * ve el servidor y de qué proyecto es la URL.
 * Se evalúa siempre en runtime para reflejar el entorno real del deploy.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const url = supabaseUrl();
  const key = supabaseKey();

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
    env: process.env.VERCEL_ENV ?? "local",
  });
}
