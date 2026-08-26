/**
 * Variables de entorno de Supabase. Soporta los dos juegos de nombres:
 * el clásico (ANON_KEY) y el nuevo del dashboard (PUBLISHABLE_KEY).
 * Nota: los accesos a process.env.NEXT_PUBLIC_* deben ser literales para
 * que Next los inline en el bundle de cliente.
 */

export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function supabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}
