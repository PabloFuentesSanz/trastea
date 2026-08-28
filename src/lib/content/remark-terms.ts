import { marcarTexto, type TerminoBuscable } from "./mark-terms";

/**
 * Subraya en el texto las palabras del glosario y las convierte en <Termino>,
 * que enseña su definición sin salir de la página.
 *
 * Se salta lo que no es prosa: títulos, código, enlaces ya existentes y el
 * propio glosario. Y solo marca la primera aparición de cada palabra: quince
 * subrayados en una página no se leen.
 */
const NO_TOCAR = new Set([
  "heading",
  "code",
  "inlineCode",
  "link",
  "linkReference",
  "definition",
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
]);

interface Nodo {
  type: string;
  value?: string;
  children?: Nodo[];
  [k: string]: unknown;
}

function nodoTermino(texto: string, termino: string): Nodo {
  return {
    type: "mdxJsxTextElement",
    name: "Termino",
    attributes: [{ type: "mdxJsxAttribute", name: "nombre", value: termino }],
    children: [{ type: "text", value: texto }],
  };
}

export function remarkTerminos(indice: readonly TerminoBuscable[]) {
  return () => (tree: Nodo) => {
    if (indice.length === 0) return;
    const yaVistos = new Set<string>();

    const visitar = (nodo: Nodo) => {
      if (!Array.isArray(nodo.children)) return;
      const salida: Nodo[] = [];
      for (const hijo of nodo.children) {
        if (hijo.type === "text" && typeof hijo.value === "string") {
          const trozos = marcarTexto(hijo.value, indice, yaVistos);
          for (const t of trozos) {
            salida.push(
              t.termino === undefined
                ? { type: "text", value: t.texto }
                : nodoTermino(t.texto, t.termino),
            );
          }
          continue;
        }
        if (!NO_TOCAR.has(hijo.type)) visitar(hijo);
        salida.push(hijo);
      }
      nodo.children = salida;
    };

    visitar(tree);
  };
}
