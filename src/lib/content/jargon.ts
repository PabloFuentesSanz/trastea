/**
 * La jerga del curso, y la regla de que no se suelta sin presentarla.
 *
 * Un día decía "el vamp C-Am-F-G y el targeting: hoy solo dianas" sin haber
 * dicho nunca qué es un vamp, qué es targeting ni por qué una diana. La
 * teoría estaba en la wiki, a un clic — pero el que lee no sabe que le falta
 * una palabra hasta que ya se ha perdido.
 *
 * La regla: la PRIMERA vez que el curso usa un término, ese día lo presenta.
 * Presentarlo es una de dos: definirlo ahí mismo (en negrita, que es como se
 * marca "esto es una palabra nueva") o enlazar su ficha con [[slug]]. A
 * partir de ahí ya es vocabulario compartido y se usa sin ceremonia.
 */

export interface Termino {
  /** como se escribe en el texto */
  termino: string;
  /** plurales y variantes que cuentan como la misma palabra */
  alias?: readonly string[];
  /** ficha de la wiki que lo cuenta entero, si la hay */
  wiki?: string;
}

export const JERGA: readonly Termino[] = [
  { termino: "vamp", alias: ["vamps"] },
  { termino: "targeting" },
  { termino: "diana", alias: ["dianas"] },
  { termino: "caja", alias: ["cajas"], wiki: "como-estudiar-escalas" },
  { termino: "pentatónica", alias: ["pentatónicas"], wiki: "pentatonicas" },
  { termino: "intervalo", alias: ["intervalos"], wiki: "intervalos" },
  { termino: "power chord", alias: ["power chords"], wiki: "power-chords" },
  { termino: "riff", alias: ["riffs"] },
  { termino: "arpegio", alias: ["arpegios"], wiki: "arpegios" },
  { termino: "tríada", alias: ["tríadas"], wiki: "triadas-e-inversiones" },
  { termino: "inversión", alias: ["inversiones"], wiki: "triadas-e-inversiones" },
  { termino: "cejilla", alias: ["cejillas"] },
  { termino: "campo armónico", wiki: "campo-armonico" },
  { termino: "swing", wiki: "swing-vs-straight" },
  { termino: "groove", alias: ["grooves"], wiki: "sincopa" },
  { termino: "síncopa", alias: ["síncopas"], wiki: "sincopa" },
  { termino: "shell", alias: ["shells"], wiki: "shell-voicings" },
  { termino: "voicing", alias: ["voicings"], wiki: "drop-2" },
  { termino: "guide tone", alias: ["guide tones"], wiki: "guide-tones" },
  { termino: "enclosure", alias: ["enclosures"], wiki: "enclosures" },
  { termino: "turnaround", alias: ["turnarounds"], wiki: "turnarounds" },
  { termino: "comping" },
  { termino: "lick", alias: ["licks"] },
  { termino: "ciclo de cuartas", wiki: "circulo-de-cuartas" },
  { termino: "CAGED", wiki: "caged" },
  // "modo" a secas es palabra corriente ("en modo menor"); la jerga es el plural
  { termino: "modos", wiki: "modos" },
  { termino: "dominante", alias: ["dominantes"], wiki: "acordes-de-septima" },
  { termino: "palm mute", wiki: "palm-mute" },
  { termino: "downpicking" },
  { termino: "legato", wiki: "legato" },
  { termino: "sweep", wiki: "sweep-picking" },
  { termino: "bend", alias: ["bends"], wiki: "bending-y-vibrato" },
  { termino: "vibrato", wiki: "bending-y-vibrato" },
  { termino: "púa alterna", wiki: "pua-alterna" },
  { termino: "3nps", alias: ["notas por cuerda"], wiki: "tres-notas-por-cuerda" },
  // igual con "tensión", que aquí casi siempre es la del hombro
  { termino: "tensiones", wiki: "extensiones-9-11-13" },
  { termino: "cromatismo", alias: ["cromatismos"], wiki: "escalas-bebop" },
  { termino: "unísono", alias: ["unísonos"] },
  { termino: "contratiempo", alias: ["contratiempos"], wiki: "sincopa" },
  { termino: "subdivisión", alias: ["subdivisiones"], wiki: "subdivision-metronomo-2y4" },
] as const;

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formas(t: Termino): string[] {
  return [t.termino, ...(t.alias ?? [])];
}

/** Los límites de palabra de JS no valen con acentos: se hacen a mano. */
function conBordes(forma: string): RegExp {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapar(forma)}([^\\p{L}\\p{N}]|$)`, "iu");
}

export function mencionado(cuerpo: string, t: Termino): boolean {
  return formas(t).some((f) => conBordes(f).test(cuerpo));
}

/**
 * Presentado = definido ahí mismo (**en negrita**) o enlazado a su ficha.
 * Con eso el lector sabe que la palabra es nueva y dónde mirar.
 */
export function presentado(cuerpo: string, t: Termino): boolean {
  const enNegrita = formas(t).some((f) =>
    new RegExp(`\\*\\*[^*]*${escapar(f)}[^*]*\\*\\*`, "iu").test(cuerpo),
  );
  if (enNegrita) return true;
  if (t.wiki === undefined) return false;
  return (
    cuerpo.includes(`[[${t.wiki}]]`) ||
    new RegExp(`<WikiLink\\s+slug="${escapar(t.wiki)}"`).test(cuerpo) ||
    cuerpo.includes(`(/wiki/${t.wiki})`)
  );
}

/** El primer día del curso que usa cada término, en el orden en que se estudia. */
export function primerasApariciones(
  dias: readonly { id: string; cuerpo: string }[],
  jerga: readonly Termino[] = JERGA,
): { termino: Termino; dia: string; presentado: boolean }[] {
  const salida: { termino: Termino; dia: string; presentado: boolean }[] = [];
  for (const t of jerga) {
    const dia = dias.find((d) => mencionado(d.cuerpo, t));
    if (!dia) continue;
    salida.push({ termino: t, dia: dia.id, presentado: presentado(dia.cuerpo, t) });
  }
  return salida;
}
