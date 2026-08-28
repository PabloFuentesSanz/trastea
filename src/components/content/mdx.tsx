import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
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
  Rejilla,
  Rutina,
  Tab,
} from "./music-blocks";
import { Cancion, Canciones } from "./song-blocks";
import { chordify } from "./chordify";
import { getGlosario, resolveInterlinks } from "@/lib/content/loader";
import { remarkTerminos } from "@/lib/content/remark-terms";
import { Termino } from "./termino";

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

/**
 * Los bloques de prosa pasan por `chordify`: cualquier cifrado mencionado se
 * convierte en una tarjeta con su forma. El código en línea y los enlaces no
 * se tocan (ver chordify.tsx).
 */
const P = ({ children, ...rest }: ComponentPropsWithoutRef<"p">) => (
  <p {...rest}>{chordify(children)}</p>
);
const Li = ({ children, ...rest }: ComponentPropsWithoutRef<"li">) => (
  <li {...rest}>{chordify(children)}</li>
);
const Strong = ({ children, ...rest }: ComponentPropsWithoutRef<"strong">) => (
  <strong {...rest}>{chordify(children)}</strong>
);
const Em = ({ children, ...rest }: ComponentPropsWithoutRef<"em">) => (
  <em {...rest}>{chordify(children)}</em>
);
const Td = ({ children, ...rest }: ComponentPropsWithoutRef<"td">) => (
  <td className="border-b px-3 py-2 align-top" {...rest}>
    {chordify(children)}
  </td>
);

/** Una tabla ancha se desplaza dentro de su caja, no empuja la página. */
const Table = ({ children, ...rest }: ComponentPropsWithoutRef<"table">) => (
  <div className="not-prose my-5 overflow-x-auto rounded-lg border">
    <table className="w-full border-collapse text-sm" {...rest}>
      {children}
    </table>
  </div>
);

const Th = ({ children, ...rest }: ComponentPropsWithoutRef<"th">) => (
  <th
    className="border-b bg-card px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
    {...rest}
  >
    {children}
  </th>
);

const components = {
  a: SmartLink,
  p: P,
  li: Li,
  strong: Strong,
  em: Em,
  table: Table,
  th: Th,
  td: Td,
  YouTube,
  ToolLink,
  WikiLink,
  // primitivas visuales de autoría (ver .claude/skills/music-ui)
  Mastil,
  Cajas,
  PorCuerdas,
  Rejilla,
  Acorde,
  Acordes,
  Ficha,
  Aviso,
  Rutina,
  Paso,
  Tab,
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

/**
 * Los `[[interlinks]]` se resuelven aquí y no en cada página: se resolvían
 * solo en la wiki, así que un `[[como-practicar]]` escrito en una lección o en
 * un ejercicio salía impreso con los corchetes. Pasaba de verdad en el
 * ejercicio del primer día del curso.
 */
export function Mdx({
  source,
  className,
  glosario = true,
}: {
  source: string;
  className?: string;
  /** false en el propio glosario: allí las definiciones ya están escritas */
  glosario?: boolean;
}) {
  const entradas = glosario ? getGlosario() : [];
  const porNombre = new Map(entradas.map((e) => [e.termino, e]));

  return (
    <div
      className={cn(
        "prose prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-a:underline-offset-4 prose-code:before:content-none prose-code:after:content-none",
        className,
      )}
    >
      <MDXRemote
        source={resolveInterlinks(sanitizeMdx(source))}
        components={{
          ...components,
          Termino: ({ nombre, children }: { nombre: string; children: ReactNode }) => {
            const entrada = porNombre.get(nombre);
            if (!entrada) return <>{children}</>;
            return (
              <Termino
                nombre={entrada.termino}
                definicion={entrada.definicion}
                ficha={entrada.ficha}
              >
                {children}
              </Termino>
            );
          },
        }}
        // sin GFM las tablas del contenido salían impresas con las barras
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkTerminos(entradas)],
          },
        }}
      />
    </div>
  );
}
