"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioContext, resumeAudio } from "@/lib/audio/context";
import { detectPitch } from "@/lib/tuner/pitch";

/** Ventana de análisis: dos periodos del Mi grave caben de sobra. */
const BUFFER = 2048;
/** Cada cuántos ms se mira. Más rápido no se lee; más lento va a tirones. */
const PERIOD_MS = 60;
/**
 * Media de las últimas lecturas. Una sola pasada baila unos cents con el
 * ataque de la púa, y una aguja que tiembla no deja afinar.
 */
const SUAVIZADO = 5;

export type TunerState = "parado" | "pidiendo" | "escuchando" | "denegado" | "sin-micro";

export interface TunerReading {
  hz: number;
  /** cuándo se leyó, para poder desvanecer lo que ya no suena */
  at: number;
}

/**
 * El micrófono y nada más: abre la entrada, analiza y devuelve la frecuencia.
 * Qué nota es eso y cuánto le falta lo decide `lib/tuner/tuning.ts`, que es
 * puro y se puede comprobar sin navegador.
 */
export function useTuner() {
  const [state, setState] = useState<TunerState>("parado");
  const [reading, setReading] = useState<TunerReading | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef(0);
  const recientes = useRef<number[]>([]);

  const stop = useCallback(() => {
    window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    recientes.current = [];
    setReading(null);
    setState("parado");
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("sin-micro");
      return;
    }
    setState("pidiendo");
    let entrada: MediaStream;
    try {
      entrada = await navigator.mediaDevices.getUserMedia({
        // sin procesar: el cancelador de eco y el control de ganancia se
        // comen los armónicos y desplazan el tono
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch {
      setState("denegado");
      return;
    }

    await resumeAudio();
    const ctx = audioContext();
    const fuente = ctx.createMediaStreamSource(entrada);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = BUFFER;
    fuente.connect(analyser);
    // a propósito NO se conecta al destino: oírte a ti mismo por los
    // altavoces realimenta y el afinador se afina a sí mismo
    stream.current = entrada;
    setState("escuchando");

    const datos = new Float32Array(analyser.fftSize);
    timer.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(datos);
      const hz = detectPitch(datos, ctx.sampleRate);
      if (hz === null) {
        recientes.current = [];
        setReading(null);
        return;
      }
      // si el tono salta de golpe (otra cuerda), se empieza de cero
      const previa = recientes.current[recientes.current.length - 1];
      if (previa !== undefined && Math.abs(1200 * Math.log2(hz / previa)) > 120) {
        recientes.current = [];
      }
      recientes.current.push(hz);
      if (recientes.current.length > SUAVIZADO) recientes.current.shift();
      const media =
        recientes.current.reduce((a, b) => a + b, 0) / recientes.current.length;
      setReading({ hz: media, at: Date.now() });
    }, PERIOD_MS);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { state, reading, start, stop };
}
