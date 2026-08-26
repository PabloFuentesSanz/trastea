import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Mdx } from "@/components/content/mdx";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { LessonBlockCard } from "@/components/lesson/lesson-block-card";
import {
  getCourse,
  getExercise,
  getLesson,
  getModule,
  getSong,
  getWikiArticle,
  nextLessonSlug,
} from "@/lib/content/loader";
import { getLessonProgress, getUserContext } from "@/lib/queries";

export function generateStaticParams() {
  return getCourse().flatMap((m) =>
    m.weeks.flatMap((w) =>
      w.lessons.map((l) => ({
        modulo: m.frontmatter.slug,
        leccion: l.frontmatter.slug,
      })),
    ),
  );
}

export default async function LeccionPage({
  params,
}: {
  params: Promise<{ modulo: string; leccion: string }>;
}) {
  const { modulo, leccion } = await params;
  const mod = getModule(modulo);
  const lesson = getLesson(leccion);
  if (!mod || !lesson || lesson.moduleSlug !== modulo) notFound();

  const ctx = await getUserContext();
  const progress = ctx.userId ? await getLessonProgress(ctx.userId, leccion) : null;

  const next = nextLessonSlug(leccion);
  const nextLesson = next ? getLesson(next) : null;
  const nextHref = nextLesson
    ? `/curso/${nextLesson.moduleSlug}/${nextLesson.frontmatter.slug}`
    : null;

  const breadcrumb = `${mod.frontmatter.title} · Semana ${lesson.weekOrder} · Día ${lesson.frontmatter.order}`;

  return (
    <main className="w-full px-4 pb-10">
      <LessonPlayer
        lesson={lesson.frontmatter}
        initialDoneBlocks={progress?.blocks_done ?? []}
        alreadyCompleted={progress?.status === "done"}
        demo={!ctx.userId}
        breadcrumb={breadcrumb}
        nextHref={nextHref}
      >
        {lesson.body.trim() && <Mdx source={lesson.body} className="text-[0.95rem]" />}

        {lesson.frontmatter.blocks.map((block) => {
          const exercise = block.exercise ? getExercise(block.exercise) : null;
          const song = block.song ? getSong(block.song) : null;
          const resolvedTitle =
            exercise?.frontmatter.title ?? song?.frontmatter.title ?? null;

          return (
            <LessonBlockCard
              key={block.id}
              lessonSlug={lesson.frontmatter.slug}
              block={block}
              resolvedTitle={resolvedTitle}
            >
              {exercise && (
                <div className="mt-3 rounded-lg border bg-background/40 p-4">
                  <Mdx source={exercise.body} className="prose-sm" />
                </div>
              )}
              {song && (
                <p className="mt-3 text-sm text-muted-foreground">
                  🎵{" "}
                  <Link
                    href={`/canciones/${song.frontmatter.slug}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {song.frontmatter.title}
                  </Link>{" "}
                  — {song.frontmatter.artist}
                  {song.frontmatter.external_tab_url && (
                    <>
                      {" · "}
                      <a
                        href={song.frontmatter.external_tab_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        tab externa
                      </a>
                    </>
                  )}
                </p>
              )}
            </LessonBlockCard>
          );
        })}

        {lesson.frontmatter.wiki_refs.length > 0 && (
          <section aria-label="Teoría relacionada" className="mt-2">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpen className="size-4" aria-hidden /> Teoría de hoy
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {lesson.frontmatter.wiki_refs.map((slug) => {
                const article = getWikiArticle(slug);
                return (
                  <Link
                    key={slug}
                    href={`/wiki/${slug}`}
                    className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {article?.frontmatter.title ?? slug}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </LessonPlayer>
    </main>
  );
}
