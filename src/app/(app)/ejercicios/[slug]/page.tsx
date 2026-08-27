import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mdx } from "@/components/content/mdx";
import { PracticeRunner } from "@/components/train/practice-runner";
import { ExerciseHistoryPanel } from "@/components/train/exercise-history";
import {
  getExercise,
  getExerciseLevel,
  getExerciseUses,
  getExercises,
  getWikiArticle,
} from "@/lib/content/loader";
import { getExerciseHistory, getUserContext } from "@/lib/queries";
import { DRILLS } from "@/lib/train/catalog";
import { TRAIN_LEVEL_LABEL, TRAIN_SKILL_LABEL, isTrainSkill } from "@/lib/train/taxonomy";

/** El historial depende del usuario. */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getExercises().map((e) => ({ slug: e.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exercise = getExercise(slug);
  return { title: exercise ? exercise.frontmatter.title : "Ejercicio" };
}

export default async function EjercicioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exercise = getExercise(slug);
  if (!exercise) notFound();

  const fm = exercise.frontmatter;
  const level = getExerciseLevel(slug);
  const usos = getExerciseUses().get(slug) ?? [];
  const ctx = await getUserContext();
  const history = await getExerciseHistory(ctx.userId, slug);

  // los drills que entrenan alguna de las mismas destrezas: son la versión
  // interactiva de esta ficha, y es donde más rendimiento da el mismo rato
  const propias = new Set(fm.trains);
  const relacionados = DRILLS.filter((d) => d.skills.some((s) => propias.has(s)));

  const bpmStart = fm.bpm_start ?? 60;
  const bpmTarget = fm.bpm_target ?? Math.max(bpmStart, 100);
  const cronometrable = fm.bpm_target !== undefined;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link
        href="/entrenar"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Entrenar
      </Link>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{fm.title}</h1>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant="outline">
          Nivel {level} · {TRAIN_LEVEL_LABEL[level]}
        </Badge>
        {fm.trains.filter(isTrainSkill).map((s) => (
          <Badge key={s} variant="secondary" className="font-normal">
            {TRAIN_SKILL_LABEL[s]}
          </Badge>
        ))}
        {cronometrable && (
          <Badge variant="secondary" className="tabular-nums">
            {bpmStart} → {bpmTarget} bpm
          </Badge>
        )}
      </div>

      {cronometrable ? (
        <PracticeRunner
          exerciseSlug={slug}
          bpmStart={bpmStart}
          bpmTarget={bpmTarget}
          demo={!ctx.userId}
        />
      ) : (
        <p className="text-muted-foreground mt-6 rounded-lg border p-4 text-sm">
          Este ejercicio no va con metrónomo: se hace escuchando o cantando, y no tiene un
          tempo objetivo que perseguir.
        </p>
      )}

      <Separator className="my-8" />

      <article className="prose-trastea">
        <Mdx source={exercise.body} />
      </article>

      {relacionados.length > 0 && (
        <section aria-label="La versión interactiva" className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            La versión interactiva
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Lo mismo que entrena esta ficha, pero preguntándotelo y llevándote la
            cuenta de lo que fallas.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {relacionados.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/entrenar/${d.slug}`}
                  className="hover:bg-accent inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
                >
                  <Dumbbell className="size-3.5" aria-hidden /> {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Separator className="my-8" />

      <section aria-label="Tu historial">
        <h2 className="text-xl font-semibold tracking-tight">Tu historial</h2>
        <ExerciseHistoryPanel history={history} demo={!ctx.userId} />
      </section>

      {usos.length > 0 && (
        <section aria-label="Dónde lo pide el curso" className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Dónde lo pide el curso</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            De aquí sale su nivel: el de la primera semana que lo usa.
          </p>
          <ul className="mt-3 divide-y rounded-lg border">
            {usos.map((u) => (
              <li key={u.lessonSlug} className="flex items-center gap-3 px-3 py-2.5">
                <BookOpen className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span className="text-muted-foreground w-28 shrink-0 text-sm tabular-nums">
                  Semana {u.week} · día {u.day}
                </span>
                <Link
                  href={`/curso/${u.moduleSlug}/${u.lessonSlug}`}
                  className="text-sm hover:underline"
                >
                  {u.lessonTitle}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {fm.links.wiki.length > 0 && (
        <section aria-label="Para leer" className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Para leer</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {fm.links.wiki.map((ref) => {
              const article = getWikiArticle(ref);
              if (!article) return null;
              return (
                <li key={ref}>
                  <Link
                    href={`/wiki/${ref}`}
                    className="hover:bg-accent inline-flex rounded-full border px-3 py-1 text-sm"
                  >
                    {article.frontmatter.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
