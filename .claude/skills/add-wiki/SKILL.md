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
category: teoria   # teoria | tecnica | ritmo | equipo | historia | glosario
level: 1           # 1 base, 2 medio, 3 avanzado
related: [notas-musicales, intervalos]
summary: "Qué significan C, Dm7 o G7alt y por qué todo el mundo los usa."
```

## Estilo

- Directo, sin paja, con la personalidad de Trastea: cercano, algo juguetón,
  cero solemnidad. Ejemplos SIEMPRE en el mástil (cuerda/traste concretos).
- 300-800 palabras. Si pide más, trocéalo en artículos enlazados.
- Interlinks con `[[slug]]` (se convierten en enlaces y generan backlinks en
  build). Enlaza generosamente: la wiki es una red, no una lista.
- Puede embeber `<Fretboard>`, `<ChordDiagram>`, `<ToolLink>`.
- Termina con "Para trastear": 1-2 acciones concretas en la guitarra o un
  deep link a herramienta (`/escalas?...`).

## Checklist

- [ ] `related` y `[[interlinks]]` apuntan a slugs existentes (audit verde).
- [ ] Un concepto por artículo; título = concepto.
- [ ] Ejemplo en el mástil incluido.
