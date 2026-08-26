---
name: content-curator
description: Procedimiento de iteración del contenido - leer STATE.md, detectar huecos, proponer un lote, generarlo con add-lesson/add-wiki y re-auditar. Invocar con /content-curator.
---

# Content curator

El contenido de Trastea es un sistema vivo. Este es el bucle:

1. **Ejecuta** `pnpm content:audit` y lee `/content/STATE.md`.
2. **Detecta huecos**, en este orden de prioridad:
   1. Referencias rotas (slugs que no existen) — bloquean el build.
   2. Semanas incompletas (menos de 5 días) en módulos publicados.
   3. Artículos wiki referenciados desde lecciones que no existen.
   4. Artículos huérfanos (sin backlinks) — enlazarlos o justificarlos.
   5. Ideas de `/content/BACKLOG.md` marcadas como siguientes.
3. **Propón un lote concreto** al usuario: qué ficheros, por qué, en qué orden.
   Lotes pequeños (3-8 ficheros). Espera su OK si es sesión interactiva.
4. **Genera** cada pieza siguiendo las skills `add-lesson` / `add-wiki` (y las
   convenciones de ejercicios/canciones de `/content/README.md`).
5. **Re-audita** hasta verde y actualiza `BACKLOG.md` (tacha lo hecho, anota lo
   descubierto).

Reglas: nunca inventes slugs nuevos sin registrarlos donde se referencian;
mantén la progresión de bpm y dificultad coherente entre semanas; tabs solo de
material propio o dominio público (canciones con copyright → enlace externo).
