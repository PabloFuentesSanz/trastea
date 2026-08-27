"use client";

import { useCallback, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Fretboard, type FretboardLabels } from "./fretboard";
import { boxCount, boxWindow, scaleBox } from "@/lib/music/boxes";
import { FormulaLegend } from "./formula-legend";
import { formulaMidiSequence, formulaPositions } from "@/lib/music/fretboard";
import {
  PRACTICAL_ROOTS,
  spellFormula,
  toSolfege,
  type IntervalName,
  type NoteName,
} from "@/lib/music/notes";
import { TUNINGS } from "@/data/tunings";
import { useFormulaPlayer } from "@/hooks/use-formula-player";

export interface FormulaOption {
  id: string;
  name: string;
  intervals: readonly IntervalName[];
  /** escala de la que hereda la digitación de las cajas (el blues, de la pentatónica) */
  boxParentIntervals?: readonly IntervalName[];
}

/** Cómo se enseña la escala: el mástil entero, caja a caja o cuerda a cuerda. */
export type ScaleView = "mastil" | "cajas" | "cuerdas";

const STRING_NAMES = [
  "6ª (Mi grave)",
  "5ª (La)",
  "4ª (Re)",
  "3ª (Sol)",
  "2ª (Si)",
  "1ª (Mi agudo)",
];

export function FormulaExplorer({
  kind,
  options,
  basePath,
  initialRoot,
  initialType,
  initialLabels,
  initialView = "mastil",
  initialNotesPerString,
}: {
  kind: "scale" | "chord";
  options: FormulaOption[];
  basePath: "/escalas" | "/acordes";
  initialRoot: NoteName;
  initialType: string;
  initialLabels: FretboardLabels;
  initialView?: ScaleView;
  initialNotesPerString?: number;
}) {
  const [root, setRoot] = useState<NoteName>(initialRoot);
  const [typeId, setTypeId] = useState(
    options.some((o) => o.id === initialType) ? initialType : options[0].id,
  );
  const [labels, setLabels] = useState<FretboardLabels>(initialLabels);
  const [view, setView] = useState<ScaleView>(initialView);
  const [npc, setNpc] = useState<number | undefined>(initialNotesPerString);
  const [lefty, setLefty] = useState(false);
  const { play, playing } = useFormulaPlayer();

  const selected = options.find((o) => o.id === typeId) ?? options[0];
  const tuning = TUNINGS.standard;

  // El estado vive en la URL: las lecciones enlazan configuraciones exactas.
  const syncUrl = useCallback(
    (next: {
      root?: NoteName;
      type?: string;
      labels?: FretboardLabels;
      view?: ScaleView;
      npc?: number;
    }) => {
      const state = { root, type: typeId, labels, view, npc, ...next };
      const params = new URLSearchParams({ root: state.root, type: state.type });
      if (state.labels !== "note") params.set("labels", state.labels);
      if (state.view !== "mastil") params.set("view", state.view);
      if (state.npc !== undefined) params.set("npc", String(state.npc));
      window.history.replaceState(null, "", `${basePath}?${params.toString()}`);
    },
    [basePath, root, typeId, labels, view, npc],
  );

  const positions = useMemo(
    () =>
      formulaPositions({
        root,
        intervals: selected.intervals,
        tuningMidi: tuning.midi,
        frets: 15,
      }),
    [root, selected, tuning],
  );

  const esEscala = kind === "scale";
  const totalCajas = useMemo(
    () => boxCount(selected.intervals, selected.boxParentIntervals),
    [selected],
  );
  /** Solo tiene sentido elegir 2 o 3 notas por cuerda en escalas de siete. */
  const admiteNpc = esEscala && selected.intervals.length > 5;

  const cajas = useMemo(() => {
    if (!esEscala || view !== "cajas") return [];
    return Array.from({ length: totalCajas }, (_, i) =>
      scaleBox({
        root,
        intervals: selected.intervals,
        tuningMidi: tuning.midi,
        box: i + 1,
        notesPerString: admiteNpc ? npc : undefined,
        parentIntervals: selected.boxParentIntervals,
      }),
    );
  }, [esEscala, view, totalCajas, root, selected, tuning, admiteNpc, npc]);

  const spelled = useMemo(() => spellFormula(root, selected.intervals), [root, selected]);
  const degreeMidis = useMemo(
    () =>
      formulaMidiSequence({ root, intervals: selected.intervals }).slice(
        0,
        selected.intervals.length,
      ),
    [root, selected],
  );

  const title = `${kind === "scale" ? "Escala" : "Acorde"} ${selected.name} en ${toSolfege(root)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fx-root">Raíz</Label>
          <Select
            value={root}
            onValueChange={(v) => {
              setRoot(v);
              syncUrl({ root: v });
            }}
          >
            <SelectTrigger id="fx-root" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRACTICAL_ROOTS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r} · {toSolfege(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fx-type">{kind === "scale" ? "Escala" : "Acorde"}</Label>
          <Select
            value={typeId}
            onValueChange={(v) => {
              setTypeId(v);
              syncUrl({ type: v });
            }}
          >
            <SelectTrigger id="fx-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fx-labels">Etiquetas</Label>
          <Select
            value={labels}
            onValueChange={(v) => {
              const next = v as FretboardLabels;
              setLabels(next);
              syncUrl({ labels: next });
            }}
          >
            <SelectTrigger id="fx-labels" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="note">Notas</SelectItem>
              <SelectItem value="solfege">Notas (Do Re Mi)</SelectItem>
              <SelectItem value="interval">Grados</SelectItem>
              <SelectItem value="none">Sin etiquetas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {esEscala && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fx-view">Ver</Label>
            <Select
              value={view}
              onValueChange={(v) => {
                const next = v as ScaleView;
                setView(next);
                syncUrl({ view: next });
              }}
            >
              <SelectTrigger id="fx-view" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mastil">Diapasón entero</SelectItem>
                <SelectItem value="cajas">Por cajas</SelectItem>
                <SelectItem value="cuerdas">Cuerda a cuerda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {esEscala && view === "cajas" && admiteNpc && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fx-npc">Notas por cuerda</Label>
            <Select
              value={String(npc ?? 3)}
              onValueChange={(v) => {
                const next = Number(v);
                setNpc(next);
                syncUrl({ npc: next });
              }}
            >
              <SelectTrigger id="fx-npc" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 · cajas tipo CAGED</SelectItem>
                <SelectItem value="3">3 · tres notas por cuerda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-end justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <Switch id="fx-lefty" checked={lefty} onCheckedChange={setLefty} />
            <Label htmlFor="fx-lefty">Zurdo</Label>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              void play(
                formulaMidiSequence({ root, intervals: selected.intervals }),
                kind === "chord" ? "chord" : "sequence",
              )
            }
            disabled={playing}
            aria-label={`Escuchar ${title}`}
          >
            <Volume2 aria-hidden /> Escuchar
          </Button>
        </div>
      </div>

      {/* Notas deletreadas: leyenda clicable (cada chip suena) */}
      <FormulaLegend
        intervals={selected.intervals}
        spelled={spelled}
        midis={degreeMidis}
        onPlayNote={(midi) => void play([midi], "sequence")}
      />

      {view === "mastil" && (
        <div className="overflow-x-auto rounded-xl border bg-card p-3">
          <Fretboard positions={positions} labels={labels} lefty={lefty} title={title} />
        </div>
      )}

      {view === "cajas" && (
        <div className="flex flex-col gap-4">
          {cajas.map((caja, i) => {
            const ventana = boxWindow(caja);
            return (
              <figure key={i} className="min-w-0">
                <div className="overflow-x-auto rounded-xl border bg-card p-3">
                  <Fretboard
                    positions={caja}
                    fromFret={ventana.fromFret}
                    frets={ventana.toFret}
                    labels={labels}
                    lefty={lefty}
                    title={`${title}, caja ${i + 1}`}
                  />
                </div>
                <figcaption className="mt-1.5 text-xs text-muted-foreground">
                  Caja {i + 1} de {totalCajas}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      {view === "cuerdas" && (
        <div className="flex flex-col gap-4">
          {STRING_NAMES.map((nombre, i) => {
            // índice 0 = 6ª cuerda, que es la primera que se enseña
            const enCuerda = positions.filter((p) => p.string === i);
            return (
              <figure key={nombre} className="min-w-0">
                <div className="overflow-x-auto rounded-xl border bg-card p-3">
                  <Fretboard
                    positions={enCuerda}
                    labels={labels}
                    lefty={lefty}
                    title={`${title}, cuerda ${nombre}`}
                  />
                </div>
                <figcaption className="mt-1.5 text-xs text-muted-foreground">
                  Cuerda {nombre}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        La raíz es el cuadrado ámbar; 3ª, 5ª y 7ª llevan su propio color. Afinación:{" "}
        {tuning.name}.
        {view === "cajas" &&
          " Cada caja es un patrón de digitación, no un recorte de trastes: por eso no todas empiezan en el mismo sitio en cada cuerda."}
        {view === "cuerdas" &&
          " Una cuerda cada vez: es como se aprende el mástil sin depender de la forma de la mano."}
      </p>
    </div>
  );
}
