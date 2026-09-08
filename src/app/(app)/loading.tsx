import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lo que se ve mientras llega una página con datos de usuario.
 *
 * Sin esto, pulsar un enlace a una ruta dinámica no hacía NADA visible hasta
 * que el servidor respondía —y con la sesión y el perfil por medio eso era
 * un segundo largo—: la gente pulsaba otra vez. Con un esqueleto, la
 * navegación es instantánea y los datos llegan encima.
 */
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-6 h-28 w-full" />
      <Skeleton className="mt-4 h-20 w-full" />
      <Skeleton className="mt-4 h-20 w-full" />
    </main>
  );
}
