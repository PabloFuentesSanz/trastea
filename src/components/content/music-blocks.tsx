import Link from "next/link";
import type { ReactNode } from "react";
import { Fretboard, type FretboardLabels } from "@/components/fretboard/fretboard";
import { ChordDiagram } from "@/components/fretboard/chord-diagram";
import { Tablature } from "@/components/fretboard/tablature";
import { formulaPositions } from "@/lib/music/fretboard";
import { boxCount, boxWindow, scaleBox } from "@/lib/music/boxes";
import { parseGrid } from "@/lib/music/grid";
import { foreignNotes, parseTab } from "@/lib/music/tab";
import {
  parseFormulaSpec,
  parseNoteSpec,
  positionsFromNotes,
  stringIndex,
  windowPositions,
} from "@/lib/music/spec";
import { parseNote, semitonesOf, spellFormula, type NoteName } from "@/lib/music/notes";
import { generateVoicings, type Voicing } from "@/lib/music/voicings";
import { parseFretSpec, voicingFromFrets } from "@/lib/music/voicing-from-frets";
import { getTuning } from "@/data/tunings";
import { getScale, SCALES } from "@/data/scales";
import { cn } from "@/lib/utils";

const STANDARD = getTuning("standard").midi;

/** Fórmula de la escala de la que una escala hereda la digitación, si la hay. */
function boxParentIntervals(scaleId: string) {
  const parentId = SCALES[scaleId]?.boxParent;
  return parentId ? getScale(parentId).intervals : undefined;
}

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
 *   <Mastil escala="A minor-pentatonic" caja="1" />
 *   <Mastil escala="A minor-pentatonic" cuerdas="6" />
 *   <Mastil acorde="Am7" desde="5" hasta="8" />
 *   <Mastil notas="6:5, 5:7" />
 *
 * Para una caja usa SIEMPRE `caja`, nunca `desde`/`hasta`: una caja no es un
 * rectángulo de trastes y recortarla a ojo se come notas de la vecina y
 * pierde las propias (ver src/lib/music/boxes.ts).
 */
export function Mastil({
  escala,
  acorde,
  notas,
  raiz,
  caja,
  notasPorCuerda,
  desdeTraste,
  desde,
  hasta,
  cuerdas,
  etiquetas = "interval",
  pie,
  zurdo = false,
}: {
  escala?: string;
  acorde?: string;
  /** notas sueltas "cuerda:traste": "6:5, 5:7". Para intervalos y ejercicios. */
  notas?: string;
  /** raíz desde la que medir los intervalos de `notas` */
  raiz?: string;
  /** posición de la escala: 1 = la que empieza en la raíz */
  caja?: Numerico;
  /** 2 para pentatónicas, 3 para escalas de siete notas */
  notasPorCuerda?: Numerico;
  /** octava en la que dibujar la caja: traste mínimo de su primera nota */
  desdeTraste?: Numerico;
  desde?: Numerico;
  hasta?: Numerico;
  cuerdas?: string | number[];
  etiquetas?: FretboardLabels;
  pie?: string;
  zurdo?: boolean;
}) {
  const from = num(desde);
  const to = num(hasta);
  const strings = nums(cuerdas);

  const spec = escala
    ? parseFormulaSpec(escala, "scale")
    : acorde
      ? parseFormulaSpec(acorde, "chord")
      : null;
  if (!spec && !notas) {
    throw new Error("<Mastil> necesita `escala`, `acorde` o `notas`");
  }

  const parsed = notas ? parseNoteSpec(notas) : null;
  const numeroCaja = num(caja);

  let positions;
  if (parsed) {
    positions = positionsFromNotes(parsed, STANDARD, raiz ?? spec?.root);
  } else if (numeroCaja !== undefined) {
    if (!spec) throw new Error("<Mastil caja> necesita `escala`");
    positions = scaleBox({
      root: spec.root,
      intervals: spec.intervals,
      tuningMidi: STANDARD,
      box: numeroCaja,
      notesPerString: num(notasPorCuerda),
      parentIntervals: boxParentIntervals(spec.id),
      startFret: num(desdeTraste),
    });
  } else {
    positions = windowPositions(
      formulaPositions({
        root: spec!.root,
        intervals: spec!.intervals,
        tuningMidi: STANDARD,
        frets: to ?? 15,
      }),
      { fromFret: from, toFret: to, strings },
    );
  }

  // La caja y las notas sueltas traen su propia extensión: la ventana se
  // ajusta a lo que hay que enseñar, con un traste de aire a cada lado.
  const ajustada = parsed !== null || numeroCaja !== undefined;
  const auto = boxWindow(positions);

  const firstFret = from ?? (ajustada ? auto.fromFret : 0);
  const lastFret = to ?? (ajustada ? auto.toFret : 15);

  const titulo = spec?.label ?? "Notas en el mástil";

  // el mástil entero se deja crecer; una ventana corta se queda en su tamaño
  const cells = lastFret - Math.max(firstFret, 1) + 1;
  const natural = cells >= 12 ? undefined : 90 + cells * 78;

  return (
    <Figure caption={pie} maxWidth={natural}>
      <Fretboard
        positions={positions}
        fromFret={firstFret}
        frets={lastFret}
        labels={etiquetas}
        lefty={zurdo}
        title={pie ? `${titulo}: ${pie}` : titulo}
      />
    </Figure>
  );
}

/**
 * Rejilla de acordes: la forma de un tema como se lee en un real book.
 *
 *   <Rejilla compases="A7 | A7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7" />
 *
 * Un compás por celda, cuatro por línea. "%" repite el anterior y dos
 * cifrados en la misma celda son dos acordes en ese compás.
 */
export function Rejilla({
  compases,
  pie,
  porLinea,
}: {
  compases: string;
  pie?: string;
  porLinea?: Numerico;
}) {
  const bars = parseGrid(compases);
  const columnas = num(porLinea) ?? 4;

  return (
    <figure className="not-prose my-5">
      <ol
        className="grid gap-px overflow-hidden rounded-lg border bg-border"
        style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}
      >
        {bars.map((bar, i) => (
          <li
            key={i}
            className="flex min-h-14 flex-col justify-between bg-card px-2 py-1.5"
          >
            <span className="text-[10px] text-muted-foreground">{i + 1}</span>
            <span className="flex flex-wrap gap-x-2 text-sm font-medium">
              {bar.chords.length === 0 ? (
                <span
                  className="text-muted-foreground"
                  aria-label="repite el compás anterior"
                >
                  %
                </span>
              ) : (
                bar.chords.map((chord) => <span key={chord}>{chord}</span>)
              )}
            </span>
          </li>
        ))}
      </ol>
      {pie && (
        <figcaption className="mt-1.5 text-xs text-muted-foreground">{pie}</figcaption>
      )}
    </figure>
  );
}

/**
 * Todas las cajas de una escala, de golpe. La regla del contenido: donde se
 * habla de una escala salen TODAS sus posiciones, no una de muestra.
 *
 *   <Cajas escala="A minor-pentatonic" />
 */
export function Cajas({
  escala,
  notasPorCuerda,
  etiquetas = "interval",
  desde,
}: {
  escala: string;
  notasPorCuerda?: Numerico;
  etiquetas?: FretboardLabels;
  /** empezar en otra caja que no sea la 1 */
  desde?: Numerico;
}) {
  const spec = parseFormulaSpec(escala, "scale");
  const total = boxCount(spec.intervals, boxParentIntervals(spec.id));
  const primera = num(desde) ?? 1;

  return (
    <>
      {Array.from({ length: total - primera + 1 }, (_, i) => primera + i).map((caja) => (
        <Mastil
          key={caja}
          escala={escala}
          caja={caja}
          notasPorCuerda={notasPorCuerda}
          etiquetas={etiquetas}
          pie={`Caja ${caja} de ${total}`}
        />
      ))}
    </>
  );
}

/**
 * La escala cuerda a cuerda: seis mástiles de una sola cuerda. Es como se
 * aprende el mástil de verdad, sin depender de la forma de la mano.
 *
 *   <PorCuerdas escala="A minor-pentatonic" />
 */
export function PorCuerdas({
  escala,
  etiquetas = "note",
  hasta,
}: {
  escala: string;
  etiquetas?: FretboardLabels;
  hasta?: Numerico;
}) {
  const cuerdas = [6, 5, 4, 3, 2, 1];
  const nombres = [
    "6ª (Mi grave)",
    "5ª (La)",
    "4ª (Re)",
    "3ª (Sol)",
    "2ª (Si)",
    "1ª (Mi agudo)",
  ];

  return (
    <>
      {cuerdas.map((cuerda, i) => (
        <Mastil
          key={cuerda}
          escala={escala}
          cuerdas={String(cuerda)}
          desde="0"
          hasta={hasta ?? "12"}
          etiquetas={etiquetas}
          pie={`Cuerda ${nombres[i]}`}
        />
      ))}
    </>
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
  cuerdas,
  inversion,
  trastes,
  etiquetas = "interval",
  pie,
}: {
  nombre: string;
  /** traste por el que buscar la forma: 0 = la más grave disponible */
  zona?: Numerico;
  /** grupo de cuerdas contiguas en numeración musical, p. ej. "3, 2, 1" */
  cuerdas?: string | number[];
  /** 0 = fundamental en el bajo, 1 = primera inversión… */
  inversion?: Numerico;
  /** digitación exacta de 6ª a 1ª: "3,x,3,4,x,x". Gana sobre zona/cuerdas. */
  trastes?: string;
  etiquetas?: "interval" | "note" | "none";
  pie?: string;
}) {
  const spec = parseFormulaSpec(nombre, "chord");

  const names = spellFormula(spec.root, spec.intervals);
  const noteByInterval: Record<string, NoteName> = {};
  spec.intervals.forEach((interval, i) => {
    noteByInterval[interval] = names[i];
  });

  // Digitación escrita a mano: manda sobre cualquier búsqueda.
  if (trastes) {
    const exacto = voicingFromFrets({
      root: spec.root,
      intervals: spec.intervals,
      frets: parseFretSpec(trastes),
      tuningMidi: STANDARD,
    });
    return (
      <DiagramaAcorde
        nombre={nombre}
        voicing={exacto}
        noteByInterval={noteByInterval}
        etiquetas={etiquetas}
        titulo={`${spec.label}, traste ${exacto.baseFret}`}
        pie={pie}
      />
    );
  }

  const grupo = nums(cuerdas);
  // el autor escribe "3, 2, 1"; el generador quiere índices 0 = 6ª cuerda
  const stringSet: [number, number] | undefined = grupo
    ? [Math.min(...grupo.map(stringIndex)), Math.max(...grupo.map(stringIndex))]
    : undefined;

  const voicings = generateVoicings({
    root: spec.root,
    intervals: spec.intervals,
    tuningMidi: STANDARD,
    ...(stringSet && grupo
      ? { stringSet, minStrings: grupo.length, maxStrings: grupo.length }
      : {}),
  });

  // la primera forma cuyo traste base llega a `zona`
  const desdeTraste = num(zona) ?? 0;
  const inv = num(inversion);
  const candidatas =
    inv === undefined ? voicings : voicings.filter((v) => v.inversion === inv);
  const voicing =
    candidatas.find((v) => v.baseFret >= desdeTraste) ?? candidatas[0] ?? voicings[0];
  if (!voicing) throw new Error(`Sin formas tocables para "${nombre}"`);

  return (
    <DiagramaAcorde
      nombre={nombre}
      voicing={voicing}
      noteByInterval={noteByInterval}
      etiquetas={etiquetas}
      titulo={`${spec.label}, traste ${voicing.baseFret}`}
      pie={pie}
    />
  );
}

function DiagramaAcorde({
  nombre,
  voicing,
  noteByInterval,
  etiquetas,
  titulo,
  pie,
}: {
  nombre: string;
  voicing: Voicing;
  noteByInterval: Record<string, NoteName>;
  etiquetas: "interval" | "note" | "none";
  titulo: string;
  pie?: string;
}) {
  return (
    <figure className="rounded-lg border bg-card p-2">
      <figcaption className="mb-1 text-center text-sm font-medium">{nombre}</figcaption>
      <ChordDiagram
        voicing={voicing}
        noteByInterval={noteByInterval}
        labels={etiquetas}
        title={titulo}
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

/**
 * Tablatura desde MDX:
 *
 *   <Tab notas="6:5 6:6 6:7 6:8 | 5:5 5:6 5:7 5:8" figuras="corcheas" />
 *
 * La notación completa está en src/lib/music/tab.ts. Si el parser no entiende
 * algo revienta aquí y en `content:audit`, que es justo lo que se quiere: una
 * tab mal escrita no debe llegar a la página con notas inventadas.
 */
export function Tab({
  notas,
  escala,
  figuras,
  pie,
  titulo,
}: {
  notas: string;
  /** escala a la que deben pertenecer todas las notas; si no, revienta */
  escala?: string;
  figuras?: string;
  pie?: string;
  titulo?: string;
}) {
  const bars = parseTab(notas);
  if (escala) {
    const spec = parseFormulaSpec(escala, "scale");
    const pcs = semitonesOf(spec.intervals).map((s) => parseNote(spec.root).pc + s);
    const fuera = foreignNotes(bars, pcs, STANDARD);
    if (fuera.length > 0) {
      throw new Error(`${fuera.join(", ")} no está en ${spec.label}`);
    }
  }
  const compases = bars.length === 1 ? "1 compás" : `${bars.length} compases`;
  return (
    <Figure caption={pie}>
      <Tablature
        bars={bars}
        subdivision={figuras}
        title={titulo ?? pie ?? `Tablatura de ${compases}`}
      />
    </Figure>
  );
}
