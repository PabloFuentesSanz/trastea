/**
 * Resolución de [[interlinks]] de la wiki. Lógica pura y testeada.
 *
 * Dos formas:
 *   [[slug]]              → enlaza usando el título del artículo
 *   [[slug|texto propio]] → enlaza con el texto que tú decidas
 *
 * Además, si el enlace va precedido de un determinante o preposición
 * ("la [[pentatonicas]]"), se elide el artículo inicial del título para que la
 * frase no quede como "la Las pentatónicas".
 */

const INTERLINK = /\[\[([a-z0-9-]+)(\|[^\]]+)?\]\]/g;

/** Palabras tras las cuales un título que empieza por artículo suena mal. */
const ELIDING_WORDS = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "del",
  "al",
  "de",
  "tu",
  "tus",
  "su",
  "sus",
  "mi",
  "mis",
  "este",
  "esta",
  "estos",
  "estas",
  "ese",
  "esa",
  "otro",
  "otra",
]);

const LEADING_ARTICLE = /^(el|la|los|las|un|una)\s+/i;

export function stripLeadingArticle(title: string): string {
  return title.replace(LEADING_ARTICLE, "");
}

/** Última palabra del texto anterior al enlace, en minúsculas y sin puntuación. */
function previousWord(text: string): string {
  const match = /([\p{L}]+)[\s]*$/u.exec(text);
  return match ? match[1].toLowerCase() : "";
}

export function resolveInterlinksWith(
  body: string,
  titleFor: (slug: string) => string | null,
): string {
  return body.replace(INTERLINK, (match, slug: string, alias: string | undefined, offset: number) => {
    if (alias) {
      return `[${alias.slice(1)}](/wiki/${slug})`;
    }
    const title = titleFor(slug);
    if (!title) return `[${slug}](/wiki/${slug})`;

    const needsElision =
      LEADING_ARTICLE.test(title) &&
      ELIDING_WORDS.has(previousWord(body.slice(0, offset)));

    const label = needsElision ? stripLeadingArticle(title) : title;
    return `[${label}](/wiki/${slug})`;
  });
}
