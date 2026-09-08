import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RhythmTap } from "@/components/train/rhythm-tap";
import { RITMO_A_GOLPE_SLUG, getDrill } from "@/lib/train/catalog";
import { isTrainLevel, TRAIN_LEVEL_LABEL } from "@/lib/train/taxonomy";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ritmo a golpe" };

/** El tempo de cada nivel: más lento es más difícil, porque hay más hueco donde perderse. */
const BPM_POR_NIVEL: Record<number, number> = { 1: 100, 2: 80, 3: 60 };

export default async function RitmoAGolpePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const drill = getDrill(RITMO_A_GOLPE_SLUG);
  const pedido = Number(typeof sp.nivel === "string" ? sp.nivel : "");
  const nivel = isTrainLevel(pedido) && pedido <= 3 ? pedido : 1;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/entrenar"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Entrenar
      </Link>
      <h1 className="mt-2 text-4xl">{drill?.title ?? "Ritmo a golpe"}</h1>
      <p className="text-muted-foreground mt-3">{drill?.summary}</p>

      <section aria-label="Nivel" className="mt-6">
        <h2 className="lbl">Nivel</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {drill?.levels.map((l) => (
            <Link
              key={l.level}
              href={`/entrenar/ritmo-a-golpe?nivel=${l.level}`}
              aria-current={l.level === nivel ? "true" : undefined}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors",
                l.level === nivel
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className="font-medium">
                {l.level} · {TRAIN_LEVEL_LABEL[l.level]}
              </span>
              <span
                className={cn(
                  "block text-xs",
                  l.level === nivel
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <RhythmTap key={nivel} bpm={BPM_POR_NIVEL[nivel] ?? 80} />

      <p className="text-muted-foreground mt-4 text-xs">
        Los milisegundos se miden contra el reloj de audio, así que lo que cuenta es tu
        oído y tu mano, no el navegador. Esta tanda no se guarda: es un termómetro para
        antes de practicar.
      </p>
    </main>
  );
}
