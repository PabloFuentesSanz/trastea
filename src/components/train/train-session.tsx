"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { gradeCard } from "@/app/actions/srs";
import { playNotes } from "@/lib/audio/pluck";
import { CHORDS } from "@/data/chords";
import { mod12, parseNote, pcToName } from "@/lib/music/notes";
import {
  cardId,
  checkAnswer,
  chordSemitones,
  midiAt,
  type Answer,
  type Position,
  type TrainCard,
} from "@/lib/train/cards";
import { INTERVAL_CHOICES } from "@/lib/train/intervals";
import { promptFor } from "@/lib/train/prompts";
import { degreeLabel, scaleBoxPositions, scaleDegrees } from "@/lib/train/scales";
import type { Grade } from "@/lib/srs/scheduler";
import { TrainFretboard, type FretMark } from "./train-fretboard";

/** Un acierto rápido vale más que uno dudado: eso gradúa la tarjeta. */
const FAST_MS = 4000;

/** Alturas cómodas para los ejercicios de oído: ni retumba ni pita. */
const EAR_LOW = 52;
const EAR_HIGH = 64;

const NOTE_CHOICES = Array.from({ length: 12 }, (_, pc) => ({
  pc,
  label: pcToName(pc, false),
}));

export interface TrainChoices {
  /** intervalos que pueden salir en este nivel, en semitonos */
  intervals: number[];
  /** tipos de acorde que pueden salir en este nivel */
  chords: string[];
}

interface Answered {
  card: TrainCard;
  correct: boolean;
  ms: number;
}

export function TrainSession({
  cards,
  choices,
  demo,
  frets = 12,
}: {
  cards: TrainCard[];
  choices: TrainChoices;
  demo: boolean;
  frets?: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [resultado, setResultado] = useState<"none" | "correct" | "wrong">("none");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [tocado, setTocado] = useState<Position | null>(null);
  const [, startTransition] = useTransition();

  const card = cards[index];
  const finished = index >= cards.length;
  const prompt = useMemo(() => (card ? promptFor(card) : null), [card]);

  /**
   * La raíz de los ejercicios de oído se sortea por tarjeta: lo que se entrena
   * es la distancia, no reconocerla desde una nota fija.
   *
   * Vive en una ref y se sortea al sonar, no al renderizar: `Math.random()`
   * durante el render daría un valor en el servidor y otro en el cliente, y
   * eso rompe la hidratación.
   */
  const earRoot = useRef({ index: -1, midi: EAR_LOW });
  const rootActual = useCallback(() => {
    if (earRoot.current.index !== index) {
      earRoot.current = {
        index,
        midi: EAR_LOW + Math.floor(Math.random() * (EAR_HIGH - EAR_LOW + 1)),
      };
    }
    return earRoot.current.midi;
  }, [index]);

  const sonar = useCallback(async () => {
    if (!card) return;
    const root = rootActual();
    if (card.type === "ear_interval") {
      await playNotes([root, root + card.semitones], { gap: 0.75, duration: 1.1 });
    } else if (card.type === "ear_chord") {
      const midis = chordSemitones(card.chordId).map((s) => root + s);
      if (midis.length === 0) return;
      // rasgueado, no de golpe: un acorde de golpe se identifica peor
      await playNotes(midis, { strum: 0.035, duration: 1.6 });
    }
  }, [card, rootActual]);

  // que suene solo al aparecer la tarjeta de oído: si no, cada una son dos clics
  const yaSono = useRef<string | null>(null);
  useEffect(() => {
    if (!card || !card.type.startsWith("ear_")) return;
    const id = `${cardId(card)}:${index}`;
    if (yaSono.current === id) return;
    yaSono.current = id;
    void sonar();
  }, [card, index, sonar]);

  const responder = useCallback(
    (answer: Answer) => {
      if (!card || resultado !== "none") return;
      const ms = Date.now() - startedAt;
      const correct = checkAnswer(card, answer);
      setResultado(correct ? "correct" : "wrong");
      setAnswers((prev) => [...prev, { card, correct, ms }]);

      const grade: Grade = !correct ? "again" : ms <= FAST_MS ? "good" : "hard";
      if (!demo) {
        startTransition(async () => {
          await gradeCard({ cardId: cardId(card), grade });
        });
      }

      window.setTimeout(
        () => {
          setIndex((i) => i + 1);
          setResultado("none");
          setSeleccion([]);
          setTocado(null);
          setStartedAt(Date.now());
        },
        correct ? 700 : 1800,
      );
    },
    [card, resultado, startedAt, demo],
  );

  if (finished) {
    return (
      <Resumen
        answers={answers}
        onRepeat={() => {
          router.refresh();
          setIndex(0);
          setAnswers([]);
          setStartedAt(Date.now());
        }}
      />
    );
  }

  const marks = fretMarks(card, resultado, tocado, frets);
  const esDeOido = card.type.startsWith("ear_");

  return (
    <section aria-label="Entrenamiento" className="mt-6">
      <div className="flex items-center gap-3">
        <Progress
          value={(index / cards.length) * 100}
          className="h-2"
          aria-label={`Pregunta ${index + 1} de ${cards.length}`}
        />
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {index + 1}/{cards.length}
        </span>
      </div>

      <p className="mt-6 text-center text-lg">{prompt?.question}</p>

      {esDeOido ? (
        <div className="mt-6 flex justify-center">
          <Button size="lg" variant="outline" onClick={() => void sonar()}>
            <Volume2 aria-hidden /> Volver a escucharlo
          </Button>
        </div>
      ) : (
        <div className="bg-card mt-4 overflow-x-auto rounded-xl border p-3">
          <TrainFretboard
            marks={marks}
            frets={frets}
            ariaLabel={prompt?.question ?? "Mástil"}
            onPick={
              card.type === "interval_build" || card.type === "scale_box"
                ? (position) => {
                    setTocado(position);
                    responder({ position });
                  }
                : undefined
            }
            disabled={resultado !== "none"}
          />
        </div>
      )}

      <Respuestas
        card={card}
        choices={choices}
        seleccion={seleccion}
        bloqueado={resultado !== "none"}
        onToggle={(pc) =>
          setSeleccion((prev) =>
            prev.includes(pc) ? prev.filter((x) => x !== pc) : [...prev, pc],
          )
        }
        onAnswer={responder}
      />

      <p
        aria-live="polite"
        className={cn(
          "mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-sm",
          resultado === "correct" && "text-success",
          resultado === "wrong" && "text-destructive",
          resultado === "none" && "text-muted-foreground",
        )}
      >
        {resultado === "correct" && (
          <>
            <Check className="size-4" aria-hidden /> ¡Esa es!
          </>
        )}
        {resultado === "wrong" && (
          <>
            <X className="size-4" aria-hidden /> Era {prompt?.answerLabel}
            {prompt?.hint && (
              <span className="text-muted-foreground">— {prompt.hint}</span>
            )}
          </>
        )}
        {resultado === "none" &&
          (card.type === "interval_build"
            ? "Toca la nota en el mástil. Vale cualquier cuerda donde esté esa altura."
            : card.type === "chord_notes"
              ? "Marca todas las notas del acorde y comprueba."
              : card.type === "scale_box"
                ? "Toca el hueco de la caja. Aquí sí importa la cuerda: es la digitación."
                : card.type === "scale_degree"
                  ? "Las notas grises son la raíz de la escala: cuenta desde ahí."
                  : "")}
      </p>
    </section>
  );
}

/** Qué se pinta en el mástil según el tipo de tarjeta y cómo ha ido. */
function fretMarks(
  card: TrainCard,
  resultado: "none" | "correct" | "wrong",
  tocado: Position | null,
  frets: number,
): FretMark[] {
  switch (card.type) {
    case "fretboard_note":
      return [
        {
          position: { string: card.string, fret: card.fret },
          kind: resultado === "none" ? "ask" : resultado,
        },
      ];
    case "interval_name":
      return [
        { position: card.from, kind: "from", label: "1" },
        { position: card.to, kind: resultado === "none" ? "ask" : resultado, label: "?" },
      ];
    case "interval_build": {
      const marks: FretMark[] = [{ position: card.from, kind: "from", label: "1" }];
      if (tocado)
        marks.push({
          position: tocado,
          kind: resultado === "correct" ? "correct" : "wrong",
        });
      if (resultado === "wrong") {
        // enseña una solución posible, la de la misma cuerda si cabe
        const objetivo = midiAt(card.from) + card.semitones;
        const mismaCuerda = objetivo - midiAt({ string: card.from.string, fret: 0 });
        if (mismaCuerda >= 0 && mismaCuerda <= 17) {
          marks.push({
            position: { string: card.from.string, fret: mismaCuerda },
            kind: "correct",
          });
        }
      }
      return marks;
    }
    case "scale_degree": {
      // las raíces se pintan de contexto: el grado se mide desde la raíz, y
      // sin verla esto sería adivinar en vez de contar
      const rootPc = mod12(parseNote(card.root).pc);
      const marks: FretMark[] = [];
      for (let string = 0; string < 6; string += 1) {
        for (let fret = 0; fret <= frets; fret += 1) {
          if (string === card.position.string && fret === card.position.fret) continue;
          if (mod12(midiAt({ string, fret })) === rootPc) {
            marks.push({ position: { string, fret }, kind: "context", label: "R" });
          }
        }
      }
      marks.push({
        position: card.position,
        kind: resultado === "none" ? "ask" : resultado,
        label: "?",
      });
      return marks;
    }
    case "scale_box": {
      const caja = scaleBoxPositions(card.root, card.scaleId, card.box);
      const marks: FretMark[] = caja
        .filter((p) => p.string !== card.missing.string || p.fret !== card.missing.fret)
        .map((position) => ({ position, kind: "context" as const }));
      if (resultado === "none") {
        marks.push({ position: card.missing, kind: "hole", label: "?" });
      } else {
        if (tocado) {
          marks.push({
            position: tocado,
            kind: resultado === "correct" ? "correct" : "wrong",
          });
        }
        if (resultado === "wrong") {
          marks.push({ position: card.missing, kind: "correct" });
        }
      }
      return marks;
    }
    default:
      return [];
  }
}

function Respuestas({
  card,
  choices,
  seleccion,
  bloqueado,
  onToggle,
  onAnswer,
}: {
  card: TrainCard;
  choices: TrainChoices;
  seleccion: number[];
  bloqueado: boolean;
  onToggle: (pc: number) => void;
  onAnswer: (answer: Answer) => void;
}) {
  if (card.type === "interval_build" || card.type === "scale_box") return null;

  if (card.type === "scale_degree") {
    return (
      <Rejilla label="Elige el grado">
        {scaleDegrees(card.scaleId).map((d) => (
          <Button
            key={d.interval}
            variant="outline"
            className="h-14 flex-col gap-0 leading-tight"
            disabled={bloqueado}
            onClick={() => onAnswer({ semitones: d.semitones })}
          >
            <span className="text-base font-semibold">{d.interval}</span>
            <span className="text-muted-foreground text-[10px]">
              {degreeLabel(d.interval)}
            </span>
          </Button>
        ))}
      </Rejilla>
    );
  }

  if (card.type === "fretboard_note") {
    return (
      <Rejilla label="Elige la nota">
        {NOTE_CHOICES.map((o) => (
          <Button
            key={o.pc}
            variant="outline"
            className="h-14 text-lg font-semibold"
            disabled={bloqueado}
            onClick={() => onAnswer({ pc: o.pc })}
          >
            {o.label}
          </Button>
        ))}
      </Rejilla>
    );
  }

  if (card.type === "interval_name" || card.type === "ear_interval") {
    const posibles = INTERVAL_CHOICES.filter((c) =>
      choices.intervals.includes(c.semitones),
    );
    return (
      <Rejilla label="Elige el intervalo">
        {posibles.map((o) => (
          <Button
            key={o.semitones}
            variant="outline"
            className="h-14 flex-col gap-0 leading-tight"
            disabled={bloqueado}
            onClick={() => onAnswer({ semitones: o.semitones })}
          >
            <span className="text-base font-semibold">{o.short}</span>
            <span className="text-muted-foreground text-[10px]">{o.label}</span>
          </Button>
        ))}
      </Rejilla>
    );
  }

  if (card.type === "ear_chord") {
    return (
      <Rejilla label="Elige el tipo de acorde">
        {choices.chords.map((id) => (
          <Button
            key={id}
            variant="outline"
            className="h-14 text-sm"
            disabled={bloqueado}
            onClick={() => onAnswer({ chordId: id })}
          >
            {CHORDS[id]?.name ?? id}
          </Button>
        ))}
      </Rejilla>
    );
  }

  // chord_notes: se marcan varias y se comprueba
  return (
    <div className="mt-6">
      <Rejilla label="Marca las notas del acorde">
        {NOTE_CHOICES.map((o) => (
          <Button
            key={o.pc}
            variant={seleccion.includes(o.pc) ? "default" : "outline"}
            className="h-14 text-lg font-semibold"
            aria-pressed={seleccion.includes(o.pc)}
            disabled={bloqueado}
            onClick={() => onToggle(o.pc)}
          >
            {o.label}
          </Button>
        ))}
      </Rejilla>
      <div className="mt-3 flex justify-center">
        <Button
          size="lg"
          disabled={bloqueado || seleccion.length === 0}
          onClick={() => onAnswer({ pcs: seleccion })}
        >
          Comprobar ({seleccion.length})
        </Button>
      </div>
    </div>
  );
}

function Rejilla({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-6"
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}

function Resumen({ answers, onRepeat }: { answers: Answered[]; onRepeat: () => void }) {
  const hits = answers.filter((a) => a.correct).length;
  const avgMs =
    answers.length > 0
      ? Math.round(answers.reduce((sum, a) => sum + a.ms, 0) / answers.length)
      : 0;
  const wrong = answers.filter((a) => !a.correct);

  return (
    <section aria-label="Resumen de la sesión" className="mt-8 text-center">
      <p className="text-muted-foreground text-sm tracking-widest uppercase">
        Sesión terminada
      </p>
      <p className="display-number mt-2 text-7xl">
        {hits}
        <span className="text-muted-foreground text-3xl">/{answers.length}</span>
      </p>
      <p className="text-muted-foreground mt-2">
        {(avgMs / 1000).toFixed(1)}s de media
        {avgMs <= FAST_MS ? " — ese es el ritmo." : " — busca bajar de 4s."}
      </p>

      {wrong.length > 0 && (
        <div className="mx-auto mt-6 max-w-md rounded-lg border p-4 text-left">
          <p className="text-sm font-medium">Para repasar:</p>
          <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
            {wrong.map(({ card }, i) => {
              const p = promptFor(card);
              return (
                <li key={`${cardId(card)}-${i}`}>
                  {p.question}{" "}
                  <strong className="text-foreground">{p.answerLabel}</strong>
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground mt-3 text-xs">
            Volverán a salir pronto: el sistema las repite hasta que dejen de costarte.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={onRepeat}>
          <RotateCcw aria-hidden /> Otra ronda
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/entrenar">Otro entrenamiento</Link>
        </Button>
      </div>
    </section>
  );
}
