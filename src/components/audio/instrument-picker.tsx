"use client";

import { useSyncExternalStore } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INSTRUMENTS, INSTRUMENT_IDS, isInstrumentId } from "@/data/instruments";
import {
  currentInstrument,
  serverInstrument,
  setInstrument,
  subscribeInstrument,
} from "@/lib/audio/pluck";

/** Dónde se recuerda la elección; la misma clave que lee InstrumentBoot. */
export const INSTRUMENT_KEY = "trastea:instrumento";

/**
 * Elegir con qué suena todo: las bases, las rejillas y tabs del curso y los
 * ejercicios de oído. Es un ajuste global, no de esta pantalla, porque tener
 * un timbre distinto en cada sitio no ayuda a nadie.
 */
export function InstrumentPicker({ id = "instrumento" }: { id?: string }) {
  // se lee del store, no de un estado propio: si el instrumento cambia en
  // otro sitio, este select se entera
  const value = useSyncExternalStore(
    subscribeInstrument,
    currentInstrument,
    serverInstrument,
  );

  const cambiar = (next: string) => {
    setInstrument(next);
    try {
      window.localStorage.setItem(INSTRUMENT_KEY, next);
    } catch {
      // navegar en privado no debería impedir cambiar de timbre
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Instrumento</Label>
      <Select value={value} onValueChange={cambiar}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INSTRUMENT_IDS.filter(isInstrumentId).map((key) => (
            <SelectItem key={key} value={key}>
              {INSTRUMENTS[key].name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">{INSTRUMENTS[value]?.summary}</p>
    </div>
  );
}
