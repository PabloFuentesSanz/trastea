---
name: release
description: Checklist de deploy - migraciones, checks, E2E y smoke test en preview antes de promocionar a producción.
---

# Release

1. `pnpm check` en verde (lint + typecheck + test + content:audit).
2. **Migraciones**: ¿hay SQL nuevo en `supabase/migrations`? Aplícalo en el
   proyecto de Supabase (SQL Editor o `supabase db push`) ANTES de desplegar
   código que lo necesite. Las migraciones son solo aditivas; nunca edites una
   ya aplicada.
3. E2E: `pnpm test:e2e` (cuando exista suite Playwright) contra build local.
4. Deploy a preview de Vercel; smoke test manual:
   - login → dashboard carga con datos
   - `/hoy` abre la lección del día; un bloque se completa y persiste
   - `/metronomo?bpm=120` suena y responde a Espacio y ±
5. Promocionar a producción. Verificar que `NEXT_PUBLIC_SUPABASE_*` están en
   el entorno de Vercel y que el redirect URL de Supabase Auth incluye el
   dominio de producción.
