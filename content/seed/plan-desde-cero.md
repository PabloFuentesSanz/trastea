# Plan — Módulo «Desde cero» (4 semanas, 20 días, 30 min/día)

Fuente del módulo `desde-cero` (order 1, level `cero`, `max_song_level: 1`).
Para quien nunca ha cogido una guitarra o la ha cogido sin método. La regla
de todo el módulo: **cada día se toca una canción de verdad**, y cada día dice
en su `para_que` dónde vas a usar lo que practicas.

Sesión tipo (30 min): calentar y afinar (3-5') → lo nuevo (10') → cambios o
ritmo (7-8') → la canción (7-10'). Los días 5 son repaso con un reto medible.

Vocabulario: todo se presenta la primera vez en **negrita** con su definición
en la misma frase (regla de `jargon.ts`). Las palabras de la lista JERGA que
este módulo estrena: **riff** (w01-d2), **arpegio** (w03-d4), **power chord**
(w04-d2), **vamp** (w04-d4). Nada de pentatónica, caja, intervalo ni tríada:
eso empieza en el módulo A.

Primitivas: `<Acorde nombre="Em" />` para los acordes que el sistema conoce
(Em, Am, A, E, D, G, C, Dm, F, A5, E5, D5, G5…). El D6/9 de A Horse with No
Name NO parsea como acorde: se dibuja con `<Mastil notas="6:2, 5:0, 4:0, 3:2,
2:0, 1:0" hasta="4" />`. El Fa «pequeño» (xx3211) se dibuja con
`<Acorde nombre="F" trastes="x x 3 2 1 1" />`. Los patrones de mano derecha
con `<Rasgueo patron="↓ · ↓↑ · ↑ ↓↑" acordes="Em" bpm="70" queHacer="…" />`.

## Semana 1 — La guitarra en las manos (`desde-cero-w01`)

focus: "Postura, afinar, primer riff y tus dos primeros acordes"

| Día | Título                         | Lo nuevo                                                                                                                              | Canción                                 | Ejercicios (slug)                                                                    |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| d1  | Primer día con la guitarra     | Postura sentado, mano derecha con púa, nombre de las seis cuerdas (Mi La Re Sol Si Mi), afinar con `/afinador`, melodía en una cuerda | himno-de-la-alegria                     | cuerdas-al-aire (tool /afinador), melodia-una-cuerda                                 |
| d2  | Mi menor, tu primer acorde     | Em con dos dedos, rasguear en negras contando 1-2-3-4 con el metrónomo a 60; **riff**: el de Seven Nation Army en la 5ª cuerda        | seven-nation-army                       | acorde-em, rasgueo-negras, melodia-una-cuerda                                        |
| d3  | Dos acordes, una canción       | La forma D6/9 (dos dedos de Em un poco más abajo), cambio Em ↔ D6/9 sin parar la mano                                                 | a-horse-with-no-name                    | primeros-cambios, rasgueo-negras                                                     |
| d4  | La menor y la mano que no para | Am (la forma de Em bajada una cuerda + dedo 1), cambio Em ↔ Am, patrón ↓ · ↓↑ ↓ · ↓ · (entra el «y»)                                  | a-horse-with-no-name                    | primeros-cambios, rasgueo-negras (variante con corcheas), cambios-de-acorde-1-minuto |
| d5  | Repaso y primer reto           | Reto: Em ↔ Am 20 cambios en un minuto; Horse entera 2 minutos sin parar a 100 bpm; riff de Seven Nation a 80 con el click             | a-horse-with-no-name, seven-nation-army | cambios-de-acorde-1-minuto, primeros-cambios, melodia-una-cuerda                     |

Wiki que estrena esta semana (la escribe el agente de la semana 1):
`postura-y-manos`, `afinar-la-guitarra`. Ya existen: `anatomia-guitarra`,
`cuerdas`, `puas`, `como-practicar`, `calentamiento-y-salud`, `notas-musicales`.

## Semana 2 — La familia de La (`desde-cero-w02`)

focus: "A, D y E, y el patrón de rasgueo de media discografía"

| Día | Título                  | Lo nuevo                                                                                                       | Canción                       | Ejercicios                                                    |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| d1  | La y Mi: tres dedos     | A (x02220) y E (022100); cambio A ↔ E; leer un diagrama de acorde                                              | achy-breaky-heart             | acordes-a-y-e, cambios-de-acorde-1-minuto                     |
| d2  | Re, y ya tienes tres    | D (xx0232); cambios A ↔ D y D ↔ E; la regla del dedo que se queda                                              | wild-thing                    | familia-de-la, cambios-de-acorde-1-minuto                     |
| d3  | El patrón de siempre    | ↓ · ↓↑ · ↑ ↓↑ primero sobre E, luego sobre Wild Thing; la mano no se para en los huecos                        | wild-thing                    | rasgueo-de-siempre, familia-de-la                             |
| d4  | Sol, el acorde grande   | G (320003); cambio G ↔ A; Jane Says entera con dos acordes                                                     | jane-says                     | acorde-g, cambios-de-acorde-1-minuto                          |
| d5  | Reto: Wild Thing entera | Wild Thing con el patrón de siempre 2 minutos sin parar; A → D → E → A en bucle; A ↔ D 25 cambios en un minuto | wild-thing, achy-breaky-heart | rasgueo-de-siempre, familia-de-la, cambios-de-acorde-1-minuto |

Wiki que estrena (agente de la semana 2): `leer-un-diagrama-de-acorde`,
`cambios-de-acorde`, `patrones-de-rasgueo`. Ya existe `rasgueo-y-mano-derecha`.

## Semana 3 — La familia de Sol (`desde-cero-w03`)

focus: "C, el trío G-C-D, Mi menor y el arpegio con púa"

| Día | Título                                   | Lo nuevo                                                                                                                     | Canción                      | Ejercicios                                                     |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| d1  | Do, el que más cuesta                    | C (x32010) con los dedos «en escalera»; cambio C ↔ Am (el dedo 1 no se mueve); Knockin' con G D Am C                         | knockin-on-heavens-door      | acorde-c, cambios-de-acorde-1-minuto                           |
| d2  | G-C-D: el trío del folk                  | Cambios G ↔ C y C ↔ D; Leaving on a Jet Plane entera                                                                         | leaving-on-a-jet-plane       | familia-de-sol, rasgueo-de-siempre                             |
| d3  | Cuatro acordes que están en todas partes | G Em C D: Stand by Me; el mismo bucle sirve para decenas de canciones                                                        | stand-by-me                  | familia-de-sol, cambios-de-acorde-1-minuto                     |
| d4  | El arpegio con púa                       | **arpegio**: las notas del acorde de una en una; D y G en corcheas; Everybody Hurts                                          | everybody-hurts              | arpegio-pua-basico, familia-de-sol                             |
| d5  | Reto: Stand by Me entera                 | G → Em → C → D 2 minutos sin parar con el patrón de siempre; intro de Everybody Hurts arpegiada; G ↔ C 25 cambios por minuto | stand-by-me, everybody-hurts | familia-de-sol, arpegio-pua-basico, cambios-de-acorde-1-minuto |

Wiki que estrena (agente de la semana 3): `acordes-abiertos-basicos` (los
ocho acordes del módulo con su diagrama, y por qué se llaman abiertos).
Ya existe `arpegios` (enlazar con `[[arpegios]]`).

## Semana 4 — Ya tocas canciones (`desde-cero-w04`)

focus: "Dinámica, power chords, Fa pequeño y tu primer set"

| Día | Título                                | Lo nuevo                                                                                                                                              | Canción                                                    | Ejercicios                                         |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| d1  | Zombie y la dinámica                  | Em C G D con el patrón de siempre; tocar suave en la estrofa y fuerte en el estribillo sin cambiar el tempo                                           | zombie                                                     | rasgueo-suave-y-fuerte, familia-de-sol             |
| d2  | Power chords: dos dedos, todo el rock | **power chord** (E5, A5, D5: raíz y quinta, sin tercera), mover la forma por el mástil; Smoke on the Water y You Really Got Me                        | smoke-on-the-water, you-really-got-me                      | power-chords-dos-dedos, cambios-de-acorde-1-minuto |
| d3  | Re menor y el Fa pequeño              | Dm (xx0231) y F pequeño (xx3211); Bella ciao con Am Dm E C                                                                                            | bella-ciao                                                 | dm-y-fa-pequena, cambios-de-acorde-1-minuto        |
| d4  | Cuatro acordes, mil canciones         | **vamp**: un bucle corto de acordes; C Am F G con el Fa pequeño; Save Tonight                                                                         | vamp-c-am-f-g, save-tonight                                | cuatro-acordes-pop, rasgueo-de-siempre             |
| d5  | Tu primer set                         | Evaluación: tres canciones seguidas (Horse, Stand by Me, Knockin'); Am ↔ C y G ↔ D a 30 cambios por minuto; grabación con el móvil; quiz `desde-cero` | a-horse-with-no-name, stand-by-me, knockin-on-heavens-door | set-de-tres-canciones, cambios-de-acorde-1-minuto  |

Quiz `desde-cero` (lo escribe el agente de la semana 4, en `content/quizzes/desde-cero.mdx`,
mismo formato que `modulo-a.mdx`, 10 preguntas): nombres de las cuerdas,
qué es un acorde, leer un diagrama, cifrado básico (Em = Mi menor), qué es un
compás de 4/4 y una corchea, qué es un power chord, qué hace el capo, para qué
sirve el metrónomo, qué es un arpegio, qué es un riff.

## Ejercicios nuevos (17), todos nivel deducido (sin `level:` en el frontmatter)

| Slug                       | Categoría  | trains                            | Qué dibuja                                                                                                                                                                                        | bpm                        |
| -------------------------- | ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| cuerdas-al-aire            | diapason   | nombres-de-notas                  | `<Tab notas="6:0 5:0 4:0 3:0 2:0 1:0">` diciendo el nombre de cada cuerda                                                                                                                         | — (guiado, tool /afinador) |
| melodia-una-cuerda         | tecnica    | pua-alterna, movilidad            | `<Tab>` del Himno de la alegría en la 2ª cuerda (C=1 D=3 E=5 F=6 G=8): "2:5 2:5 2:6 2:8 \| 2:8 2:6 2:5 2:3 \| 2:1 2:1 2:3 2:5 \| 2:5 2:3 2:3 -" y la segunda frase igual acabando "2:3 2:1 2:1 -" | 60 → 90                    |
| acorde-em                  | tecnica    | rasgueo, cambios-de-acorde        | `<Acorde nombre="Em" />` + `<Rasgueo patron="↓ · ↓ · ↓ · ↓ ·" acordes="Em">`                                                                                                                      | 60 → 90                    |
| rasgueo-negras             | tecnica    | rasgueo, subdivision              | `<Rasgueo>` en negras y la variante con «y»                                                                                                                                                       | 60 → 100                   |
| primeros-cambios           | tecnica    | cambios-de-acorde                 | Em, D6/9 (Mastil notas), Am; rutina de cambios                                                                                                                                                    | 60 → 90                    |
| cambios-de-acorde-1-minuto | tecnica    | cambios-de-acorde, movilidad      | `<Acordes>` con la pareja del día; la rutina es cronómetro de 60 s contando cambios limpios (enlaza `/entrenar/cambios-de-acorde`)                                                                | — (guiado)                 |
| acordes-a-y-e              | tecnica    | cambios-de-acorde, rasgueo        | `<Acordes>` A y E                                                                                                                                                                                 | 60 → 90                    |
| familia-de-la              | tecnica    | cambios-de-acorde, acompanamiento | A, D, E en bucle con `<Rejilla compases="A \| D \| E \| A">`                                                                                                                                      | 60 → 100                   |
| rasgueo-de-siempre         | tecnica    | rasgueo, subdivision              | `<Rasgueo patron="↓ · ↓↑ · ↑ ↓↑">` sobre E y sobre A D E                                                                                                                                          | 60 → 100                   |
| acorde-g                   | tecnica    | cambios-de-acorde                 | `<Acordes>` G y A, cambio                                                                                                                                                                         | 60 → 90                    |
| acorde-c                   | tecnica    | cambios-de-acorde                 | `<Acordes>` C y Am, cambio                                                                                                                                                                        | 60 → 90                    |
| familia-de-sol             | tecnica    | cambios-de-acorde, acompanamiento | `<Rejilla compases="G \| Em \| C \| D">`                                                                                                                                                          | 60 → 100                   |
| arpegio-pua-basico         | tecnica    | pua-alterna, acompanamiento       | `<Tab>` arpegio de D (4:0 3:2 2:3 1:2 2:3 3:2 …) y de G en corcheas                                                                                                                               | 60 → 90                    |
| rasgueo-suave-y-fuerte     | tecnica    | rasgueo, independencia            | `<Rasgueo>` con la indicación de dinámica en la rutina                                                                                                                                            | 60 → 90                    |
| power-chords-dos-dedos     | tecnica    | cambios-de-acorde, palm-mute      | `<Acordes>` E5 A5 D5 y `<Tab>` moviendo la forma                                                                                                                                                  | 60 → 100                   |
| dm-y-fa-pequena            | tecnica    | cambios-de-acorde                 | `<Acordes>` Dm y F (trastes x x 3 2 1 1)                                                                                                                                                          | 60 → 90                    |
| cuatro-acordes-pop         | aplicacion | acompanamiento, cambios-de-acorde | `<Rejilla compases="C \| Am \| F \| G">` + `<Rasgueo>`                                                                                                                                            | 60 → 100                   |
| set-de-tres-canciones      | repertorio | acompanamiento, rasgueo           | `<Rejilla>` con el bucle de cada una de las tres                                                                                                                                                  | — (guiado)                 |

Canción nueva: `himno-de-la-alegria` (Beethoven, dominio público, nivel 1).
