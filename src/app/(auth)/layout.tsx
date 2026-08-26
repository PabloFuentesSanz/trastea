export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <p className="text-3xl font-semibold">
          <span aria-hidden className="text-primary">
            ⏦
          </span>{" "}
          Trastea
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Deja de tocar a ciegas. Practica con sistema.
        </p>
      </div>
      {children}
    </div>
  );
}
