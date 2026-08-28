import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BpmChart } from "@/components/progress/bpm-chart";
import { PracticeHeatmap } from "@/components/progress/practice-heatmap";
import { getCourse, getExercises, getLesson } from "@/lib/content/loader";
import { tituloSinDia } from "@/lib/content/lesson-title";
import { GoalList } from "@/components/progress/goal-list";
import { resumenDeMetas } from "@/lib/progress/goals";
import { mapaDelCurso } from "@/lib/progress/course-map";
import { queTocaAhora } from "@/lib/progress/next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getBpmRecords,
  getLessonProgressMap,
  getPracticeCalendar,
  getRecentSessions,
  getMetasDeBpm,
  getRepasosVencidos,
  getUserContext,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Progreso" };

/** semanas que enseña el calendario: medio año cabe sin agobiar en móvil */
const WEEKS = 26;

export default async function ProgresoPage() {
  const ctx = await getUserContext();
  const ejerciciosConMeta = getExercises().map((e) => ({
    slug: e.frontmatter.slug,
    titulo: e.frontmatter.title,
    objetivo: e.frontmatter.bpm_target,
  }));

  const [records, sessions, calendar, progreso, repasosVencidos, metas] = ctx.userId
    ? await Promise.all([
        getBpmRecords(ctx.userId),
        getRecentSessions(ctx.userId),
        getPracticeCalendar(ctx.userId, WEEKS),
        getLessonProgressMap(ctx.userId),
        getRepasosVencidos(ctx.userId),
        getMetasDeBpm(ctx.userId, ejerciciosConMeta),
      ])
    : [[], [], [], new Map(), 0, await getMetasDeBpm(null, ejerciciosConMeta)];

  const today = new Date().toISOString().slice(0, 10);
  const ejercicios = getExercises();

  const titles = Object.fromEntries(
    ejercicios.map((e) => [e.frontmatter.slug, e.frontmatter.title]),
  );

  // dónde estás: la primera lección sin hacer manda
  const hechas = new Set(
    [...progreso.entries()]
      .filter(([, row]) => row.status === "done")
      .map(([slug]) => slug),
  );
  const mapa = mapaDelCurso(
    getCourse().flatMap((m) =>
      m.weeks.flatMap((w) =>
        w.lessons.map((l) => ({
          slug: l.frontmatter.slug,
          moduloSlug: m.frontmatter.slug,
          moduloTitulo: m.frontmatter.title,
          semana: w.frontmatter.order,
        })),
      ),
    ),
    hechas,
  );

  const resumen = resumenDeMetas(metas);

  const siguiente = mapa.siguiente ? getLesson(mapa.siguiente.slug) : null;
  const acciones = queTocaAhora({
    siguienteLeccion:
      mapa.siguiente && siguiente
        ? {
            slug: mapa.siguiente.slug,
            titulo: tituloSinDia(siguiente.frontmatter.title),
            href: `/curso/${mapa.siguiente.moduloSlug}/${mapa.siguiente.slug}`,
          }
        : null,
    repasosVencidos,
    metas,
    moduloParaEvaluar: mapa.moduloCompleto,
    diasSinPracticar: 0,
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Progreso</h1>
      <p className="mt-1 text-muted-foreground">
        Lo que se mide, mejora. Lo que no, se estanca (otra vez).
      </p>

      {/* Qué toca ahora: la respuesta a "me siento con la guitarra, ¿y ahora?" */}
      {acciones.length > 0 && (
        <section aria-label="Qué toca ahora">
          <Card className="mt-6 border-primary/40 bg-accent/20">
            <CardHeader>
              <CardTitle>Qué toca ahora</CardTitle>
              <CardDescription>
                Sale de lo que llevas hecho: no hay nada que apuntar a mano.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {acciones.map((a) => (
                  <li key={a.tipo}>
                    <Link
                      href={a.href}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-secondary"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs uppercase tracking-wide text-primary">
                          {a.titulo}
                        </span>
                        <span className="mt-0.5 block text-sm">{a.texto}</span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Dónde estás: el arco entero del curso */}
      <section aria-label="Dónde estás">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dónde estás</CardTitle>
            <CardDescription>
              {mapa.hechas} de {mapa.total} lecciones del curso
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mapa.modulos.map((m) => {
              const pct = m.total === 0 ? 0 : Math.round((m.hechas / m.total) * 100);
              return (
                <div key={m.slug}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <Link href={`/curso/${m.slug}`} className="hover:text-primary">
                      {m.titulo}
                    </Link>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {m.hechas}/{m.total}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"
                    role="img"
                    aria-label={`${pct}% del módulo`}
                  >
                    <div
                      className={m.completo ? "h-full bg-success" : "h-full bg-primary"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {mapa.siguiente && siguiente && (
              <Button asChild variant="secondary" className="mt-1 self-start">
                <Link href={`/curso/${mapa.siguiente.moduloSlug}/${mapa.siguiente.slug}`}>
                  Seguir por {tituloSinDia(siguiente.frontmatter.title)}{" "}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Metas: los bpm que pide el curso, con lo que llevas */}
      <section aria-label="Objetivos de velocidad">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Objetivos de velocidad</CardTitle>
            <CardDescription>
              {resumen.conseguidas} de {resumen.total} conseguidos. Cada ejercicio del
              curso pide un bpm: esto es lo que llevas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoalList metas={metas} />
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Calendario de práctica</CardTitle>
          <CardDescription>
            Medio año de un vistazo. Cada casilla, un día.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PracticeHeatmap sessions={calendar} today={today} weeks={WEEKS} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Evolución de bpm</CardTitle>
          <CardDescription>Por ejercicio, cada punto es un registro.</CardDescription>
        </CardHeader>
        <CardContent>
          <BpmChart records={records} titles={titles} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sesiones recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay sesiones. Al completar una lección se guarda sola.
            </p>
          ) : (
            <ul className="divide-y">
              {sessions.map((s) => {
                const lesson = s.lesson_slug ? getLesson(s.lesson_slug) : null;
                return (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-24 shrink-0 text-sm tabular-nums text-muted-foreground">
                      {s.date}
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 text-sm">
                      {lesson
                        ? tituloSinDia(lesson.frontmatter.title)
                        : (s.lesson_slug ?? "Sesión libre")}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {s.duration_min}&#8217;
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
