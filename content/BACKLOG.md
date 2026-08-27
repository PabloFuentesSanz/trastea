# Backlog de contenido — la guía maestra

> Inventario exhaustivo de TODO el contenido que falta, priorizado y por lotes.
> Cómo usarla: elige el siguiente lote por orden de prioridad, genera con las
> skills (`add-lesson`, `add-wiki`, `/content-curator`), `pnpm content:audit`
> en verde, PR. Lo hecho se tacha, no se borra: la historia también documenta.
>
> Estado actual: **60 lecciones (módulos A, B y C) · 46 ejercicios ·
> 304 canciones · 0 tabs · 48 wiki · 3 quizzes**. El curso de 12 semanas del
> seed está COMPLETO.

---

## ✅ P1 — Módulo B: Armonía y arpegios (semanas 5-8) — HECHO

20 lecciones (`b-armonia-w05-d1` … `w08-d5`), 13 ejercicios nuevos
(shells-ciclo-cuartas, shells-blues-jazz, raices-ciclo-cuartas, oido-maj7-7-m7,
guide-tones-ii-v-i, ii-v-i-5-tonos, cantar-resolucion-7-3,
arpegios-7a-2-posiciones, arpegios-blues-jazz, arpegio-cantado,
pentatonica-5-cajas, frase-en-3-zonas, transcribir-2-frases), 4 canciones
(blue-bossa, so-what, all-blues, ii-v-i-loop), quiz `modulo-b` y `module.mdx`
real con checklist y grabación.

## ✅ P2 — Módulo C: Lenguaje y velocidad (semanas 9-12) — HECHO

20 lecciones (`c-lenguaje-w09-d1` … `w12-d5`), 14 ejercicios nuevos
(downpicking-sostenido, cambio-subdivisiones, dictado-ritmico,
acentos-desplazados, funk-16ths, 3nps-7-patrones, 3nps-legato,
secuencias-escala, frases-cruzando-posiciones, bends-afinados,
dobles-cuerdas-3as-6as, transcribir-blues-4-compases, solo-estructurado-12,
picos-velocidad), 7 canciones (chameleon, master-of-puppets, take-five, spain,
blues-lento-en-do, tema-estilo-plini, funk-16ths-e), quiz `modulo-c` y
`module.mdx` real. La w12-d5 cierra el curso con checklist global y las dos
grabaciones finales.

## ✅ Catálogo de canciones (15 → 304) — HECHO

Repertorio navegable por nivel, estilo, técnica que se practica, colección
temática y acordes que ya sabes. Vocabulario cerrado en
`src/lib/content/song-taxonomy.ts` (26 estilos, 51 técnicas, 26 colecciones),
filtrado puro y testeado en `song-filter.ts`, `/canciones` con facetas y estado
en la URL, y `content:audit` avisando de colecciones o técnicas sin repertorio.

## ✅ P0 — Revisión del 26/08 (feedback de Pablo) — HECHO

Las cuatro, con su regla en `content:audit` para que no vuelvan:

- [x] **Cajas de escala modeladas de verdad** (`src/lib/music/boxes.ts`):
      patrón de digitación por cuerda, no ventana rectangular de trastes.
      `<Mastil caja="1">`, y el audit rechaza `desde/hasta` en un mástil de
      escala cuyo pie hable de cajas.
- [x] **Siempre todas las formas y práctica cuerda a cuerda**: un artículo que
      declara `scale:` tiene que traer `<Cajas>` y `<PorCuerdas>`, o el build
      cae.
- [x] **`/escalas` con modos de vista**: entero, por cajas, por cuerdas, con el
      estado en la URL.
- [x] **Filtros de `/canciones` rediseñados**: de 133 chips y 7 pantallas hasta
      el primer resultado a 5 chips y 1,5 pantallas.

## P0 — Verificar los metadatos musicales del catálogo

Las 304 fichas se escribieron de memoria. El texto pedagógico y la
clasificación son sólidos; los **datos duros no están verificados uno a uno** y
son justo los que se ven en la app y alimentan los filtros.

- [ ] Repasar `key` contra una fuente fiable. Convención a fijar y aplicar:
      `key` = tonalidad real de la grabación, y `capo` describe las formas.
      Ahora mismo hay fichas con capo donde `key` es la del _shape_, no la que
      suena (`perfect`, `photograph`, `free-fallin`, `sound-of-silence`…).
- [ ] Repasar `bpm` (alimenta el botón "Metrónomo a N") y `capo`.
- [ ] Repasar `chords` en las fichas de nivel 1-2, que son las que sostienen el
      filtro "acordes que ya sé". Si hay duda, borrar el campo antes que dejarlo
      mal: sin `chords` la canción simplemente no aparece en ese filtro.
- [ ] Comprobar `tuning` en el repertorio de metal y grunge.

Sugerencia: hacerlo por lotes de una colección, con la grabación delante.

## P1 — Enganchar el catálogo al curso

El repertorio ya es consultable por técnica y nivel, pero las 60 lecciones
existentes siguen apuntando a las 15 canciones originales.

- [ ] Revisar los bloques `repertorio` de A/B/C y ofrecer alternativas del
      catálogo para el mismo objetivo (misma técnica, mismo nivel).
- [ ] Deep links desde las lecciones: `/canciones?tecnica=palm-mute&nivel=2`.
- [ ] Skill `add-song` en `.claude/skills`, hermana de `add-lesson`/`add-wiki`.
- [ ] Tabs propias (`/content/tabs`) para la colección
      `clasica-dominio-publico`: son las únicas que pueden vivir completas
      dentro de Trastea.

## ✅ Wiki: las 38 fichas de expansión — HECHO

De 48 a 86 artículos, sin huérfanos. Teoría (10), técnica (9), ritmo (3),
equipo (7), historia (4) y glosario/transversales (5).

Salieron dos cosas por el camino:

- **Datos musicales nuevos** que los artículos necesitaban y no existían: seis
  escalas (tonos enteros, las dos disminuidas, alterada, frigia dominante,
  lidia dominante) y cinco acordes (7b5, 7#5, 7b9, 7#9, 13).
- **Regla nueva en `content:audit`**: los deep links a herramientas
  (`/escalas?type=`, `/acordes?type=`, `/bases?prog=`, `/metronomo?sub=`, y la
  raíz) se validan contra los datos. Un id inexistente no rompía nada: la
  página caía al valor por defecto y el lector veía otra escala.

### Lo que queda pendiente de aquí

- [ ] `<Tab>` y `<Mastil>` asumen afinación estándar. La ficha de
      [[afinaciones-alternativas]] lo dice en un aviso, pero lo suyo sería un
      `afinacion="drop-d"` que además valide las notas contra ESA afinación.
- [ ] Categorías que siguen finas: historia tiene 4 fichas y da para más
      (country, funk, la guitarra en el soul); equipo podría llevar acústicas.

## Sonido: plan en tres fases

El agujero no era la notación, era que nada sonaba. Orden acordado:

- [x] **Fase 1 — bases de acompañamiento.** `<Rejilla>` se toca: bajo,
      acompañamiento con voces conducidas, cinco grooves, tempo, bucle y
      claqueta. Sin dependencias nuevas (Tone.js). Las 35 rejillas del
      repositorio son ya 35 bases.
- [x] **Fase 2a — las tabs suenan.** No hacían falta duraciones mixtas:
      nuestras tabs son series regulares y ya declaraban su figura. `porPulso`
      dice cuántas columnas caben en un pulso, la pauta resalta la que suena, y
      `content:audit` exige que los compases midan todos lo mismo en pulsos
      enteros. 72 tabs tocables; 4 con figuras mezcladas van `tocable="no"`.
- [x] **Estudio de bases (`/bases`).** Forma, tono, groove y tempo, con el
      estado en la URL. 17 progresiones (blues, jazz, modal, pop, ejercicios)
      transportables a los doce tonos con la escritura correcta —el bII7 de Re
      es Mib7, no Re#7—, gracias a `intervalBetween` + `transposeGrid`.
- [ ] **Fase 2b — figuras mezcladas dentro de una tab.** Para las 4 que hoy
      no suenan y para poder escribir ritmos de verdad: `cuerda:traste:figura`
      por columna, plicas dibujadas y la regla de que cada compás sume.
- [ ] **Fase 3 — AlphaTab, acotado.** Solo para `/content/tabs/*.alphatex`:
      piezas completas, varias voces, notación estándar. Cargado con
      `import()` dinámico para no pagar el bundle en las otras ~145 páginas.
      Antes de comprometerse: medir el peso real de AlphaTab **más su
      SoundFont**, y confirmar la licencia.

No se sustituye `<Tab>` por AlphaTab: perderíamos las reglas de
`content:audit` que validan cada nota contra su escala o su acorde, y
meteríamos un motor de notación en 106 páginas que hoy son SVG sin JS.

## P2 — Tabs alphaTex (bloqueado por Fase 3)

Hoy `/content/tabs` está vacío y no hay player. Cuando el `<Tab />` con
AlphaTab exista, este es el lote inicial (solo material propio o dominio
público; canciones con copyright siguen con `external_tab_url`):

- [ ] `cromatico-1234.alphatex` — el calentamiento, para verlo además de leerlo
- [ ] `blues-en-fa-comping.alphatex` — tríadas y shells del blues
- [ ] `blues-en-fa-melodia.alphatex` — frases pregunta-respuesta de ejemplo
- [ ] `vamp-c-am-f-g.alphatex` — el vamp con voicings
- [ ] `riff-octavas-am.alphatex` — el riff de octavas
- [ ] `ii-v-i-loop.alphatex` — en 5 tonalidades
- [ ] `escala-mayor-2-posiciones.alphatex` — digitaciones exactas
- [ ] `pentatonica-caja-1.alphatex` + conexión de cajas
- [ ] `shells-ciclo-cuartas.alphatex`
- [ ] `arpegios-7a.alphatex` — las 2 posiciones de w07
- [ ] `blues-lento-en-do.alphatex` (cuando exista la canción)
- [ ] `tema-estilo-plini.alphatex` (ídem)
- [ ] `funk-16ths-e.alphatex` (ídem)
- [ ] Y `tab_slug` en las fichas de canción propias + campo `alphatex` en ejercicios que lo pidan

## P3 (ahora) — Módulos frontera: Desde cero y Avanzado

- [ ] **Desde cero** (pre-A, 4 semanas): sujetar la guitarra, primeros acordes
      abiertos, cambios, rasgueo, primeras canciones de 3 acordes, afinar.
      Requiere ~12 ejercicios y ~6 wiki nuevas de nivel 0.
- [ ] **Avanzado** (post-C, 4 semanas): sweep/tapping aplicados, alterada y
      disminuida sobre V7, rearmonización, chord melody, repertorio exigente.
      Depende de las wiki P3 de teoría avanzada y técnica.

## 🎯 Currículo a largo plazo: de 12 semanas a varios años

Las 12 semanas del seed son **el arranque, no el techo**. Trastea tiene que dar
de comer durante años: cuando alguien termina el módulo C no se ha acabado el
curso, empieza la especialización. Este es el mapa completo (no se escribe
todavía; se irá abriendo módulo a módulo).

### Tronco común (hecho)

| Módulo                   | Semanas | Estado         |
| ------------------------ | ------- | -------------- |
| Pre — Desde cero         | 4       | ⬜ placeholder |
| A — Cimientos            | 4       | ✅             |
| B — Armonía y arpegios   | 4       | ✅             |
| C — Lenguaje y velocidad | 4       | ✅             |

### Especialidades (itinerarios, no cola lineal)

Después del tronco, el estudiante **elige por dónde seguir** según lo que
quiera tocar. No es una fila india: son caminos paralelos que se pueden
compaginar o encadenar durante años.

| Módulo                        | Semanas    | Qué cubre                                                                                                                                          |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| D — Blues en profundidad      | 8          | Shuffle y slow blues, Texas/Chicago, turnarounds, vocabulario de los tres King, SRV, blues jazz, dinámicas y tono                                  |
| E — Jazz y standards          | 12         | Comping y voicings drop-2/drop-3, walking bass, chord melody, rhythm changes, sustituciones, transcripción sistemática, repertorio de 10 standards |
| F — Rock y metal              | 8          | Riffs y construcción, alternate picking rápido, palm mute avanzado, armonías gemelas, afinaciones bajas, escalas para metal, solos melódicos       |
| G — Fingerstyle y acústica    | 8          | Independencia del pulgar, Travis picking, arreglos a solo guitar, percusión sobre la caja, capo y afinaciones abiertas                             |
| H — Funk, soul y R&B          | 6          | Semicorcheas con notas fantasma, novenas y comping, wah, cortes y silencios, tocar "atrás del tiempo"                                              |
| I — Fusión y guitarra moderna | 8          | Modos aplicados de verdad, tapping, sweep, poliritmias, prog y compases mixtos, sonido moderno                                                     |
| J — Flamenco y latino         | 6          | Rumba, bulerías básicas, rasgueos, bossa y samba, clave y acompañamiento latino                                                                    |
| K — Improvisación avanzada    | 8          | Targeting y voice leading, motivos y desarrollo temático, outside playing, tocar sobre cambios rápidos, dúos e interacción                         |
| L — Repertorio y directo      | continuo   | Montar temas enteros, setlists, tocar con otros, ensayo eficiente, nervios y escenario                                                             |
| M — Mantenimiento             | indefinido | "Temporadas" de repaso: rutinas cortas que reciclan el tronco y lo que ya estudiaste                                                               |

Total estimado si se abren todos: **~70-80 semanas más ≈ 350-400 lecciones-día**,
más el mantenimiento indefinido. Eso son años de práctica diaria.

### Orden sugerido de apertura

1. **D — Blues** (es la continuación natural del módulo C y la que más gente pide).
2. **E — Jazz** (el itinerario más largo y el que más aprovecha la wiki actual).
3. **Pre — Desde cero** (abre la app a otro público, requiere wiki nivel 0).
4. **F — Rock y metal** y **H — Funk** (grandes y muy motivadores).
5. El resto según lo que pida el uso real.

### Lo que el sistema necesita para soportarlo (deuda de producto)

Hoy el curso es **una única fila lineal** (`getOrderedLessons` + `nextLessonSlug`)
y `/hoy` avanza por ella. Con especialidades paralelas eso se queda corto:

- [ ] **Itinerarios**: `module.mdx` con `track` (tronco | especialidad) y
      `prerequisites: [module_slug]`; el curso deja de ser una lista y pasa a ser
      un grafo. `/curso` muestra "elige tu camino" tras el tronco.
- [ ] **Lección de hoy con criterio**: `/hoy` debe elegir dentro del itinerario
      activo del perfil, no del array global. Añadir `active_track` a `profiles`.
- [ ] **Repaso espaciado del curso**: reciclar lecciones antiguas (el módulo M
      vive de esto). Reutilizar el motor SRS cuando exista.
- [ ] **Rendimiento del build**: 145 páginas hoy; con ~400 lecciones conviene
      medir y quizá pasar las lecciones a render dinámico con `generateStaticParams`
      parcial o ISR.
- [ ] **Navegación del curso**: con 15 módulos, `/curso` necesita filtros y
      progreso por itinerario, no una lista infinita de tarjetas.
- [ ] **content:audit**: añadir validación de `prerequisites` (grafo sin ciclos)
      y aviso de módulos inalcanzables.

Nada de esto bloquea escribir contenido: los módulos D-M se pueden ir creando
como módulos normales con `order` correlativo, y la capa de itinerarios se
añade cuando haya 2-3 especialidades abiertas y el orden lineal empiece a
estorbar de verdad.

## Contenido ligado a features futuras (no escribir aún)

- **SRS** (`/entrenar`): los datos salen de `/src/data`, no necesita MDX; solo
  revisar que payload de tarjetas cubra notas, intervalos y chord tones.
- **Quizzes por semana** (además de por módulo): decidir si aportan antes de escribirlos.
- **Grabaciones**: prompts de grabación por semana (hoy solo en assessment de módulo).

## Ideas aparcadas (decisión consciente: no)

- Multi-alumno / modo profesor · editor web de contenido · IA embebida · app
  nativa. El contenido se edita en git y eso es una ventaja.
- Repertorio flamenco como módulo (quizá tras "Avanzado").

---

## Resumen de números

| Lote             | Piezas                                                                            | Estado |
| ---------------- | --------------------------------------------------------------------------------- | ------ |
| Módulo B         | 20 lecciones + 13 ejercicios + 4 canciones + quiz                                 | ✅     |
| Módulo C         | 20 lecciones + 14 ejercicios + 7 canciones + quiz                                 | ✅     |
| Wiki (siguiente) | ~38 fichas (10 teoría, 9 técnica, 3 ritmo, 7 equipo, 4 historia, 5 transversales) | ⬜     |
| Tabs             | ~14 alphatex (bloqueado por player AlphaTab)                                      | ⬜     |
| Frontera         | 2 módulos (~40 lecciones más)                                                     | ⬜     |

| Especialidades D-M | ~70-80 semanas ≈ 350-400 lecciones | ⬜ futuro |

El curso de 12 semanas (el tronco común) está **completo: 60 lecciones**. Con la
wiki pendiente la enciclopedia ronda las **85 fichas**. Las especialidades D-M
son el plan de años: ver "Currículo a largo plazo" arriba.
