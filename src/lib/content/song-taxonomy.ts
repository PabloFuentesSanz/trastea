/**
 * Vocabulario cerrado del catálogo de canciones.
 *
 * Los tres ejes por los que se navega el repertorio (y por los que el curso
 * pide canciones): estilo musical, técnica que se practica y colección
 * temática. Al ser enums, `content:audit` casca si una ficha inventa un valor,
 * y los filtros de /canciones no dependen de texto libre.
 */

// ---------- estilos ----------

const STYLE_LABELS = {
  rock: "Rock",
  "rock-clasico": "Rock clásico",
  "hard-rock": "Hard rock",
  metal: "Metal",
  "metal-moderno": "Metal moderno",
  punk: "Punk",
  grunge: "Grunge",
  indie: "Indie / alternativo",
  prog: "Progresivo",
  fusion: "Fusión",
  pop: "Pop",
  "new-wave": "New wave / 80s",
  blues: "Blues",
  soul: "Soul / R&B",
  funk: "Funk",
  disco: "Disco",
  jazz: "Jazz",
  bossa: "Bossa nova",
  latin: "Latino",
  flamenco: "Flamenco",
  folk: "Folk / cantautor",
  country: "Country",
  reggae: "Reggae / ska",
  surf: "Surf",
  clasica: "Clásica",
  fingerstyle: "Fingerstyle",
} as const satisfies Record<string, string>;

export type SongStyle = keyof typeof STYLE_LABELS;

export const SONG_STYLE_LABEL: Record<SongStyle, string> = STYLE_LABELS;
export const SONG_STYLES = Object.keys(STYLE_LABELS) as [SongStyle, ...SongStyle[]];

// ---------- técnicas ----------

export type TechniqueGroup =
  "mano-derecha" | "mano-izquierda" | "diapason" | "ritmo" | "musico";

export const TECHNIQUE_GROUP_LABEL: Record<TechniqueGroup, string> = {
  "mano-derecha": "Mano derecha",
  "mano-izquierda": "Mano izquierda",
  diapason: "Diapasón",
  ritmo: "Ritmo",
  musico: "Oficio",
};

const TECHNIQUE_ENTRIES = {
  // mano derecha
  rasgueo: { label: "Rasgueo", group: "mano-derecha" },
  "pua-alterna": { label: "Púa alterna", group: "mano-derecha" },
  downpicking: { label: "Downpicking", group: "mano-derecha" },
  "tremolo-picking": { label: "Trémolo picking", group: "mano-derecha" },
  "palm-mute": { label: "Palm mute", group: "mano-derecha" },
  galope: { label: "Galope", group: "mano-derecha" },
  fingerstyle: { label: "Fingerstyle", group: "mano-derecha" },
  "travis-picking": { label: "Travis picking", group: "mano-derecha" },
  "arpegio-pua": { label: "Arpegio con púa", group: "mano-derecha" },
  "hybrid-picking": { label: "Hybrid picking", group: "mano-derecha" },
  "sweep-picking": { label: "Sweep picking", group: "mano-derecha" },
  "string-skipping": { label: "String skipping", group: "mano-derecha" },
  "muteo-percusivo": { label: "Muteo percusivo", group: "mano-derecha" },
  "funk-16ths": { label: "Semicorcheas funk", group: "mano-derecha" },
  "pulgar-bajo": { label: "Pulgar independiente", group: "mano-derecha" },

  // mano izquierda
  "acordes-abiertos": { label: "Acordes abiertos", group: "mano-izquierda" },
  cejilla: { label: "Cejilla", group: "mano-izquierda" },
  "power-chords": { label: "Power chords", group: "mano-izquierda" },
  triadas: { label: "Tríadas", group: "mano-izquierda" },
  "acordes-septima": { label: "Acordes de séptima", group: "mano-izquierda" },
  "shell-voicings": { label: "Shell voicings", group: "mano-izquierda" },
  "drop-2": { label: "Drop 2", group: "mano-izquierda" },
  "chord-melody": { label: "Chord melody", group: "mano-izquierda" },
  legato: { label: "Legato", group: "mano-izquierda" },
  bending: { label: "Bending", group: "mano-izquierda" },
  vibrato: { label: "Vibrato", group: "mano-izquierda" },
  slide: { label: "Slide / deslizamientos", group: "mano-izquierda" },
  tapping: { label: "Tapping", group: "mano-izquierda" },
  armonicos: { label: "Armónicos", group: "mano-izquierda" },
  "dobles-cuerdas": { label: "Dobles cuerdas", group: "mano-izquierda" },
  octavas: { label: "Octavas", group: "mano-izquierda" },

  // diapasón
  pentatonica: { label: "Pentatónica", group: "diapason" },
  "escala-blues": { label: "Escala de blues", group: "diapason" },
  "escala-mayor": { label: "Escala mayor", group: "diapason" },
  modos: { label: "Modos", group: "diapason" },
  arpegios: { label: "Arpegios", group: "diapason" },
  "tres-notas-por-cuerda": { label: "Tres notas por cuerda", group: "diapason" },
  desplazamientos: { label: "Cambios de posición", group: "diapason" },

  // ritmo
  sincopa: { label: "Síncopa", group: "ritmo" },
  contratiempo: { label: "Contratiempo", group: "ritmo" },
  shuffle: { label: "Shuffle", group: "ritmo" },
  ternario: { label: "Ternario / 6/8", group: "ritmo" },
  "metrica-impar": { label: "Métrica impar", group: "ritmo" },
  "cambios-de-tempo": { label: "Cambios de tempo", group: "ritmo" },
  silencios: { label: "Silencios", group: "ritmo" },

  // oficio
  capo: { label: "Cejilla mecánica", group: "musico" },
  "afinacion-alternativa": { label: "Afinación alternativa", group: "musico" },
  "cantar-y-tocar": { label: "Cantar y tocar", group: "musico" },
  dinamica: { label: "Dinámica", group: "musico" },
  improvisacion: { label: "Improvisación", group: "musico" },
  transcripcion: { label: "Transcripción", group: "musico" },
  "walking-bass": { label: "Walking bass", group: "musico" },
} as const satisfies Record<string, { label: string; group: TechniqueGroup }>;

export type SongTechnique = keyof typeof TECHNIQUE_ENTRIES;

export const SONG_TECHNIQUES = Object.keys(TECHNIQUE_ENTRIES) as [
  SongTechnique,
  ...SongTechnique[],
];

export function techniqueLabel(slug: SongTechnique): string {
  return TECHNIQUE_ENTRIES[slug].label;
}

export function techniqueGroup(slug: SongTechnique): TechniqueGroup {
  return TECHNIQUE_ENTRIES[slug].group;
}

// ---------- colecciones temáticas ----------

const COLLECTION_ENTRIES = {
  "primeras-canciones": {
    label: "Tus primeras canciones",
    tagline:
      "Tres o cuatro acordes abiertos y a cantar. Suenan a canción desde el día uno.",
  },
  "solo-dos-acordes": {
    label: "Solo dos acordes",
    tagline: "Cuando aún cambias lento. Toda la canción vive en dos formas.",
  },
  fogata: {
    label: "De fogata",
    tagline:
      "Acústica, voz y nadie mirándote los dedos. El repertorio que siempre se pide.",
  },
  "cejilla-supervivencia": {
    label: "Supervivencia con cejilla",
    tagline: "Canciones que fuerzan la cejilla sin que te sangre la mano.",
  },
  "power-chords-101": {
    label: "Power chords 101",
    tagline: "Dos dedos, distorsión y toda una vida de rock por delante.",
  },
  "riffs-legendarios": {
    label: "Riffs legendarios",
    tagline: "Esos ocho compases que reconoce hasta tu madre.",
  },
  "intros-reconocibles": {
    label: "Intros que todos reconocen",
    tagline: "Efecto inmediato: tocas cuatro segundos y alguien gira la cabeza.",
  },
  "solos-para-empezar": {
    label: "Solos para empezar",
    tagline: "Solos famosos, cortos y humanos. Tu primera vez soltando la mano.",
  },
  "blues-esencial": {
    label: "Blues esencial",
    tagline: "Los doce compases y todo lo que te enseñan sobre frasear.",
  },
  "jazz-standards": {
    label: "Standards de jazz",
    tagline: "El repertorio común. Lo que se toca en cualquier jam del mundo.",
  },
  "bossa-y-latin": {
    label: "Bossa y latino",
    tagline: "Pulgar independiente, síncopa y acordes bonitos.",
  },
  "funk-groove": {
    label: "Funk y groove",
    tagline: "La mano derecha no para nunca: lo que suena son los silencios.",
  },
  "metal-resistencia": {
    label: "Metal: resistencia",
    tagline: "Downpicking, palm mute y antebrazo. Gimnasio puro.",
  },
  "punk-y-velocidad": {
    label: "Punk y velocidad",
    tagline: "Tres acordes, mucha prisa y cero excusas.",
  },
  "fingerstyle-esencial": {
    label: "Fingerstyle esencial",
    tagline: "Bajo con el pulgar, melodía con los dedos, todo a la vez.",
  },
  "ritmo-y-rasgueo": {
    label: "Ritmo y rasgueo",
    tagline: "Canciones donde el patrón de mano derecha ES la canción.",
  },
  "en-espanol": {
    label: "En español",
    tagline: "Lo que se canta aquí. De Sabina a Extremoduro.",
  },
  "rock-espanol": {
    label: "Clásicos del rock español",
    tagline: "El cancionero que sonaba en todos los garajes de este país.",
  },
  "indie-y-alternativo": {
    label: "Indie y alternativo",
    tagline: "Arpegios limpios, capo alto y acordes con nombres raros.",
  },
  "country-y-folk": {
    label: "Country y folk",
    tagline: "Travis picking, capo y una mano derecha de relojero.",
  },
  "reggae-y-ska": {
    label: "Reggae y ska",
    tagline: "Todo en el contratiempo. El mejor entrenamiento rítmico que existe.",
  },
  "metricas-raras": {
    label: "Métricas raras",
    tagline: "5/4, 7/8 y compases que se te escapan hasta que los cuentas.",
  },
  "tecnica-avanzada": {
    label: "Técnica avanzada",
    tagline: "Sweep, tapping, string skipping. Cuando ya tienes base y quieres más.",
  },
  "instrumentales-bonitas": {
    label: "Instrumentales bonitas",
    tagline: "Sin voz que te tape: la guitarra cuenta la historia entera.",
  },
  "clasica-dominio-publico": {
    label: "Clásica de dominio público",
    tagline: "Partituras libres: aquí sí puedes tener la tab completa dentro de Trastea.",
  },
  "practica-con-metronomo": {
    label: "Para el metrónomo",
    tagline: "Canciones-gimnasio: tempo claro, patrón repetido, progreso medible.",
  },
} as const satisfies Record<string, { label: string; tagline: string }>;

export type SongCollection = keyof typeof COLLECTION_ENTRIES;

export const SONG_COLLECTIONS = Object.keys(COLLECTION_ENTRIES) as [
  SongCollection,
  ...SongCollection[],
];

export function collectionLabel(slug: SongCollection): string {
  return COLLECTION_ENTRIES[slug].label;
}

export function collectionTagline(slug: SongCollection): string {
  return COLLECTION_ENTRIES[slug].tagline;
}

// ---------- niveles ----------

export const SONG_LEVEL_LABEL: Record<number, string> = {
  1: "Primeros acordes",
  2: "Principiante",
  3: "Intermedio",
  4: "Avanzado",
  5: "Reto",
};
