import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

export { isSupabaseConfigured };

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl()!, supabaseKey()!);
}
