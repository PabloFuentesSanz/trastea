import type { Metadata } from "next";
import { BackingStudio } from "@/components/backing/backing-studio";
import { BACKING_STYLES, type BackingStyle } from "@/lib/backing/groove";
import { getProgression, PROGRESSIONS } from "@/data/progressions";
import { clampBpm } from "@/lib/metronome/pattern";
import { PRACTICAL_ROOTS } from "@/lib/music/notes";

export const metadata: Metadata = { title: "Bases" };

const STYLES = new Set<string>(BACKING_STYLES);

export default async function BasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;

  const progression = getProgression(get("prog") ?? "") ?? PROGRESSIONS[0];

  const rawTono = get("tono");
  const tono = rawTono && PRACTICAL_ROOTS.includes(rawTono) ? rawTono : progression.key;

  const rawEstilo = get("estilo");
  const estilo = (
    rawEstilo && STYLES.has(rawEstilo) ? rawEstilo : progression.style
  ) as BackingStyle;

  const rawBpm = Number(get("bpm"));
  const bpm = Number.isFinite(rawBpm) && rawBpm > 0 ? clampBpm(rawBpm) : progression.bpm;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Bases</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">
        Una base sobre la que tocar: eliges la forma, el tono, el groove y el tempo, y te
        acompaña. Sin descargar nada y sin buscar un backing track en internet.
      </p>
      <div className="mt-8">
        <BackingStudio
          initialProgression={progression.id}
          initialKey={tono}
          initialStyle={estilo}
          initialBpm={bpm}
        />
      </div>
    </main>
  );
}
