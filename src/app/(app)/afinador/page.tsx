import type { Metadata } from "next";
import { TunerPanel } from "@/components/tuner/tuner-panel";
import { TUNINGS } from "@/data/tunings";

export const metadata: Metadata = { title: "Afinador" };

export default async function AfinadorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pedida = typeof params.afinacion === "string" ? params.afinacion : undefined;
  const inicial = pedida && pedida in TUNINGS ? pedida : "standard";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Afinador</h1>
      <p className="text-muted-foreground mt-1">
        Toca una cuerda al aire y te dice cuánto le falta, en cents. Nueve afinaciones, y
        cada cuerda suena para afinar de oído si prefieres.
      </p>
      <TunerPanel initialTuning={inicial} />

      <section aria-label="Cómo afinar bien" className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Para que aguante</h2>
        <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
          <li>
            <strong className="text-foreground">
              Sube hasta la nota, no bajes a ella.
            </strong>{" "}
            Si te pasas, afloja por debajo y vuelve a subir: la cuerda se asienta tirando,
            y si llegas aflojando se desafina sola en dos minutos.
          </li>
          <li>
            <strong className="text-foreground">
              Una cuerda cada vez, y repite la ronda.
            </strong>{" "}
            Cada clavija cambia la tensión del mástil y desafina un poco a las demás. La
            segunda vuelta es la que deja la guitarra afinada.
          </li>
          <li>
            <strong className="text-foreground">Toca fuerte pero limpio.</strong> Una
            cuerda pulsada muy fuerte sube de tono en el ataque; espera medio segundo a
            que se asiente y lee entonces.
          </li>
          <li>
            <strong className="text-foreground">Estira las cuerdas nuevas.</strong> Tira
            de ellas suavemente hacia arriba y vuelve a afinar, tres o cuatro veces, hasta
            que deje de bajar.
          </li>
        </ul>
      </section>
    </main>
  );
}
