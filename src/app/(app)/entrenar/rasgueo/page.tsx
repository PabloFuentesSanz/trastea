import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StrumTrainer } from "@/components/train/strum-trainer";
import { RASGUEO_SLUG, getDrill } from "@/lib/train/catalog";
import { isTrainLevel, type TrainLevel } from "@/lib/train/taxonomy";

export const metadata: Metadata = { title: "Rasgueo con el click" };

export default async function RasgueoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const drill = getDrill(RASGUEO_SLUG);
  const pedido = Number(typeof sp.nivel === "string" ? sp.nivel : "");
  const nivel: TrainLevel = isTrainLevel(pedido) ? pedido : 1;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        href="/entrenar"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Entrenar
      </Link>
      <h1 className="mt-2 text-4xl">{drill?.title ?? "Rasgueo con el click"}</h1>
      <p className="text-muted-foreground mt-3">{drill?.summary}</p>
      <StrumTrainer nivel={nivel} />
    </main>
  );
}
