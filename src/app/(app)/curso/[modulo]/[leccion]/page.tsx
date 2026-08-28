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
  getSongs,
  getTerminosNuevos,
  getWikiArticle,
  nextLessonSlug,
} from "@/lib/content/loader";
import { getLessonProgress, getUserContext } from "@/lib/queries";
import {
  alternativasParaPracticar,
  enlaceDeCatalogo,
} from "@/lib/content/song-alternatives";
import { toSongCard, type SongCard } from "@/lib/content/song-filter";
import { drillsForSkills } from "@/lib/train/catalog";
import { isTrainSkill, levelFromWeek } from "@/lib/train/taxonomy";

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
  const terminos = getTerminosNuevos(leccion);
  const nextHref = nextLesson
    ? `/curso/${nextLesson.moduleSlug}/${nextLesson.frontmatter.slug}`
    : null;

  const breadcrumb = `${mod.frontmatter.title} · Semana ${lesson.weekOrder} · Día ${lesson.frontmatter.order}`;

  // Alternativas del catálogo para cada canción del día: mismas técnicas y
  // nunca por encima del techo del módulo.
  const catalogo = getSongs().map((s) => toSongCard(s.frontmatter));
  const alternativas = new Map<string, { lista: SongCard[]; href: string }>();
  for (const block of lesson.frontmatter.blocks) {
    const suya = block.song ? getSong(block.song) : null;
    if (!suya) continue;
    const tecnicas = suya.frontmatter.techniques;
    alternativas.set(block.id, {
      lista: alternativasParaPracticar(catalogo, {
        tecnicas,
        nivelMaximo: mod.frontmatter.max_song_level,
        excluir: suya.frontmatter.slug,
        estilo: suya.frontmatter.style,
      }),
      href: enlaceDeCatalogo(tecnicas, mod.frontmatter.max_song_level),
    });
  }

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

          // el entrenamiento no se escribe en la lección: sale de lo que
          // entrena el ejercicio y del nivel que le toca a esta semana
          const drill = exercise
            ? drillsForSkills(exercise.frontmatter.trains.filter(isTrainSkill))[0]
            : undefined;
          const nivel = levelFromWeek(lesson.weekOrder);
          const train = drill
            ? {
                href: `/entrenar/${drill.slug}?nivel=${
                  drill.levels.some((l) => l.level === nivel)
                    ? nivel
                    : drill.levels[drill.levels.length - 1].level
                }`,
                title: drill.title,
              }
            : null;

          return (
            <LessonBlockCard
              key={block.id}
              lessonSlug={lesson.frontmatter.slug}
              block={block}
              resolvedTitle={resolvedTitle}
              train={train}
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
              {/* si la del curso no engancha, otras que entrenan lo mismo: el
                  catálogo tiene 304 y las lecciones apuntaban a 16 */}
              {song && alternativas.get(block.id)?.lista.length ? (
                <div className="mt-2 text-sm">
                  <p className="text-muted-foreground">
                    ¿No te dice nada? Estas entrenan lo mismo:
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {alternativas.get(block.id)?.lista.map((alt) => (
                      <li key={alt.slug}>
                        <Link
                          href={`/canciones/${alt.slug}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {alt.title}
                        </Link>{" "}
                        <span className="text-muted-foreground text-xs">
                          — {alt.artist}
                        </span>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={alternativas.get(block.id)?.href ?? "/canciones"}
                        className="text-muted-foreground text-xs underline-offset-4 hover:underline"
                      >
                        ver todas
                      </Link>
                    </li>
                  </ul>
                </div>
              ) : null}
            </LessonBlockCard>
          );
        })}

        {terminos.length > 0 && (
          <section aria-label="Palabras nuevas" className="mt-2">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpen className="size-4" aria-hidden /> Palabras que estrenas hoy
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {terminos.map((t) => (
                <Link
                  key={t.termino}
                  href={t.wiki ? `/wiki/${t.wiki}` : "/wiki/glosario"}
                  className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {t.termino}
                </Link>
              ))}
            </div>
          </section>
        )}

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
