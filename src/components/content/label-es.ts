/**
 * De una clave camelCase a una etiqueta en español, con sus tildes.
 *
 * Las claves de `<Ficha>` son identificadores JS y no pueden llevar acentos,
 * así que `queEs` salía como "QUE ES" y `duracion` como "DURACION" — en 158
 * etiquetas distintas, repartidas por todas las fichas y lecciones.
 *
 * Lo difícil es el "que": lleva tilde cuando pregunta ("para qué sirve") y no
 * la lleva cuando es relativo ("lo que cambia"). Se decide por la palabra de
 * delante, que es como se decide en español.
 */

/** Palabras que llevan tilde siempre, sea cual sea el contexto. */
const SIEMPRE: Record<string, string> = {
  dia: "día",
  duracion: "duración",
  posicion: "posición",
  tecnica: "técnica",
  tecnico: "técnico",
  puas: "púas",
  pua: "púa",
  musica: "música",
  practica: "práctica",
  teoria: "teoría",
  metronomo: "metrónomo",
  facil: "fácil",
  faciles: "fáciles",
  dificil: "difícil",
  dificiles: "difíciles",
  util: "útil",
  mas: "más",
  numero: "número",
  proposito: "propósito",
  atencion: "atención",
  razon: "razón",
  version: "versión",
  cancion: "canción",
  patron: "patrón",
  leccion: "lección",
  sesion: "sesión",
  repeticion: "repetición",
  ejecucion: "ejecución",
  articulacion: "articulación",
  afinacion: "afinación",
  entonacion: "entonación",
  inversion: "inversión",
  progresion: "progresión",
  extension: "extensión",
  extensiones: "extensiones",
  tension: "tensión",
  presion: "presión",
  septima: "séptima",
  septimas: "séptimas",
  cromatico: "cromático",
  armonico: "armónico",
  armonica: "armónica",
  melodico: "melódico",
  tonica: "tónica",
  ritmico: "rítmico",
  definicion: "definición",
  creias: "creías",
  asi: "así",
  aqui: "aquí",
  ahi: "ahí",
  despues: "después",
  ademas: "además",
  demas: "demás",
  nacio: "nació",
  nacieron: "nacieron",
  segun: "según",
  minimo: "mínimo",
  maximo: "máximo",
  ultimo: "último",
  unico: "único",
  unica: "única",
  rapido: "rápido",
  automatico: "automático",
  diapason: "diapasón",
  acordeon: "acordeón",
  digitacion: "digitación",
  notacion: "notación",
  resolucion: "resolución",
  construccion: "construcción",
  conduccion: "conducción",
  formula: "fórmula",
  oido: "oído",
  metodo: "método",
  metrica: "métrica",
  mastil: "mástil",
  angulo: "ángulo",
  armonia: "armonía",
  articulo: "artículo",
  clasica: "clásica",
  clasico: "clásico",
  circulo: "círculo",
  diagnostico: "diagnóstico",
  dinamica: "dinámica",
  dorico: "dórico",
  eolico: "eólico",
  epoca: "época",
  escandalo: "escándalo",
  filosofia: "filosofía",
  identico: "idéntico",
  jonico: "jónico",
  limite: "límite",
  linea: "línea",
  mecanica: "mecánica",
  modulo: "módulo",
  numeros: "números",
  pendulo: "péndulo",
  raices: "raíces",
  rafaga: "ráfaga",
  silaba: "sílaba",
  simetria: "simetría",
  tipico: "típico",
  tiron: "tirón",
  triada: "tríada",
  valvulas: "válvulas",
  algodon: "algodón",
  reves: "revés",
  ultima: "última",
  ultimos: "últimos",
  ultimas: "últimas",
  // la eñe, que tampoco cabe en un identificador
  tamano: "tamaño",
  muneca: "muñeca",
  munecas: "muñecas",
  senal: "señal",
  senales: "señales",
  ano: "año",
  anos: "años",
  acompanando: "acompañando",
  acompanar: "acompañar",
  acompanamiento: "acompañamiento",
  companero: "compañero",
  puno: "puño",
  cana: "caña",
  espanol: "español",
  manana: "mañana",
};

/**
 * Casi todo lo acabado en -ción/-sión lleva tilde ("solución", "decisión") y
 * casi nada acabado en -ciones/-siones la lleva ("canciones"). Con la regla
 * se acentúa toda la familia sin ir listándola palabra a palabra.
 */
function porTerminacion(palabra: string): string | undefined {
  if (palabra.length > 5 && /(c|s)ion$/.test(palabra)) {
    return palabra.slice(0, -4) + (palabra.endsWith("cion") ? "ción" : "sión");
  }
  return undefined;
}

/** Cifrado suelto: "maj7", "m7b5", "sus4" se escriben tal cual. */
const CIFRADO = /^(maj|min|m|dim|aug|sus|add)?\d+([b#]\d+)?$/;

/** Nota o acorde con mayúscula: "C", "Am", "F#", "Bbmaj7". */
const ACORDE = /^[A-G][b#]?(m|maj|min|dim|aug|sus|add|M)?\d*$/;

/** Grados de la armonía: I, IV, VII. */
const ROMANO = /^(I{1,3}|IV|V|VI{1,3}|VII)$/;

/**
 * "Y", "O" sueltas nunca son notas. La "A" sí puede serlo, pero solo cuando
 * cierra la etiqueta ("sobreA", "seccionA"): en medio es la preposición
 * ("deBluesAJazz").
 */
function esPalabraSuelta(trozo: string, esUltimo: boolean): boolean {
  if (/^[YOEU]$/.test(trozo)) return true;
  return trozo === "A" && !esUltimo;
}

/** Interrogativos: llevan tilde solo cuando preguntan. */
const INTERROGATIVOS: Record<string, string> = {
  que: "qué",
  como: "cómo",
  donde: "dónde",
  cuando: "cuándo",
  cual: "cuál",
  cuales: "cuáles",
  cuanto: "cuánto",
  cuanta: "cuánta",
  cuantos: "cuántos",
  cuantas: "cuántas",
  quien: "quién",
};

/** Delante de un interrogativo, estas palabras lo confirman como pregunta. */
const PREPOSICIONES = new Set([
  "por",
  "para",
  "con",
  "sobre",
  "a",
  "de",
  "en",
  "hasta",
  "desde",
  "y",
  "sin",
]);

/** Delante de un "que", estas lo convierten en relativo: "lo que", "el que". */
const ARTICULOS = new Set(["lo", "la", "el", "los", "las"]);

export function humanizeEs(key: string): string {
  const trozos = key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    // el cifrado se queda de una pieza ("m7b5"); en lo demás la cifra se
    // despega de la palabra ("razon1" → "razón 1")
    .flatMap((trozo) =>
      CIFRADO.test(trozo.toLowerCase()) || ACORDE.test(trozo)
        ? [trozo]
        : trozo
            .replace(/([a-zA-Z])(\d)/g, "$1 $2")
            .split(" ")
            .filter(Boolean),
    );

  const palabras = trozos.map((t) => t.toLowerCase());

  const salida = trozos.map((original, i) => {
    const suelta = esPalabraSuelta(original, i === trozos.length - 1);

    // el cifrado va en minúscula ("m7b5"), las notas y los grados en
    // mayúscula ("Am", "IV"), y ninguno lleva tilde
    if (!suelta && CIFRADO.test(original.toLowerCase())) {
      return original.toLowerCase();
    }
    if (!suelta && (ACORDE.test(original) || ROMANO.test(original))) {
      return original;
    }

    const palabra = palabras[i];
    const anterior = palabras[i - 1];

    if (palabra in INTERROGATIVOS) {
      // relativo si lleva artículo delante; pregunta si abre la etiqueta o
      // viene detrás de preposición
      if (anterior && ARTICULOS.has(anterior)) return palabra;
      if (i === 0 || (anterior && PREPOSICIONES.has(anterior))) {
        return INTERROGATIVOS[palabra];
      }
      return palabra;
    }

    // "está" del verbo, no "esta" del demostrativo: detrás de un
    // interrogativo siempre lo es
    if (palabra === "esta" && anterior && anterior in INTERROGATIVOS) {
      return "está";
    }

    return SIEMPRE[palabra] ?? porTerminacion(palabra) ?? palabra;
  });

  const frase = salida.join(" ");
  // "m7b5" abre en minúscula: es cifrado, no una frase
  if (CIFRADO.test(trozos[0].toLowerCase())) return frase;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}
