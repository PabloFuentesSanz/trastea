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
import { getExercises, getLesson } from "@/lib/content/loader";
import {
  getBpmRecords,
  getPracticeCalendar,
  getRecentSessions,
  getUserContext,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Progreso" };

/** semanas que enseña el calendario: medio año cabe sin agobiar en móvil */
const WEEKS = 26;

export default async function ProgresoPage() {
  const ctx = await getUserContext();
  const [records, sessions, calendar] = ctx.userId
    ? await Promise.all([
        getBpmRecords(ctx.userId),
        getRecentSessions(ctx.userId),
        getPracticeCalendar(ctx.userId, WEEKS),
      ])
    : [[], [], []];

  const today = new Date().toISOString().slice(0, 10);

  const titles = Object.fromEntries(
    getExercises().map((e) => [e.frontmatter.slug, e.frontmatter.title]),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Progreso</h1>
      <p className="mt-1 text-muted-foreground">
        Lo que se mide, mejora. Lo que no, se estanca (otra vez).
      </p>

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
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {lesson?.frontmatter.title ?? s.lesson_slug ?? "Sesión libre"}
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
