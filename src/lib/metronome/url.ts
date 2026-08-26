/**
 * Serialización de la configuración del metrónomo a query params y viceversa.
 * Formato: /metronomo?bpm=80&sig=4/4&sub=2&accent=13&only24=1&inc=4&every=4&max=180
 * `accent` usa pulsos 1-based concatenados ("13" = pulsos 1 y 3).
 */

import {
  clampBpm,
  DEFAULT_CONFIG,
  type MetronomeConfig,
  type TimeSignature,
} from "./pattern";

export type MetronomeSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseSignature(raw: string | undefined): TimeSignature | null {
  if (!raw) return null;
  const m = /^(\d{1,2})\/(4|8)$/.exec(raw);
  if (!m) return null;
  const beats = Number(m[1]);
  if (beats < 1 || beats > 15) return null;
  return { beats, unit: Number(m[2]) as 4 | 8 };
}

export function configFromParams(params: MetronomeSearchParams): MetronomeConfig {
  const config: MetronomeConfig = {
    ...DEFAULT_CONFIG,
    accents: [...DEFAULT_CONFIG.accents],
    autoIncrement: { ...DEFAULT_CONFIG.autoIncrement },
  };

  const bpm = Number(first(params.bpm));
  if (Number.isFinite(bpm) && bpm > 0) config.bpm = clampBpm(bpm);

  const sig = parseSignature(first(params.sig));
  if (sig) config.signature = sig;

  const sub = Number(first(params.sub));
  if ([1, 2, 3, 4].includes(sub)) config.subdivision = sub as 1 | 2 | 3 | 4;

  const accent = first(params.accent);
  if (accent && /^\d+$/.test(accent)) {
    const beats = [...accent]
      .map((d) => Number(d) - 1)
      .filter((b) => b >= 0 && b < config.signature.beats);
    if (beats.length > 0) config.accents = beats;
  }

  if (first(params.only24) === "1") config.only24 = true;

  const inc = Number(first(params.inc));
  if (Number.isFinite(inc) && inc > 0) {
    config.autoIncrement.enabled = true;
    config.autoIncrement.addBpm = Math.min(20, Math.round(inc));
    const every = Number(first(params.every));
    if (Number.isFinite(every) && every > 0)
      config.autoIncrement.everyMeasures = Math.min(64, Math.round(every));
    const max = Number(first(params.max));
    if (Number.isFinite(max) && max > 0)
      config.autoIncrement.maxBpm = clampBpm(max);
  }

  return config;
}

export function paramsFromConfig(config: MetronomeConfig): URLSearchParams {
  const params = new URLSearchParams();
  params.set("bpm", String(config.bpm));
  if (
    config.signature.beats !== DEFAULT_CONFIG.signature.beats ||
    config.signature.unit !== DEFAULT_CONFIG.signature.unit
  ) {
    params.set("sig", `${config.signature.beats}/${config.signature.unit}`);
  }
  if (config.subdivision !== 1) params.set("sub", String(config.subdivision));
  if (config.accents.length !== 1 || config.accents[0] !== 0) {
    params.set("accent", config.accents.map((b) => b + 1).join(""));
  }
  if (config.only24) params.set("only24", "1");
  if (config.autoIncrement.enabled) {
    params.set("inc", String(config.autoIncrement.addBpm));
    params.set("every", String(config.autoIncrement.everyMeasures));
    params.set("max", String(config.autoIncrement.maxBpm));
  }
  return params;
}
