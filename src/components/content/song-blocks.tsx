import Link from "next/link";
import type { ReactNode } from "react";
import { songsterrLink, youtubeLink } from "@/lib/content/song-links";
import { cn } from "@/lib/utils";
import { num, type Numerico } from "./music-blocks";

/**
 * Bloque de repertorio. La regla del contenido: nunca una canción suelta y
 * nunca "escucha esto" — siempre varias opciones y, en cada una, qué parte
 * se practica y cómo.
 *
 *   <Canciones titulo="Dónde practicar la pentatónica menor">
 *     <Cancion
 *       titulo="Stairway to Heaven" artista="Led Zeppelin" nivel={3} desde="5:56"
 *       que="El solo: pentatónica de La menor en la caja del traste 5, de principio a fin."
 *       como="Saca solo las cuatro primeras frases a 60 bpm. Busca el vibrato del final de cada frase, no la velocidad."
 *     />
 *   </Canciones>
 */
export function Canciones({
  titulo,
  children,
}: {
  titulo?: string;
  children: ReactNode;
}) {
  return (
    <section className="not-prose my-6">
      {titulo && <h3 className="mb-2 text-base font-medium">🎸 {titulo}</h3>}
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

const NIVEL_LABEL = ["", "fácil", "asequible", "exigente", "difícil", "muy difícil"];

export function Cancion({
  titulo,
  artista,
  nivel,
  desde,
  que,
  como,
  bpm,
  songsterr,
  youtube,
  /** slug de /canciones si la tenemos ficha propia */
  slug,
}: {
  titulo: string;
  artista?: string;
  nivel?: Numerico;
  /** momento donde empieza lo que interesa, "5:56" o "compás 33" */
  desde?: string;
  /** qué se practica exactamente */
  que: string;
  /** cómo se practica */
  como?: string;
  bpm?: Numerico;
  songsterr?: string;
  youtube?: string;
  slug?: string;
}) {
  const nivelNum = num(nivel);
  const bpmNum = num(bpm);
  const ref = { title: titulo, artist: artista, songsterr, youtube };
  const tab = songsterrLink(ref);
  const video = youtubeLink(ref);

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium">
          {slug ? (
            <Link href={`/canciones/${slug}`} className="no-underline hover:underline">
              {titulo}
            </Link>
          ) : (
            titulo
          )}
        </span>
        {artista && <span className="text-sm text-muted-foreground">{artista}</span>}
        {nivelNum !== undefined && (
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">
            {NIVEL_LABEL[nivelNum] ?? `nivel ${nivelNum}`}
          </span>
        )}
        {desde && (
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
            {desde}
          </span>
        )}
        {bpmNum !== undefined && (
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
            {bpmNum} bpm
          </span>
        )}
      </div>

      <p className="mt-1.5 text-sm">
        <span className="text-muted-foreground">Qué: </span>
        {que}
      </p>
      {como && (
        <p className="mt-1 text-sm">
          <span className="text-muted-foreground">Cómo: </span>
          {como}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <ExternalLink href={tab.href}>
          {tab.kind === "tab" ? "Tab en Songsterr" : "Buscar tab en Songsterr"}
        </ExternalLink>
        <ExternalLink href={video.href}>
          {video.kind === "tab" ? "Escuchar" : "Buscar en YouTube"}
        </ExternalLink>
      </div>
    </li>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-primary no-underline hover:underline",
      )}
    >
      {children} <span aria-hidden>↗</span>
    </a>
  );
}
