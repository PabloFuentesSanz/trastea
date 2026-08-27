"use client";

import { useEffect } from "react";
import { isInstrumentId } from "@/data/instruments";
import { setInstrument } from "@/lib/audio/pluck";
import { INSTRUMENT_KEY } from "./instrument-picker";

/**
 * Restaura el instrumento elegido al cargar la app.
 *
 * Va en el layout y no en cada página porque el timbre es global: si lo
 * cambias en /bases, los ejercicios de oído y las rejillas del curso tienen
 * que sonar igual. No pinta nada.
 */
export function InstrumentBoot() {
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(INSTRUMENT_KEY);
      if (guardado && isInstrumentId(guardado)) setInstrument(guardado);
    } catch {
      // sin almacenamiento se usa el de por defecto, y ya está
    }
  }, []);

  return null;
}
