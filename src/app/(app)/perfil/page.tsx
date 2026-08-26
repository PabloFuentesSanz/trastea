import Link from "next/link";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getLesson } from "@/lib/content/loader";
import { getUserContext } from "@/lib/queries";

export const metadata: Metadata = { title: "Perfil" };

const LEVEL_LABEL: Record<string, string> = {
  cero: "Desde cero",
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export default async function PerfilPage() {
  const ctx = await getUserContext();
  const current = ctx.profile?.current_lesson_slug
    ? getLesson(ctx.profile.current_lesson_slug)
    : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Perfil</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {ctx.profile?.display_name || (ctx.userId ? "Sin nombre" : "Modo demo")}
          </CardTitle>
          <CardDescription>
            {ctx.userId
              ? "Tu cuenta y preferencias."
              : ctx.configured
                ? "No has iniciado sesión. Entra para guardar tu progreso."
                : "Sin Supabase configurado no hay cuenta; el progreso no se guarda."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nivel</span>
            <Badge variant="secondary">
              {LEVEL_LABEL[ctx.profile?.level ?? ""] ?? "—"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Lección actual</span>
            <span className="truncate">{current?.frontmatter.title ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Racha</span>
            <span>{ctx.profile?.streak_days ?? 0} días</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            {ctx.userId ? (
              <>
                <Button asChild variant="outline">
                  <Link href="/onboarding">Cambiar nivel / nombre</Link>
                </Button>
                <SignOutButton />
              </>
            ) : (
              ctx.configured && (
                <Button asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        Próximamente: preferencias de zurdo, afinación y calibración de audio, y
        exportación de datos.
      </p>
    </main>
  );
}
