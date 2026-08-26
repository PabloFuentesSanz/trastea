import Link from "next/link";
import type { ReactNode } from "react";
import { Fretboard, type FretboardLabels } from "@/components/fretboard/fretboard";
import { ChordDiagram } from "@/components/fretboard/chord-diagram";
import { formulaPositions } from "@/lib/music/fretboard";
import { parseFormulaSpec, windowPositions } from "@/lib/music/spec";
import { spellFormula, type NoteName } from "@/lib/music/notes";
import { generateVoicings } from "@/lib/music/voicings";
import { getTuning } from "@/data/tunings";
import { cn } from "@/lib/utils";

const STANDARD = getTuning("standard").midi;

/**
 * En este pipeline las expresiones MDX (`desde={5}`) NO se evalúan: llegan
 * como undefined. El contenido escribe siempre `desde="5"`, y aquí se
 * convierte. `content:audit` rechaza las llaves para que nadie se confíe.
 */
export type Numerico = number | string | undefined;

export function num(value: Numerico): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  // Number("") es 0: una prop vacía no puede convertirse en el traste 0.
  const text = value.trim();
  if (text === "") return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Lista de números escrita como "6, 5, 4". */
export function nums(value: string | number[] | undefined): number[] | undefined {
  if (value === undefined) return undefined;
  const list = Array.isArray(value)
    ? value
    : value
        .split(/[,\s]+/)
        .filter(Boolean)
        .map(Number);
  return list.every(Number.isFinite) && list.length > 0 ? list : undefined;
}

function Figure({
  children,
  caption,
  className,
  maxWidth,
}: {
  children: ReactNode;
  caption?: string;
  className?: string;
  /** ancho natural del dibujo: una caja de 4 trastes no debe ocupar 1000 px */
  maxWidth?: number;
}) {
  return (
    <figure className={cn("not-prose my-5", className)} style={{ maxWidth }}>
      <div className="overflow-x-auto rounded-lg border bg-card p-3">{children}</div>
      {caption && (
        <figcaption className="mt-1.5 text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Mástil dibujado desde MDX:
 *
 *   <Mastil escala="A minor-pentatonic" desde={5} hasta={8} pie="Caja 1" />
 *   <Mastil acorde="Am7" desde={5} hasta={8} cuerdas={[4,3,2]} />
 *
 * `desde`/`hasta` recortan la ventana; sin ellos sale el mástil entero.
 */
export function Mastil({
  escala,
  acorde,
  desde,
  hasta,
  cuerdas,
  etiquetas = "interval",
  pie,
  zurdo = false,
}: {
  escala?: string;
  acorde?: string;
  desde?: Numerico;
  hasta?: Numerico;
  cuerdas?: string | number[];
  etiquetas?: FretboardLabels;
  pie?: string;
  zurdo?: boolean;
}) {
  const spec = escala
    ? parseFormulaSpec(escala, "scale")
    : acorde
      ? parseFormulaSpec(acorde, "chord")
      : null;
  if (!spec) throw new Error("<Mastil> necesita `escala` o `acorde`");

  const from = num(desde);
  const to = num(hasta);
  const strings = nums(cuerdas);
  const lastFret = to ?? 15;
  const all = formulaPositions({
    root: spec.root,
    intervals: spec.intervals,
    tuningMidi: STANDARD,
    frets: lastFret,
  });
  const positions = windowPositions(all, {
    fromFret: from,
    toFret: to,
    strings,
  });

  // el mástil entero se deja crecer; una ventana corta se queda en su tamaño
  const cells = lastFret - Math.max(from ?? 0, 1) + 1;
  const natural = cells >= 12 ? undefined : 90 + cells * 78;

  return (
    <Figure caption={pie} maxWidth={natural}>
      <Fretboard
        positions={positions}
        fromFret={from ?? 0}
        frets={lastFret}
        labels={etiquetas}
        lefty={zurdo}
        title={pie ? `${spec.label}: ${pie}` : spec.label}
      />
    </Figure>
  );
}

/**
 * Rejilla de diagramas de acorde. Cada uno se elige por posición dentro de
 * las formas generadas, así que no hay digitaciones a mano en el contenido:
 *
 *   <Acordes>
 *     <Acorde nombre="C" />
 *     <Acorde nombre="Am7" zona={5} />
 *   </Acordes>
 */
export function Acordes({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose my-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {children}
    </div>
  );
}

export function Acorde({
  nombre,
  zona,
  etiquetas = "interval",
  pie,
}: {
  nombre: string;
  /** traste por el que buscar la forma: 0 = la más grave disponible */
  zona?: Numerico;
  etiquetas?: "interval" | "note" | "none";
  pie?: string;
}) {
  const spec = parseFormulaSpec(nombre, "chord");
  const voicings = generateVoicings({
    root: spec.root,
    intervals: spec.intervals,
    tuningMidi: STANDARD,
  });

  const names = spellFormula(spec.root, spec.intervals);
  const noteByInterval: Record<string, NoteName> = {};
  spec.intervals.forEach((interval, i) => {
    noteByInterval[interval] = names[i];
  });

  // la primera forma cuyo traste base llega a `zona`
  const desdeTraste = num(zona) ?? 0;
  const voicing = voicings.find((v) => v.baseFret >= desdeTraste) ?? voicings[0];
  if (!voicing) throw new Error(`Sin formas tocables para "${nombre}"`);

  return (
    <figure className="rounded-lg border bg-card p-2">
      <figcaption className="mb-1 text-center text-sm font-medium">{nombre}</figcaption>
      <ChordDiagram
        voicing={voicing}
        noteByInterval={noteByInterval}
        labels={etiquetas}
        title={`${spec.label}, traste ${voicing.baseFret}`}
      />
      {pie && (
        <figcaption className="mt-1 text-center text-xs text-muted-foreground">
          {pie}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Ficha de consulta rápida: lo que en un manual va en el recuadro de arriba.
 *
 *   <Ficha
 *     formula="1 - b3 - 4 - 5 - b7"
 *     notas="La: A C D E G"
 *     suena="Nublada, con actitud"
 *     usa="Blues, rock, hard rock"
 *   />
 */
export function Ficha(props: Record<string, string | undefined>) {
  const rows = Object.entries(props).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  if (rows.length === 0) return null;

  return (
    <dl className="not-prose my-5 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
      {rows.map(([key, value]) => (
        <div key={key} className="bg-card px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {LABELS[key] ?? humanize(key)}
          </dt>
          <dd className="mt-0.5 text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * "grado1" → "Grado 1", "esLaEscalaDe" → "Es la escala de": las claves libres
 * de <Ficha> se leen bien sin tener que registrarlas en LABELS.
 */
function humanize(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const LABELS: Record<string, string> = {
  intervalos: "Distancias",
  simbolo: "Cifrado",
  grados: "Grados",
  formula: "Fórmula",
  notas: "Notas",
  suena: "Cómo suena",
  usa: "Dónde se usa",
  origen: "De dónde viene",
  cajas: "Posiciones",
  dificultad: "Dificultad",
  relativa: "Relativa",
  evitar: "Nota a evitar",
  tension: "Tensión característica",
  acordes: "Acordes que la piden",
};

/** Aviso corto: el error típico, el truco, el atajo. */
export function Aviso({
  tipo = "truco",
  children,
}: {
  tipo?: "truco" | "error" | "ojo";
  children: ReactNode;
}) {
  const style = {
    truco: "border-success/40 bg-success/5",
    error: "border-destructive/40 bg-destructive/5",
    ojo: "border-primary/40 bg-accent/40",
  }[tipo];
  const icon = { truco: "✓", error: "✕", ojo: "!" }[tipo];
  const word = { truco: "Truco", error: "Error típico", ojo: "Ojo" }[tipo];

  return (
    <aside className={cn("not-prose my-4 rounded-lg border p-3 text-sm", style)}>
      <p className="mb-1 flex items-center gap-1.5 font-medium">
        <span aria-hidden>{icon}</span> {word}
      </p>
      <div className="text-muted-foreground [&>p]:m-0">{children}</div>
    </aside>
  );
}

/**
 * Rutina de estudio: minutos y bpm en columnas, no en prosa.
 *
 *   <Rutina>
 *     <Paso dias="1-3" min={10} bpm={60} tool="/metronomo?bpm=60">
 *       Caja 1 en el traste 5, subiendo y bajando.
 *     </Paso>
 *   </Rutina>
 */
export function Rutina({ children }: { children: ReactNode }) {
  return <ol className="not-prose my-5 flex flex-col gap-2">{children}</ol>;
}

export function Paso({
  dias,
  min,
  bpm,
  tool,
  children,
}: {
  dias?: string;
  min?: Numerico;
  bpm?: Numerico;
  tool?: string;
  children: ReactNode;
}) {
  const minutos = num(min);
  const pulso = num(bpm);
  return (
    <li className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 sm:flex-row sm:items-baseline sm:gap-3">
      <div className="flex shrink-0 flex-wrap items-baseline gap-2 text-xs">
        {dias && <span className="font-medium">Días {dias}</span>}
        {minutos !== undefined && (
          <span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">
            {minutos} min
          </span>
        )}
        {pulso !== undefined && (
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-secondary-foreground">
            {pulso} bpm
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm [&>p]:m-0">{children}</div>
      {tool && (
        <Link
          href={tool}
          className="shrink-0 text-xs text-primary no-underline hover:underline"
        >
          Abrir 🎛
        </Link>
      )}
    </li>
  );
}
