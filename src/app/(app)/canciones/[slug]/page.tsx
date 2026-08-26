import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ListMusic, Play, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mdx } from "@/components/content/mdx";
import {
  getSong,
  getSongLessons,
  getSongs,
  getWikiArticle,
} from "@/lib/content/loader";

export function generateStaticParams() {
  return getSongs().map((s) => ({ slug: s.frontmatter.slug }));
}

export default async function CancionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getSong(slug);
  if (!entry) notFound();
  const song = entry.frontmatter;
  const lessons = getSongLessons(slug);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href="/canciones" className="hover:text-foreground">
          Canciones
        </Link>{" "}
        / {song.style}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{song.title}</h1>
      <p className="mt-1 text-muted-foreground">{song.artist}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{song.style}</Badge>
        <Badge variant="secondary" className="font-mono">
          Tono: {song.key}
        </Badge>
        <Badge variant="outline">Nivel {song.level}</Badge>
      </div>

      <p className="mt-4 rounded-lg border border-primary/30 bg-accent/40 p-3 text-sm">
        🎯 <strong>Por qué está en el curso:</strong> {song.purpose}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {song.youtube_url && (
          <Button asChild variant="outline" size="sm">
            <a href={song.youtube_url} target="_blank" rel="noreferrer">
              <Video aria-hidden /> Grabación de referencia
            </a>
          </Button>
        )}
        {song.backing_track_url && (
          <Button asChild variant="outline" size="sm">
            <a href={song.backing_track_url} target="_blank" rel="noreferrer">
              <Play aria-hidden /> Backing track
            </a>
          </Button>
        )}
        {song.external_tab_url && (
          <Button asChild variant="outline" size="sm">
            <a href={song.external_tab_url} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden /> Buscar la tab
            </a>
          </Button>
        )}
      </div>

      {entry.body.trim() && <Mdx source={entry.body} className="mt-6" />}

      {song.wiki_refs.length > 0 && (
        <>
          <Separator className="my-8" />
          <section aria-label="Teoría relacionada">
            <h2 className="text-sm font-medium text-muted-foreground">
              Teoría relacionada
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {song.wiki_refs.map((ref) => (
                <Link key={ref} href={`/wiki/${ref}`}>
                  <Badge variant="secondary">
                    {getWikiArticle(ref)?.frontmatter.title ?? ref}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {lessons.length > 0 && (
        <section aria-label="Aparece en" className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ListMusic className="size-4" aria-hidden /> Aparece en estas lecciones
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {lessons.map((lesson) => (
              <li key={lesson.frontmatter.slug}>
                <Link
                  href={`/curso/${lesson.moduleSlug}/${lesson.frontmatter.slug}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {lesson.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
