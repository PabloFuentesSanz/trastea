"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { saveRecording } from "@/app/actions/assessment";

type Phase = "idle" | "recording" | "review" | "uploading";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Elige el formato que soporte el navegador (Safari no hace webm). */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export function Recorder({
  defaultTitle,
  moduleSlug,
  lessonSlug,
  onSaved,
}: {
  defaultTitle: string;
  moduleSlug?: string;
  lessonSlug?: string;
  onSaved?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (url) URL.revokeObjectURL(url);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, [url]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const recorded = new Blob(chunksRef.current, {
          type: mimeType ?? "audio/webm",
        });
        setBlob(recorded);
        setUrl(URL.createObjectURL(recorded));
        setPhase("review");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setPhase("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
    }
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const discard = useCallback(() => {
    if (url) URL.revokeObjectURL(url);
    setBlob(null);
    setUrl(null);
    setSeconds(0);
    setPhase("idle");
  }, [url]);

  const upload = useCallback(async () => {
    if (!blob) return;
    if (!isSupabaseConfigured()) {
      toast.error("Sin Supabase configurado no se pueden guardar grabaciones.");
      return;
    }
    setPhase("uploading");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Inicia sesión para guardar la grabación.");
      setPhase("review");
      return;
    }

    const extension = blob.type.includes("mp4")
      ? "m4a"
      : blob.type.includes("ogg")
        ? "ogg"
        : "webm";
    // La política de Storage exige que la carpeta sea el id del usuario
    const path = `${user.id}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("recordings")
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (error) {
      toast.error(`No se pudo subir: ${error.message}`);
      setPhase("review");
      return;
    }

    const result = await saveRecording({
      storagePath: path,
      title: title.trim() || defaultTitle,
      moduleSlug,
      lessonSlug,
      durationS: seconds,
    });

    if (!result.ok) {
      toast.error(`Subida pero no registrada: ${result.error}`);
    } else {
      toast.success("Grabación guardada.");
      onSaved?.();
    }
    discard();
  }, [blob, title, defaultTitle, moduleSlug, lessonSlug, seconds, discard, onSaved]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={cn(
            "display-number text-4xl tabular-nums",
            phase === "recording" ? "text-destructive" : "text-foreground",
          )}
          role="timer"
          aria-label={`Duración ${formatTime(seconds)}`}
        >
          {formatTime(seconds)}
        </span>

        {phase === "idle" && (
          <Button onClick={() => void start()} size="lg">
            <Mic aria-hidden /> Grabar
          </Button>
        )}
        {phase === "recording" && (
          <Button onClick={stop} size="lg" variant="destructive">
            <Square aria-hidden /> Parar
          </Button>
        )}
        {phase === "uploading" && (
          <Button disabled size="lg">
            <Loader2 aria-hidden className="animate-spin" /> Subiendo…
          </Button>
        )}
        {phase === "recording" && (
          <span
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-destructive"
          >
            <span
              aria-hidden
              className="size-2.5 rounded-full bg-destructive motion-safe:animate-pulse"
            />
            Grabando
          </span>
        )}
      </div>

      {phase === "review" && url && (
        <div className="mt-4 flex flex-col gap-3">
          <audio controls src={url} className="w-full" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-title">Título</Label>
            <Input
              id="rec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void upload()}>
              <Upload aria-hidden /> Guardar
            </Button>
            <Button variant="ghost" onClick={discard}>
              <Trash2 aria-hidden /> Descartar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
