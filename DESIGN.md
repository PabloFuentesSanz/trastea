# DESIGN.md — sistema de diseño de Trastea

Fuente de verdad visual. Nunca conviven dos lenguajes: toda pantalla nueva
hereda estos tokens.

## Dirección

**"Pedal boutique"**: herramienta oscura, precisa y cálida. Referencias Linear
(densidad y jerarquía) y Teenage Engineering (números protagonistas, controles
táctiles). Nada de madera skeuomórfica.

- Fondo carbón azulado (`--background`), tarjetas un punto más claras.
- **Acento ámbar** (`--primary`, oklch 0.78 0.15 70): lámpara de válvulas.
  Se usa para acción primaria, beat activo del metrónomo, racha.
- Verde (`--success`) solo para completado/logro. Rojo solo destructivo.
- Bordes sutiles, radios 10px (`--radius`), sombras casi nulas (el contraste
  lo dan los niveles de fondo).

## Tipografía

- UI: Geist Sans (`--font-sans`).
- **Números display** (bpm, timer): Geist Mono con clase `.display-number`
  (tabular-nums, bold, tracking negativo). Tamaños ≥ `text-6xl` en player y
  metrónomo: legibles a 2 metros con la guitarra puesta.

## Interacción

- Metrónomo/timer sin mirar: `Espacio` start/stop, `±` bpm, targets ≥44px.
- Pulso visual acompaña siempre al audio (y lo sustituye con
  `prefers-reduced-motion` reducido a opacidad, sin escalas animadas).
- Foco visible siempre (`outline-ring/50`). Teclado completo.

## Tokens

Definidos en `src/app/globals.css` (`:root` + `@theme inline`). Los componentes
usan solo clases semánticas (`bg-card`, `text-muted-foreground`, `bg-primary`…),
jamás colores directos.

## Pendiente

- Generar 2-3 direcciones alternativas con el plugin `frontend-design` en una
  sesión local y que Pablo elija; esta dirección es la v1 funcional.
