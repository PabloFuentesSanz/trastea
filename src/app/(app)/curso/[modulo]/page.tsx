import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Circle, Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mdx } from "@/components/content/mdx";
import { getCourse, getModule, getSemanasDelModulo } from "@/lib/content/loader";
import { WEEK_STYLE_LABEL } from "@/lib/content/schemas";
import { Badge } from "@/components/ui/badge";
import { getLessonProgressMap, getUserContext } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { tituloSinDia } from "@/lib/content/lesson-title";

export function generateStaticParams() {
  return getCourse().map((m) => ({ modulo: m.frontmatter.slug }));
}

/** "3 del Módulo A — Cimientos", para decir dónde cae una semana de estilo. */
function ancla(weekSlug: string): string {
  for (const m of getCourse()) {
    const w = m.weeks.find((week) => week.frontmatter.slug === weekSlug);
    if (w) return `${w.frontmatter.order} (${m.frontmatter.title})`;
  }
  return weekSlug;
}

export default async function ModuloPage({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo } = await params;
  const mod = getModule(modulo);
  if (!mod || mod.frontmatter.placeholder) notFound();

  const ctx = await getUserContext();
  const progress = ctx.userId
    ? await getLessonProgressMap(ctx.userId)
    : new Map<string, { status: string }>();

  // un módulo del tronco enseña sus semanas con las de estilo intercaladas
  // donde se estudian; el módulo de las semanas de estilo enseña solo las suyas
  const deEstilos = mod.weeks.every((w) => w.frontmatter.after !== undefined);
  const semanas = deEstilos
    ? mod.weeks.map((week) => ({ week, moduleSlug: mod.frontmatter.slug }))
    : getSemanasDelModulo(modulo);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href="/curso" className="hover:text-foreground">
          Curso
        </Link>{" "}
        / {mod.frontmatter.title}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {mod.frontmatter.title}
      </h1>

      <Mdx source={mod.body} className="mt-4 text-[0.95rem]" />

      <h2 className="mt-6 font-medium">Objetivos del módulo</h2>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {mod.frontmatter.goals.map((goal) => (
          <li key={goal} className="flex gap-2">
            <span aria-hidden className="text-primary">
              ◆
            </span>
            {goal}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-6">
        {semanas.map(({ week, moduleSlug }) => (
          <section key={week.frontmatter.slug} aria-label={week.frontmatter.title}>
            <h2 className="flex flex-wrap items-center gap-2 text-lg font-medium">
              {week.frontmatter.estilo ? (
                <>
                  <Badge className="font-normal">
                    {WEEK_STYLE_LABEL[week.frontmatter.estilo]}
                  </Badge>
                  {week.frontmatter.title}
                </>
              ) : (
                `Semana ${week.frontmatter.order}: ${week.frontmatter.title}`
              )}
            </h2>
            {/* el foco es una frase, no una etiqueta: en un badge de una sola
                línea empujaba la página 300 px fuera de la pantalla */}
            <p className="mt-1 text-xs font-medium tracking-wide text-primary">
              {week.frontmatter.focus}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {week.frontmatter.summary}
            </p>
            {deEstilos && week.frontmatter.after && (
              <p className="mt-1 text-xs text-muted-foreground">
                Se estudia justo después de la semana {ancla(week.frontmatter.after)}.
              </p>
            )}
            {/* la presentación de la semana: de qué va, por qué, y qué vas a
                saber hacer al acabarla. Sin esto se entra a los cinco días
                sueltos sin saber a dónde llevan */}
            {week.body.trim() && (
              <Mdx source={week.body} className="mt-3 text-[0.95rem]" />
            )}
            <ol className="mt-3 flex flex-col gap-1.5">
              {week.lessons.map((lesson) => {
                const status = progress.get(lesson.frontmatter.slug)?.status;
                const done = status === "done";
                const inProgress = status === "in_progress";
                return (
                  <li key={lesson.frontmatter.slug}>
                    <Link
                      href={`/curso/${moduleSlug}/${lesson.frontmatter.slug}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-secondary",
                        done && "border-success/40",
                      )}
                    >
                      {done ? (
                        <Check className="size-4 shrink-0 text-success" aria-hidden />
                      ) : inProgress ? (
                        <Play className="size-4 shrink-0 text-primary" aria-hidden />
                      ) : (
                        <Circle
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        {/* el "día N" va en la línea de abajo: en el título
                            se comía una línea entera del móvil */}
                        <span className={cn("block line-clamp-2", done && "opacity-70")}>
                          {tituloSinDia(lesson.frontmatter.title)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Día {lesson.frontmatter.order} ·{" "}
                          {lesson.frontmatter.duration_min} min ·{" "}
                          {lesson.frontmatter.goal}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {mod.frontmatter.assessment && (
        <section
          aria-label="Evaluación del módulo"
          className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/40 bg-accent/30 p-4"
        >
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-medium">
              <Trophy className="size-4 text-primary" aria-hidden />
              Evaluación del módulo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quiz, checklist de autoevaluación y una grabación para comparar dentro de
              unos meses.
            </p>
          </div>
          <Button asChild>
            <Link href={`/curso/${mod.frontmatter.slug}/evaluacion`}>
              Ir a la evaluación <ArrowRight aria-hidden />
            </Link>
          </Button>
        </section>
      )}
    </main>
  );
}
