import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { findChordMentions, mightMentionChord } from "@/lib/content/chord-mentions";
import { ChordChip } from "./chord-chip";

/**
 * Recorre los hijos de un nodo y convierte en tarjeta cada cifrado que
 * encuentra en el texto. Los elementos se recorren por dentro, salvo los que
 * no deben tocarse: el código en línea es la salida de emergencia del autor,
 * y dentro de un enlace o de otra tarjeta no pinta nada.
 */
const SKIP = new Set(["code", "pre", "a", "ChordChip"]);

function elementName(node: ReactNode): string | undefined {
  if (!isValidElement(node)) return undefined;
  const { type } = node;
  if (typeof type === "string") return type;
  if (typeof type === "function") return type.name;
  return undefined;
}

export function chordify(children: ReactNode): ReactNode {
  return Children.map(children, (child, index) => {
    if (typeof child === "string") {
      if (!mightMentionChord(child)) return child;
      const segments = findChordMentions(child);
      if (segments.every((s) => "text" in s)) return child;
      return segments.map((segment, i) =>
        "chord" in segment ? (
          <ChordChip key={`${index}-${i}`} chord={segment.chord} />
        ) : (
          segment.text
        ),
      );
    }

    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    const name = elementName(child);
    if (name !== undefined && SKIP.has(name)) return child;
    if (child.props.children === undefined) return child;

    return cloneElement(child, undefined, chordify(child.props.children));
  });
}
