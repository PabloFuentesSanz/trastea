import type { Metadata } from "next";
import { FormulaExplorer } from "@/components/fretboard/formula-explorer";
import type { FretboardLabels } from "@/components/fretboard/fretboard";
import { CHORDS } from "@/data/chords";
import { PRACTICAL_ROOTS } from "@/lib/music/notes";

export const metadata: Metadata = { title: "Acordes" };

const LABELS = new Set(["note", "solfege", "interval", "none"]);

export default async function AcordesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawRoot = typeof params.root === "string" ? params.root : "C";
  const root = PRACTICAL_ROOTS.includes(rawRoot) ? rawRoot : "C";
  const type = typeof params.type === "string" ? params.type : "maj7";
  const rawLabels = typeof params.labels === "string" ? params.labels : "note";
  const labels = (LABELS.has(rawLabels) ? rawLabels : "note") as FretboardLabels;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Acordes</h1>
      <p className="mt-1 text-muted-foreground">
        Las notas del acorde por todo el mástil. Los voicings llegan en la
        siguiente iteración; el esqueleto ya es tuyo.
      </p>
      <div className="mt-6">
        <FormulaExplorer
          kind="chord"
          basePath="/acordes"
          options={Object.values(CHORDS).map((c) => ({
            id: c.id,
            name: `${c.name} (${c.symbol || "maj"})`,
            intervals: c.intervals,
          }))}
          initialRoot={root}
          initialType={type}
          initialLabels={labels}
        />
      </div>
    </main>
  );
}
