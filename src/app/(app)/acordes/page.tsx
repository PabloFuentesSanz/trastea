import type { Metadata } from "next";
import {
  ChordExplorer,
  type ChordView,
  type InversionFilter,
} from "@/components/fretboard/chord-explorer";
import type { ChordDiagramLabels } from "@/components/fretboard/chord-diagram";
import { PRACTICAL_ROOTS } from "@/lib/music/notes";

export const metadata: Metadata = { title: "Acordes" };

export default async function AcordesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;

  const rawRoot = get("root") ?? "C";
  const root = PRACTICAL_ROOTS.includes(rawRoot) ? rawRoot : "C";
  const view: ChordView = get("view") === "triads" ? "triads" : "chords";
  const inv: InversionFilter = get("inv") === "root" ? "root" : "all";
  const rawLabels = get("labels");
  const labels: ChordDiagramLabels =
    rawLabels === "note" || rawLabels === "none" ? rawLabels : "interval";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Acordes</h1>
      <p className="mt-1 text-muted-foreground">
        Todas las formas tocables del acorde por el diapasón: abiertas, cejilla,
        inversiones y tríadas por grupos de cuerdas.
      </p>
      <div className="mt-6">
        <ChordExplorer
          initial={{
            root,
            type: get("type") ?? "major",
            view,
            inv,
            set: get("set") ?? "all",
            labels,
          }}
        />
      </div>
    </main>
  );
}
