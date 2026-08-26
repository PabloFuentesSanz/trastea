import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getCourse } from "@/lib/content/loader";
import { getLessonProgressMap, getUserContext } from "@/lib/queries";

export const metadata: Metadata = { title: "Curso" };

export default async function CursoPage() {
  const ctx = await getUserContext();
  const progress = ctx.userId
    ? await getLessonProgressMap(ctx.userId)
    : new Map<string, { status: string }>();
  const modules = getCourse();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Curso</h1>
      <p className="mt-1 text-muted-foreground">
        Módulos → semanas → lecciones-día. Cada día, 40 minutos con propósito.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {modules.map((mod) => {
          const lessons = mod.weeks.flatMap((w) => w.lessons);
          const done = lessons.filter(
            (l) => progress.get(l.frontmatter.slug)?.status === "done",
          ).length;
          const isPlaceholder = mod.frontmatter.placeholder;

          return (
            <Card key={mod.frontmatter.slug} className={isPlaceholder ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl">
                    {isPlaceholder ? (
                      <span className="flex items-center gap-2">
                        <Lock className="size-4" aria-hidden />
                        {mod.frontmatter.title}
                      </span>
                    ) : (
                      <Link
                        href={`/curso/${mod.frontmatter.slug}`}
                        className="hover:text-primary"
                      >
                        {mod.frontmatter.title}
                      </Link>
                    )}
                  </CardTitle>
                  <Badge variant="outline">{mod.frontmatter.level}</Badge>
                </div>
                <CardDescription>{mod.frontmatter.summary}</CardDescription>
              </CardHeader>
              {!isPlaceholder && (
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={lessons.length ? (done / lessons.length) * 100 : 0}
                      className="h-2"
                      aria-label={`${done} de ${lessons.length} lecciones completadas`}
                    />
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {done}/{lessons.length}
                    </span>
                  </div>
                  <Link
                    href={`/curso/${mod.frontmatter.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-primary"
                  >
                    Ver semanas <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </CardContent>
              )}
              {isPlaceholder && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">Próximamente.</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}
