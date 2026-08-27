import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Acorde,
  Acordes,
  Aviso,
  Cajas,
  Ficha,
  Mastil,
  Paso,
  PorCuerdas,
  Rutina,
} from "./music-blocks";
import { Cancion, Canciones } from "./song-blocks";

function SmartLink({ href = "", children, ...rest }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" {...rest}>
      {children}
    </a>
  );
}

function YouTube({ id, title }: { id: string; title: string }) {
  return (
    <div className="not-prose aspect-video overflow-hidden rounded-lg border">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="size-full"
      />
    </div>
  );
}

function ToolLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="not-prose inline-flex items-center gap-1 rounded-md border border-primary/40 bg-accent px-2 py-0.5 text-sm text-accent-foreground no-underline hover:border-primary"
    >
      🎛 {children}
    </Link>
  );
}

function WikiLink({ slug, children }: { slug: string; children?: ReactNode }) {
  return <Link href={`/wiki/${slug}`}>{children ?? slug}</Link>;
}

const components = {
  a: SmartLink,
  YouTube,
  ToolLink,
  WikiLink,
  // primitivas visuales de autoría (ver .claude/skills/music-ui)
  Mastil,
  Cajas,
  PorCuerdas,
  Acorde,
  Acordes,
  Ficha,
  Aviso,
  Rutina,
  Paso,
  Canciones,
  Cancion,
};

/**
 * `<` seguido de dígito ("<2s", "<1 cm") no es JSX válido pero rompe el
 * compilador MDX; se escapa siempre, es inocuo para el contenido real.
 */
function sanitizeMdx(source: string): string {
  return source.replace(/<(?=\d)/g, "&lt;");
}

export function Mdx({ source, className }: { source: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-a:underline-offset-4 prose-code:before:content-none prose-code:after:content-none",
        className,
      )}
    >
      <MDXRemote source={sanitizeMdx(source)} components={components} />
    </div>
  );
}
