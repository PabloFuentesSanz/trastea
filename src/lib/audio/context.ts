"use client";

/**
 * El contexto de audio de la app, uno solo y compartido.
 *
 * Esto era Tone.js, del que usábamos exactamente dos cosas: coger el
 * AudioContext y desbloquearlo tras un gesto del usuario. El scheduling con
 * lookahead —lo único por lo que valía la pena traerlo— lo escribimos
 * nosotros en metronome/engine.ts y backing/engine.ts. Eran 220 kB por
 * quince líneas.
 */

let context: AudioContext | null = null;

/** El AudioContext, creado la primera vez que hace falta. */
export function audioContext(): AudioContext {
  if (context === null) {
    context = new AudioContext();
  }
  return context;
}

/**
 * Los navegadores arrancan el audio suspendido hasta que el usuario toca
 * algo. Se llama desde el manejador del clic que empieza a sonar.
 */
export async function resumeAudio(): Promise<void> {
  const ctx = audioContext();
  if (ctx.state !== "running") await ctx.resume();
}

/** Momento actual del reloj de audio, que es el que manda para agendar. */
export function audioNow(): number {
  return audioContext().currentTime;
}
