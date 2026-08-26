# Trastea 🎸

Tu sistema de estudio de guitarra: curso diario, sesión de práctica con timer y
metrónomo, escalas y acordes visuales, tabs, wiki de teoría y registro de progreso.

## Setup (<5 min)

```bash
pnpm install
cp .env.example .env.local   # rellena con tu proyecto de Supabase
pnpm dev                     # http://localhost:3000
```

Sin `.env.local` la app arranca en **modo demo** (sin auth ni persistencia).

### Supabase

1. Crea un proyecto free en [supabase.com](https://supabase.com).
2. Copia `Project Settings → API` → URL y anon key a `.env.local`.
3. Aplica la migración: pega `supabase/migrations/*.sql` en el SQL Editor del
   dashboard (o `supabase db push` con el CLI vinculado).
4. En `Authentication → Providers` activa Email.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | servidor de desarrollo |
| `pnpm test` | tests unitarios (Vitest) |
| `pnpm lint` / `pnpm typecheck` | calidad |
| `pnpm content:audit` | valida `/content` y genera `content/STATE.md` |
| `pnpm check` | todo lo anterior; debe estar verde antes de mergear |

## Estructura

- `/content` — curso, ejercicios, canciones, wiki (MDX versionado en git)
- `/src/data` — escalas/acordes/afinaciones por fórmulas de intervalos
- `/src/lib/music` — teoría musical pura, testeada
- `/supabase/migrations` — esquema con RLS por usuario

Más detalle en `ARCHITECTURE.md` y `ROADMAP.md`.
