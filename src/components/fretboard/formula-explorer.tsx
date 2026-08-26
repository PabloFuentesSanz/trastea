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
}

export function FormulaExplorer({
  kind,
  options,
  basePath,
  initialRoot,
  initialType,
  initialLabels,
}: {
  kind: "scale" | "chord";
  options: FormulaOption[];
  basePath: "/escalas" | "/acordes";
  initialRoot: NoteName;
  initialType: string;
  initialLabels: FretboardLabels;
}) {
  const [root, setRoot] = useState<NoteName>(initialRoot);
  const [typeId, setTypeId] = useState(
    options.some((o) => o.id === initialType) ? initialType : options[0].id,
  );
  const [labels, setLabels] = useState<FretboardLabels>(initialLabels);
  const [lefty, setLefty] = useState(false);
  const { play, playing } = useFormulaPlayer();

  const selected = options.find((o) => o.id === typeId) ?? options[0];
  const tuning = TUNINGS.standard;

  // El estado vive en la URL: las lecciones enlazan configuraciones exactas.
  const syncUrl = useCallback(
    (nextRoot: NoteName, nextType: string, nextLabels: FretboardLabels) => {
      const params = new URLSearchParams({ root: nextRoot, type: nextType });
      if (nextLabels !== "note") params.set("labels", nextLabels);
      window.history.replaceState(null, "", `${basePath}?${params.toString()}`);
    },
    [basePath],
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
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fx-root">Raíz</Label>
          <Select
            value={root}
            onValueChange={(v) => {
              setRoot(v);
              syncUrl(v, typeId, labels);
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
              syncUrl(root, v, labels);
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
              syncUrl(root, typeId, next);
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

      <div className="overflow-x-auto rounded-xl border bg-card p-3">
        <Fretboard positions={positions} labels={labels} lefty={lefty} title={title} />
      </div>

      <p className="text-xs text-muted-foreground">
        La raíz es el cuadrado ámbar; 3ª, 5ª y 7ª llevan su propio color. Afinación:{" "}
        {tuning.name}.
      </p>
    </div>
  );
}
