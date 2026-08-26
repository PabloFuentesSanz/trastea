import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { getSongs } from "@/lib/content/loader";

export const metadata: Metadata = { title: "Canciones" };

export default function CancionesPage() {
  const songs = [...getSongs()].sort(
    (a, b) =>
      a.frontmatter.level - b.frontmatter.level ||
      a.frontmatter.title.localeCompare(b.frontmatter.title, "es"),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Canciones</h1>
      <p className="mt-1 text-muted-foreground">
        El repertorio del curso: cada canción está aquí por una razón pedagógica
        concreta, no de relleno.
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {songs.map(({ frontmatter: song }) => (
          <li key={song.slug}>
            <Link
              href={`/canciones/${song.slug}`}
              className="flex h-full flex-col gap-1.5 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-secondary"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-medium">{song.title}</span>
                <Badge variant="outline" className="shrink-0">
                  N{song.level}
                </Badge>
              </span>
              <span className="text-sm text-muted-foreground">{song.artist}</span>
              <span className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{song.style}</Badge>
                <Badge variant="secondary" className="font-mono">
                  {song.key}
                </Badge>
              </span>
              <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {song.purpose}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
