---
name: add-wiki
description: Crear un artículo de la wiki de guitarra (teoría, técnica, ritmo, equipo, historia, glosario) con frontmatter e interlinks correctos.
---

# Añadir un artículo wiki

Ruta: `/content/wiki/<slug>.mdx`.

## Frontmatter

```yaml
slug: cifrado-americano
title: "Cifrado americano"
category: teoria # teoria | tecnica | ritmo | equipo | historia | glosario
level: 1 # 1 base, 2 medio, 3 avanzado
related: [notas-musicales, intervalos]
summary: "Qué significan C, Dm7 o G7alt y por qué todo el mundo los usa."
```

## Estilo

- Directo, sin paja, con la personalidad de Trastea: cercano, algo juguetón,
  cero solemnidad. Ejemplos SIEMPRE en el mástil (cuerda/traste concretos).
- 300-800 palabras. Si pide más, trocéalo en artículos enlazados.
- Interlinks con `[[slug]]` (se convierten en enlaces y generan backlinks en
  build). Enlaza generosamente: la wiki es una red, no una lista.
  - Si el título del artículo empieza por artículo ("Las pentatónicas") y tú ya
    escribes uno delante ("de la [[pentatonicas]]"), el renderizador lo elide
    solo: sale "de la pentatónicas". No hace falta que hagas nada.
  - Cuando quieras otro texto de enlace, usa `[[slug|el texto que quieras]]`.
- Puede embeber `<Fretboard>`, `<ChordDiagram>`, `<ToolLink>`.
- Termina con "Para trastear": 1-2 acciones concretas en la guitarra o un
  deep link a herramienta (`/escalas?...`).

## Ficha profunda (escalas, acordes, intervalos, conceptos de lenguaje)

Para artículos de referencia (una escala, un tipo de acorde, un recurso como
las octavas), usa esta estructura de secciones (600-1100 palabras):

1. **Qué es y cómo suena** — fórmula/definición + descripción de la sonoridad
   en palabras (oscura, flotante, con tensión…), y con qué se confunde.
2. **De dónde viene** — 2-4 frases de origen/historia sin enciclopedismo.
3. **Dónde lo has oído** — 3-6 canciones/artistas concretos con el contexto
   ("el solo de X entra en el minuto…", "el riff entero es esto").
4. **En el mástil** — posiciones/zona con cuerda y traste; SIEMPRE al menos un
   deep link con params válidos: `/escalas?root=X&type=<id>` (ids: major,
   natural-minor, harmonic-minor, melodic-minor, major-pentatonic,
   minor-pentatonic, blues, dorian, phrygian, lydian, mixolydian, locrian,
   bebop-dominant, bebop-major, chromatic) o `/acordes?root=X&type=<id>`
   (ids: major, minor, diminished, augmented, sus2, sus4, maj7, 7, m7, m7b5,
   dim7, mMaj7, 6, m6, 9, maj9, m9; extras: view=triads, set=123|234|345|456,
   inv=root, labels=note|interval).
5. **Cómo estudiarlo** — rutina numerada con minutos y bpm concretos,
   enlazando `/metronomo?bpm=NN` cuando toque. Del "no lo he visto nunca" al
   "lo uso improvisando".
6. **Frases y usos típicos** — 2-4 movimientos/licks descritos en texto claro
   (cuerdas/trastes o grados).
7. **Errores comunes** — 2-4, con el antídoto.
8. **Para trastear** — el cierre de siempre: 1-2 acciones inmediatas.

## Checklist

- [ ] `related` y `[[interlinks]]` apuntan a slugs existentes (audit verde).
- [ ] Un concepto por artículo; título = concepto.
- [ ] Ejemplo en el mástil incluido.
- [ ] Ficha profunda: deep links con ids de escala/acorde VÁLIDOS (lista arriba).
