"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteRecording } from "@/app/actions/assessment";

export interface RecordingListItem {
  id: string;
  title: string;
  storagePath: string;
  lessonSlug: string | null;
  lessonTitle: string | null;
  durationS: number | null;
  createdAt: string;
  url: string | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RecordingsList({ items }: { items: RecordingListItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        Aún no hay grabaciones. La primera cuesta; a partir de ahí engancha.
      </p>
    );
  }

  const remove = (item: RecordingListItem) => {
    setPendingId(item.id);
    startTransition(async () => {
      const result = await deleteRecording({
        id: item.id,
        storagePath: item.storagePath,
      });
      setPendingId(null);
      if (!result.ok) {
        toast.error(`No se pudo borrar: ${result.error}`);
        return;
      }
      toast.success("Grabación borrada.");
      router.refresh();
    });
  };

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-2 font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString("es", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {item.durationS ? ` · ${formatDuration(item.durationS)}` : ""}
                {item.lessonTitle && item.lessonSlug && (
                  <>
                    {" · "}
                    <Link
                      href={`/hoy`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {item.lessonTitle}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Borrar ${item.title}`}
              disabled={pendingId === item.id}
              onClick={() => remove(item)}
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </div>
          {item.url ? (
            <audio controls src={item.url} className="mt-3 w-full" preload="none" />
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No se pudo cargar el audio.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
