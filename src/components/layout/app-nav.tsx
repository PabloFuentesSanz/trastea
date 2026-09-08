"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AudioWaveform,
  Brain,
  ListMusic,
  BookOpen,
  Mic,
  Grip,
  Gauge,
  GraduationCap,
  Home,
  LineChart,
  MoreHorizontal,
  Play,
  Music4,
  Timer,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MAIN_ITEMS = [
  { href: "/", label: "Inicio", icon: Home, exact: true },
  { href: "/hoy", label: "Hoy", icon: Play, exact: false },
  { href: "/curso", label: "Curso", icon: GraduationCap, exact: false },
  { href: "/metronomo", label: "Metrónomo", icon: Timer, exact: false },
] as const;

// Herramientas con sitio propio en la barra de escritorio.
const TOOL_ITEMS = [
  { href: "/entrenar", label: "Entrenar", icon: Brain, exact: false },
  { href: "/escalas", label: "Escalas", icon: AudioWaveform, exact: false },
  { href: "/acordes", label: "Acordes", icon: Grip, exact: false },
  { href: "/bases", label: "Bases", icon: Music4, exact: false },
] as const;

// El resto vive en el desplegable "Más": la barra no da para once enlaces.
const EXTRA_ITEMS = [
  { href: "/afinador", label: "Afinador", icon: Gauge, exact: false },
  { href: "/canciones", label: "Canciones", icon: ListMusic, exact: false },
  { href: "/wiki", label: "Wiki", icon: BookOpen, exact: false },
  { href: "/grabaciones", label: "Grabaciones", icon: Mic, exact: false },
  { href: "/progreso", label: "Progreso", icon: LineChart, exact: false },
] as const;

// En móvil, "Más" recoge todo lo que no cabe en la barra inferior.
const MORE_ITEMS = [
  ...TOOL_ITEMS,
  ...EXTRA_ITEMS,
  { href: "/perfil", label: "Perfil", icon: User, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const moreActive = MORE_ITEMS.some((item) => isActive(pathname, item.href, item.exact));
  const extraActive = EXTRA_ITEMS.some((item) =>
    isActive(pathname, item.href, item.exact),
  );

  // el enlace activo no se pinta con una caja: lleva la cuerda debajo, en
  // índigo, como el inlay que marca el traste en el que estás
  const barLink = (active: boolean) =>
    cn(
      "relative flex h-14 items-center gap-1.5 px-3 text-sm transition-colors",
      "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary after:opacity-0 after:transition-opacity",
      active
        ? "text-primary after:opacity-100"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <>
      {/* Barra superior (desktop) */}
      <header className="sticky top-0 z-40 hidden border-b bg-card/95 backdrop-blur md:block">
        <nav
          aria-label="Principal"
          className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4"
        >
          <Link
            href="/"
            className="font-display mr-4 flex items-center gap-2 text-2xl tracking-tight"
          >
            <span aria-hidden className="inline-block size-2.5 rounded-full bg-primary" />
            Trastea
          </Link>
          {[...MAIN_ITEMS, ...TOOL_ITEMS].map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href, exact) ? "page" : undefined}
              className={barLink(isActive(pathname, href, exact))}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger className={barLink(extraActive)}>
              <MoreHorizontal className="size-4" aria-hidden />
              Más
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {EXTRA_ITEMS.map(({ href, label, icon: Icon, exact }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link
                    href={href}
                    aria-current={isActive(pathname, href, exact) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2",
                      isActive(pathname, href, exact) && "text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/perfil"
            aria-label="Perfil"
            aria-current={isActive(pathname, "/perfil", false) ? "page" : undefined}
            className={cn(
              "ml-auto rounded-full p-2 transition-colors",
              isActive(pathname, "/perfil", false)
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <User className="size-5" aria-hidden />
          </Link>
        </nav>
      </header>

      {/* Barra inferior (móvil, con la guitarra puesta) */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {MAIN_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href, exact) ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
                isActive(pathname, href, exact)
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Más secciones"
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
                moreActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="size-5" aria-hidden />
              Más
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="mb-1 w-44">
              {MORE_ITEMS.map(({ href, label, icon: Icon, exact }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link
                    href={href}
                    aria-current={isActive(pathname, href, exact) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2",
                      isActive(pathname, href, exact) && "text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
}
