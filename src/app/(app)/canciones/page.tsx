import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { SongBrowser } from "@/components/content/song-browser";
import { getSongs } from "@/lib/content/loader";
import { toSongCard, type SongCard } from "@/lib/content/song-filter";

export const metadata: Metadata = { title: "Canciones" };

export default function CancionesPage() {
  const songs: SongCard[] = getSongs().map((s) => toSongCard(s.frontmatter));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Canciones</h1>
      <p className="mt-1 text-muted-foreground">
        {songs.length} canciones, cada una con una razón para estar aquí. Filtra por lo
        que quieras practicar hoy: una técnica, un estilo, un nivel — o directamente por
        los acordes que ya te sabes.
      </p>
      <Suspense fallback={<Skeleton className="mt-6 h-96 w-full" />}>
        <SongBrowser songs={songs} />
      </Suspense>
    </main>
  );
}
