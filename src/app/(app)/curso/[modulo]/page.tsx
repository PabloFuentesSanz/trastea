import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Circle, Play, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mdx } from "@/components/content/mdx";
import { getCourse, getModule } from "@/lib/content/loader";
import { getLessonProgressMap, getUserContext } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return getCourse().map((m) => ({ modulo: m.frontmatter.slug }));
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
        {mod.weeks.map((week) => (
          <section key={week.frontmatter.slug} aria-label={week.frontmatter.title}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">
                Semana {week.frontmatter.order}: {week.frontmatter.title}
              </h2>
              <Badge variant="outline">{week.frontmatter.focus}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {week.frontmatter.summary}
            </p>
            <ol className="mt-3 flex flex-col gap-1.5">
              {week.lessons.map((lesson) => {
                const status = progress.get(lesson.frontmatter.slug)?.status;
                const done = status === "done";
                const inProgress = status === "in_progress";
                return (
                  <li key={lesson.frontmatter.slug}>
                    <Link
                      href={`/curso/${mod.frontmatter.slug}/${lesson.frontmatter.slug}`}
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
                        <span className={cn("block truncate", done && "opacity-70")}>
                          {lesson.frontmatter.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
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
