import { Skeleton } from "@/components/ui/skeleton";

/** La lección, mientras llega el progreso del usuario. */
export default function Loading() {
  return (
    <main className="w-full px-4 pb-10" aria-busy="true" aria-label="Cargando la lección">
      <div className="mx-auto max-w-3xl py-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="mt-2 h-7 w-80" />
        <Skeleton className="mt-3 h-2 w-full" />
        <Skeleton className="mt-6 h-24 w-full" />
        <Skeleton className="mt-4 h-40 w-full" />
        <Skeleton className="mt-4 h-16 w-full" />
        <Skeleton className="mt-2 h-16 w-full" />
        <Skeleton className="mt-2 h-16 w-full" />
      </div>
    </main>
  );
}
