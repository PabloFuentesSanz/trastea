import type { Metadata } from "next";
import { FormulaExplorer } from "@/components/fretboard/formula-explorer";
import type { FretboardLabels } from "@/components/fretboard/fretboard";
import { SCALES } from "@/data/scales";
import { PRACTICAL_ROOTS } from "@/lib/music/notes";

export const metadata: Metadata = { title: "Escalas" };

const LABELS = new Set(["note", "solfege", "interval", "none"]);

export default async function EscalasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawRoot = typeof params.root === "string" ? params.root : "C";
  const root = PRACTICAL_ROOTS.includes(rawRoot) ? rawRoot : "C";
  const type = typeof params.type === "string" ? params.type : "major";
  const rawLabels = typeof params.labels === "string" ? params.labels : "note";
  const labels = (LABELS.has(rawLabels) ? rawLabels : "note") as FretboardLabels;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Escalas</h1>
      <p className="mt-1 text-muted-foreground">
        Cualquier escala, cualquier tono, deletreada como manda la tonalidad.
      </p>
      <div className="mt-6">
        <FormulaExplorer
          kind="scale"
          basePath="/escalas"
          options={Object.values(SCALES)}
          initialRoot={root}
          initialType={type}
          initialLabels={labels}
        />
      </div>
    </main>
  );
}
