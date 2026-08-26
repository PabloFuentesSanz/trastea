import { AppNav } from "@/components/layout/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />
      {!isSupabaseConfigured() && (
        <p className="border-b border-primary/30 bg-primary/10 px-4 py-1.5 text-center text-xs text-primary">
          Modo demo: sin Supabase configurado el progreso no se guarda (ver README).
        </p>
      )}
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <Toaster />
    </div>
  );
}
