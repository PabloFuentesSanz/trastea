import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Gauge, Guitar, ListMusic, Play, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mdx } from "@/components/content/mdx";
import { ChordChip } from "@/components/content/chord-chip";
import { getSong, getSongLessons, getSongs, getWikiArticle } from "@/lib/content/loader";
import { relatedSongs, toSongCard } from "@/lib/content/song-filter";
import { shapeRoot } from "@/lib/content/capo";
import { getTuning } from "@/data/tunings";
import {
  SONG_LEVEL_LABEL,
  SONG_STYLE_LABEL,
  collectionLabel,
  techniqueLabel,
} from "@/lib/content/song-taxonomy";

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
  const similar = relatedSongs(
    getSongs().map((s) => toSongCard(s.frontmatter)),
    toSongCard(song),
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href="/canciones" className="hover:text-foreground">
          Canciones
        </Link>{" "}
        /{" "}
        <Link
          href={`/canciones?estilo=${song.style}`}
          className="hover:text-foreground hover:underline"
        >
          {SONG_STYLE_LABEL[song.style]}
        </Link>
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{song.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {song.artist}
        {song.year ? ` · ${song.year}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          Nivel {song.level} · {SONG_LEVEL_LABEL[song.level]}
        </Badge>
        <Badge variant="secondary">
          {song.capo ? "Suena en" : "Tono:"} <span className="font-mono">{song.key}</span>
        </Badge>
        {song.capo ? (
          <Badge variant="secondary">
            Capo {song.capo}
            {/* con capo, `key` es lo que suena y las formas son otra cosa:
                decirlo evita que el lector busque las formas de la tonalidad */}
            {song.chords[0] ? ` · formas de ${shapeRoot(song.chords[0])}` : ""}
          </Badge>
        ) : null}
        {/* la afinación abre el afinador ya puesto en ella: es lo primero que
            hay que hacer para tocar el tema, y estaba a cuatro pasos */}
        {song.tuning ? (
          <Badge variant="secondary" asChild>
            <Link href={`/afinador?afinacion=${song.tuning}`}>
              <Guitar className="size-3" aria-hidden />
              {getTuning(song.tuning).name}
            </Link>
          </Badge>
        ) : null}
        {song.tuning_note ? (
          <Badge variant="secondary" title="El afinador todavía no trae esta">
            {song.tuning_note}
          </Badge>
        ) : null}
        {song.bpm ? (
          <Badge variant="secondary" className="tabular-nums">
            {song.bpm} bpm
          </Badge>
        ) : null}
      </div>

      <p className="mt-4 rounded-lg border border-primary/30 bg-accent/40 p-3 text-sm">
        🎯 <strong>Por qué está aquí:</strong> {song.purpose}
      </p>

      <section aria-label="Qué se practica" className="mt-4">
        <h2 className="text-sm font-medium text-muted-foreground">Qué se practica</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {song.techniques.map((technique) => (
            <Link key={technique} href={`/canciones?tecnica=${technique}`}>
              <Badge
                variant="secondary"
                className="hover:bg-primary hover:text-primary-foreground"
              >
                {techniqueLabel(technique)}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      {song.chords.length > 0 && (
        <section aria-label="Acordes que necesitas" className="mt-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Acordes que necesitas
            {song.progression ? ` · ${song.progression}` : ""}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {song.chords.map((chord) => (
              <Badge key={chord} variant="outline" className="font-mono">
                <ChordChip chord={chord} className="no-underline" />
              </Badge>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {song.bpm && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/metronomo?bpm=${song.bpm}`}>
              <Gauge aria-hidden /> Metrónomo a {song.bpm}
            </Link>
          </Button>
        )}
        {song.youtube_url && (
          <Button asChild variant="outline" size="sm">
            <a href={song.youtube_url} target="_blank" rel="noreferrer">
              <Video aria-hidden /> Escuchar la referencia
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

      <section aria-label="Colecciones" className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">Aparece en</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {song.collections.map((collection) => (
            <Link key={collection} href={`/canciones?coleccion=${collection}`}>
              <Badge
                variant="secondary"
                className="hover:bg-primary hover:text-primary-foreground"
              >
                {collectionLabel(collection)}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

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
        <section aria-label="Lecciones" className="mt-6">
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

      {similar.length > 0 && (
        <section aria-label="Canciones parecidas" className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">
            Si te ha gustado esta, sigue por aquí
          </h2>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {similar.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/canciones/${other.slug}`}
                  className="flex flex-col rounded-lg border p-3 transition-colors hover:border-primary/50 hover:bg-secondary"
                >
                  <span className="text-sm font-medium">{other.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {other.artist} · N{other.level}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
