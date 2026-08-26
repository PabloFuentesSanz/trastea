import Link from "next/link";
import { ArrowRight, Brain, Flame, GraduationCap, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLesson, getOrderedLessons } from "@/lib/content/loader";
import { getDashboardData, getUserContext, type DashboardData } from "@/lib/queries";

const EMPTY: DashboardData = {
  streak: 0,
  weekMinutes: 0,
  sessionsThisWeek: 0,
  latestBpms: [],
  doneLessons: 0,
};

export default async function DashboardPage() {
  const ctx = await getUserContext();
  const data = ctx.userId ? await getDashboardData(ctx.userId) : EMPTY;

  const ordered = getOrderedLessons();
  const currentSlug = ctx.profile?.current_lesson_slug ?? ordered[0]?.frontmatter.slug;
  const current = currentSlug ? getLesson(currentSlug) : null;
  const totalLessons = ordered.length;
  const needsOnboarding = ctx.userId !== null && !ctx.profile?.current_lesson_slug;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {ctx.profile?.display_name
              ? `Hola, ${ctx.profile.display_name}`
              : "Hola 👋"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {data.streak > 0
              ? "La racha sigue viva. A por hoy."
              : "El mejor día para practicar es hoy."}
          </p>
        </div>
      </div>

      {needsOnboarding && (
        <Card className="mt-6 border-primary/40">
          <CardHeader>
            <CardTitle>Empecemos por el principio</CardTitle>
            <CardDescription>
              Cuéntanos tu nivel y te asignamos tu punto de partida en el curso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/onboarding">
                Hacer onboarding <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sesión de hoy */}
      {current && (
        <Card className="mt-6 bg-gradient-to-br from-card to-accent/40">
          <CardHeader>
            <CardDescription>Sesión de hoy</CardDescription>
            <CardTitle className="text-2xl">{current.frontmatter.title}</CardTitle>
            <CardDescription>
              🎯 {current.frontmatter.goal} · {current.frontmatter.duration_min} min
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 text-base">
              <Link href="/hoy">
                Practicar ahora <ArrowRight aria-hidden />
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              {current.frontmatter.blocks.length} bloques
            </span>
          </CardContent>
        </Card>
      )}

      {/* Métricas */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Flame className="size-4 text-primary" aria-hidden /> Racha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="display-number text-4xl">{data.streak}</div>
            <p className="text-xs text-muted-foreground">días seguidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="display-number text-4xl">{data.weekMinutes}</div>
            <p className="text-xs text-muted-foreground">
              min en {data.sessionsThisWeek} sesiones
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Curso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="display-number text-4xl">
              {data.doneLessons}
              <span className="text-xl text-muted-foreground">/{totalLessons}</span>
            </div>
            <p className="text-xs text-muted-foreground">lecciones completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Últimos bpm</CardDescription>
          </CardHeader>
          <CardContent>
            {data.latestBpms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay registros: salen del player de lección.
              </p>
            ) : (
              <ul className="space-y-1">
                {data.latestBpms.slice(0, 3).map((r) => (
                  <li
                    key={r.exercise_slug}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      {r.exercise_slug}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {r.bpm}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <h2 className="mt-8 text-lg font-medium">Accesos rápidos</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button asChild variant="outline" className="h-auto justify-start p-4">
          <Link href="/metronomo">
            <Timer className="size-5 text-primary" aria-hidden />
            <span className="flex flex-col items-start">
              <span>Metrónomo</span>
              <span className="text-xs text-muted-foreground">
                Espacio para arrancar, flechas para el tempo
              </span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start p-4">
          <Link href="/curso">
            <GraduationCap className="size-5 text-primary" aria-hidden />
            <span className="flex flex-col items-start">
              <span>Curso</span>
              <span className="text-xs text-muted-foreground">
                Módulos, semanas y lecciones
              </span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start p-4">
          <Link href="/entrenar">
            <Brain className="size-5 text-primary" aria-hidden />
            <span className="flex flex-col items-start">
              <span>Entrenar</span>
              <span className="text-xs text-muted-foreground">
                Notas del mástil, 5 minutos
              </span>
            </span>
          </Link>
        </Button>
      </div>
    </main>
  );
}
