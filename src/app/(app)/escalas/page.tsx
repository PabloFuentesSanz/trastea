import type { Metadata } from "next";
import {
  FormulaExplorer,
  type FormulaOption,
  type ScaleView,
} from "@/components/fretboard/formula-explorer";
import type { FretboardLabels } from "@/components/fretboard/fretboard";
import { getScale, SCALES } from "@/data/scales";
import { PRACTICAL_ROOTS } from "@/lib/music/notes";

export const metadata: Metadata = { title: "Escalas" };

const LABELS = new Set(["note", "solfege", "interval", "none"]);
const VIEWS = new Set<ScaleView>(["mastil", "cajas", "cuerdas"]);

/**
 * Las escalas que heredan digitación (el blues, de la pentatónica menor)
 * llevan la fórmula de su madre para que las cajas salgan bien.
 */
const OPTIONS: FormulaOption[] = Object.values(SCALES).map((scale) => ({
  id: scale.id,
  name: scale.name,
  intervals: scale.intervals,
  boxParentIntervals: scale.boxParent ? getScale(scale.boxParent).intervals : undefined,
}));

export default async function EscalasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;

  const rawRoot = get("root") ?? "C";
  const root = PRACTICAL_ROOTS.includes(rawRoot) ? rawRoot : "C";
  const type = get("type") ?? "major";
  const rawLabels = get("labels") ?? "note";
  const labels = (LABELS.has(rawLabels) ? rawLabels : "note") as FretboardLabels;

  const rawView = get("view") as ScaleView | undefined;
  const view = rawView && VIEWS.has(rawView) ? rawView : "mastil";

  const rawNpc = Number(get("npc"));
  const notesPerString = rawNpc === 2 || rawNpc === 3 ? rawNpc : undefined;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Escalas</h1>
      <p className="mt-1 text-muted-foreground">
        Cualquier escala, cualquier tono, deletreada como manda la tonalidad. Míralas por
        el diapasón entero, caja a caja o cuerda a cuerda.
      </p>
      <div className="mt-6">
        <FormulaExplorer
          kind="scale"
          basePath="/escalas"
          options={OPTIONS}
          initialRoot={root}
          initialType={type}
          initialLabels={labels}
          initialView={view}
          initialNotesPerString={notesPerString}
        />
      </div>
    </main>
  );
}
