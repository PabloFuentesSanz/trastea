"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CHORDS } from "@/data/chords";
import { TUNINGS } from "@/data/tunings";
import {
  PRACTICAL_ROOTS,
  spellFormula,
  toSolfege,
  type NoteName,
} from "@/lib/music/notes";
import { formulaPositions } from "@/lib/music/fretboard";
import { generateVoicings, type Voicing } from "@/lib/music/voicings";
import { useFormulaPlayer } from "@/hooks/use-formula-player";
import { ChordDiagram, describeVoicing, type ChordDiagramLabels } from "./chord-diagram";
import { Fretboard } from "./fretboard";

export type ChordView = "chords" | "triads";
export type InversionFilter = "all" | "root";

/** Grupos de cuerdas para tríadas, en numeración de guitarrista (1ª = aguda). */
const STRING_SETS: { id: string; label: string; range: [number, number] | null }[] = [
  { id: "all", label: "Todos los grupos", range: null },
  { id: "123", label: "Cuerdas 1-2-3", range: [3, 5] },
  { id: "234", label: "Cuerdas 2-3-4", range: [2, 4] },
  { id: "345", label: "Cuerdas 3-4-5", range: [1, 3] },
  { id: "456", label: "Cuerdas 4-5-6", range: [0, 2] },
];

const MAX_SHOWN = 24;

export interface ChordExplorerInitial {
  root: NoteName;
  type: string;
  view: ChordView;
  inv: InversionFilter;
  set: string;
  labels: ChordDiagramLabels;
}

function inversionLabel(inv: number): string {
  return inv === 0 ? "Fundamental" : `${inv}ª inv`;
}

export function ChordExplorer({ initial }: { initial: ChordExplorerInitial }) {
  const [root, setRoot] = useState<NoteName>(initial.root);
  const [typeId, setTypeId] = useState(initial.type in CHORDS ? initial.type : "major");
  const [view, setView] = useState<ChordView>(initial.view);
  const [inv, setInv] = useState<InversionFilter>(initial.inv);
  const [setId, setSetId] = useState(
    STRING_SETS.some((s) => s.id === initial.set) ? initial.set : "all",
  );
  const [labels, setLabels] = useState<ChordDiagramLabels>(initial.labels);
  const [showNeck, setShowNeck] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { play, playing } = useFormulaPlayer();

  const chord = CHORDS[typeId] ?? CHORDS.major;
  const tuning = TUNINGS.standard;

  const syncUrl = useCallback(
    (next: Partial<ChordExplorerInitial>) => {
      const state: ChordExplorerInitial = {
        root,
        type: typeId,
        view,
        inv,
        set: setId,
        labels,
        ...next,
      };
      const params = new URLSearchParams({ root: state.root, type: state.type });
      if (state.view !== "chords") params.set("view", state.view);
      if (state.inv !== "all") params.set("inv", state.inv);
      if (state.set !== "all") params.set("set", state.set);
      if (state.labels !== "interval") params.set("labels", state.labels);
      window.history.replaceState(null, "", `/acordes?${params.toString()}`);
    },
    [root, typeId, view, inv, setId, labels],
  );

  const spelled = useMemo(() => spellFormula(root, chord.intervals), [root, chord]);
  const noteByInterval = useMemo(
    () =>
      Object.fromEntries(chord.intervals.map((interval, i) => [interval, spelled[i]])),
    [chord, spelled],
  );

  const voicings = useMemo(() => {
    const range = STRING_SETS.find((s) => s.id === setId)?.range ?? null;
    const generated = generateVoicings({
      root,
      intervals: chord.intervals,
      tuningMidi: tuning.midi,
      minStrings: view === "triads" ? 3 : 4,
      maxStrings: view === "triads" ? 3 : tuning.midi.length,
      stringSet: view === "triads" && range ? range : undefined,
    });
    return inv === "root" ? generated.filter((v) => v.inversion === 0) : generated;
  }, [root, chord, tuning, view, setId, inv]);

  const shown = showAll ? voicings : voicings.slice(0, MAX_SHOWN);

  const neckPositions = useMemo(
    () =>
      formulaPositions({
        root,
        intervals: chord.intervals,
        tuningMidi: tuning.midi,
        frets: 15,
      }),
    [root, chord, tuning],
  );

  const chordTitle = `${root}${chord.symbol} — ${chord.name} de ${toSolfege(root)}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Controles */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ch-root">Raíz</Label>
          <Select
            value={root}
            onValueChange={(v) => {
              setRoot(v);
              syncUrl({ root: v });
            }}
          >
            <SelectTrigger id="ch-root" className="w-full">
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
          <Label htmlFor="ch-type">Acorde</Label>
          <Select
            value={typeId}
            onValueChange={(v) => {
              setTypeId(v);
              syncUrl({ type: v });
            }}
          >
            <SelectTrigger id="ch-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CHORDS).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.symbol && `(${c.symbol})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ch-inv">Inversiones</Label>
          <Select
            value={inv}
            onValueChange={(v) => {
              setInv(v as InversionFilter);
              syncUrl({ inv: v as InversionFilter });
            }}
          >
            <SelectTrigger id="ch-inv" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="root">Solo fundamental</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ch-labels">Etiquetas</Label>
          <Select
            value={labels}
            onValueChange={(v) => {
              setLabels(v as ChordDiagramLabels);
              syncUrl({ labels: v as ChordDiagramLabels });
            }}
          >
            <SelectTrigger id="ch-labels" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interval">Grados</SelectItem>
              <SelectItem value="note">Notas</SelectItem>
              <SelectItem value="none">Sin etiquetas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vista: acordes completos o tríadas */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={view}
          onValueChange={(v) => {
            setView(v as ChordView);
            syncUrl({ view: v as ChordView });
          }}
        >
          <TabsList>
            <TabsTrigger value="chords">Acordes</TabsTrigger>
            <TabsTrigger value="triads">Tríadas</TabsTrigger>
          </TabsList>
        </Tabs>

        {view === "triads" && (
          <Select
            value={setId}
            onValueChange={(v) => {
              setSetId(v);
              syncUrl({ set: v });
            }}
          >
            <SelectTrigger className="w-44" aria-label="Grupo de cuerdas">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STRING_SETS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          {voicings.length} formas
          {voicings.length > MAX_SHOWN && (
            <Button variant="outline" size="sm" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Ver menos" : "Ver todas"}
            </Button>
          )}
        </span>
      </div>

      {/* Notas del acorde */}
      <div className="flex flex-wrap items-center gap-2" aria-label="Notas del acorde">
        {chord.intervals.map((interval, i) => (
          <Badge key={interval} variant={i === 0 ? "default" : "secondary"}>
            <span className="font-mono">{interval}</span>&nbsp;{spelled[i]}
          </Badge>
        ))}
        <Button
          variant="secondary"
          size="sm"
          className="ml-auto"
          disabled={playing}
          onClick={() => {
            const reference = voicings[0];
            if (reference) void play(reference.midis, "chord");
          }}
        >
          <Volume2 aria-hidden /> Escuchar
        </Button>
      </div>

      {/* Rejilla de diagramas */}
      {shown.length === 0 ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No hay formas tocables con esos filtros. Prueba con todas las inversiones u otro
          grupo de cuerdas.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {shown.map((voicing) => (
            <li key={voicing.frets.join(",")}>
              <VoicingCard
                voicing={voicing}
                noteByInterval={noteByInterval}
                labels={labels}
                title={describeVoicing(voicing, chord.name, root)}
                onPlay={() => void play(voicing.midis, "chord")}
                playing={playing}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Mástil completo (horizontal) plegable */}
      <div className="rounded-xl border">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          aria-expanded={showNeck}
          onClick={() => setShowNeck((s) => !s)}
        >
          Ver las notas del acorde en el mástil completo
          <ChevronDown
            aria-hidden
            className={cn("size-4 transition-transform", showNeck && "rotate-180")}
          />
        </button>
        {showNeck && (
          <div className="overflow-x-auto border-t p-3">
            <Fretboard
              positions={neckPositions}
              labels={labels === "none" ? "none" : labels}
              title={chordTitle}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        La raíz es el cuadrado ámbar; 3ª verde, 5ª azul, 7ª rosa. Ordenadas de la cejuela
        hacia arriba: son las mismas 5 zonas del sistema CAGED. Afinación: {tuning.name}.
      </p>
    </div>
  );
}

function VoicingCard({
  voicing,
  noteByInterval,
  labels,
  title,
  onPlay,
  playing,
}: {
  voicing: Voicing;
  noteByInterval: Record<string, NoteName>;
  labels: ChordDiagramLabels;
  title: string;
  onPlay: () => void;
  playing: boolean;
}) {
  const tags = [
    voicing.baseFret <= 1 && voicing.usesOpenStrings ? "Abierto" : null,
    voicing.isBarre ? "Cejilla" : null,
    inversionLabel(voicing.inversion),
  ].filter(Boolean);

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card p-2 transition-colors hover:border-primary/50">
      <ChordDiagram
        voicing={voicing}
        noteByInterval={noteByInterval}
        labels={labels}
        title={title}
      />
      <div className="mt-1 flex items-center justify-between gap-1 px-1">
        <span className="text-[11px] leading-tight text-muted-foreground">
          {tags.join(" · ")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={`Escuchar: ${title}`}
          disabled={playing}
          onClick={onPlay}
        >
          <Volume2 aria-hidden className="size-4" />
        </Button>
      </div>
    </div>
  );
}
