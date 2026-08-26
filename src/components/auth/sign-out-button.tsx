"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  if (!isSupabaseConfigured()) return null;

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut aria-hidden /> Cerrar sesión
    </Button>
  );
}
