import { Skeleton } from "@/components/ui/skeleton";

/** El entrenamiento, mientras se cruza el mazo con lo que llevas estudiado. */
export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-3xl px-4 py-8"
      aria-busy="true"
      aria-label="Preparando la sesión"
    >
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-64" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="mt-6 h-12 w-full" />
      <Skeleton className="mt-4 h-52 w-full" />
    </main>
  );
}
