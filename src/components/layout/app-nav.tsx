"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AudioWaveform,
  Brain,
  ListMusic,
  BookOpen,
  Grip,
  GraduationCap,
  Home,
  LineChart,
  MoreHorizontal,
  Play,
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

const TOOL_ITEMS = [
  { href: "/entrenar", label: "Entrenar", icon: Brain, exact: false },
  { href: "/escalas", label: "Escalas", icon: AudioWaveform, exact: false },
  { href: "/acordes", label: "Acordes", icon: Grip, exact: false },
  { href: "/canciones", label: "Canciones", icon: ListMusic, exact: false },
  { href: "/wiki", label: "Wiki", icon: BookOpen, exact: false },
  { href: "/progreso", label: "Progreso", icon: LineChart, exact: false },
] as const;

const MORE_ITEMS = [
  ...TOOL_ITEMS,
  { href: "/perfil", label: "Perfil", icon: User, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const moreActive = MORE_ITEMS.some((item) => isActive(pathname, item.href, item.exact));

  return (
    <>
      {/* Barra superior (desktop) */}
      <header className="sticky top-0 z-40 hidden border-b bg-background/90 backdrop-blur md:block">
        <nav
          aria-label="Principal"
          className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4"
        >
          <Link href="/" className="mr-4 flex items-center gap-2 font-semibold">
            <span aria-hidden className="text-primary">
              ⏦
            </span>
            Trastea
          </Link>
          {[...MAIN_ITEMS, ...TOOL_ITEMS].map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href, exact) ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(pathname, href, exact)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
          <Link
            href="/perfil"
            aria-label="Perfil"
            aria-current={isActive(pathname, "/perfil", false) ? "page" : undefined}
            className={cn(
              "ml-auto rounded-md p-2 transition-colors",
              isActive(pathname, "/perfil", false)
                ? "bg-accent text-accent-foreground"
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
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
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
