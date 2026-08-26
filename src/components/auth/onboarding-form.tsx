"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveOnboarding } from "@/app/actions/practice";
import type { UserLevel } from "@/lib/supabase/types";

const LEVELS: { value: UserLevel; label: string; description: string }[] = [
  {
    value: "cero",
    label: "Desde cero",
    description: "Nunca he tocado o lo dejé nada más empezar.",
  },
  {
    value: "principiante",
    label: "Principiante",
    description: "Sé algunos acordes y canciones, pero poco más.",
  },
  {
    value: "intermedio",
    label: "Intermedio estancado",
    description:
      "Llevo años tocando pero siento que no avanzo. (El plan está pensado para ti.)",
  },
  {
    value: "avanzado",
    label: "Avanzado",
    description: "Domino técnica y teoría; busco sistema y repertorio.",
  },
];

export function OnboardingForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [level, setLevel] = useState<UserLevel>("intermedio");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await saveOnboarding({ displayName: name.trim(), level });
      if (!result.ok) {
        toast.error(
          result.error === "demo"
            ? "En modo demo no se guarda el perfil"
            : `No se pudo guardar: ${result.error}`,
        );
        return;
      }
      router.push("/hoy");
      router.refresh();
    });
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Antes de trastear</CardTitle>
        <CardDescription>
          Dos preguntas y te ponemos delante de tu primera lección.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ob-name">¿Cómo te llamamos?</Label>
          <Input
            id="ob-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={80}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">¿Tu nivel?</legend>
          {LEVELS.map((option) => (
            <label
              key={option.value}
              aria-label={option.label}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                level === option.value
                  ? "border-primary bg-accent"
                  : "hover:bg-secondary",
              )}
            >
              <input
                type="radio"
                name="level"
                value={option.value}
                checked={level === option.value}
                onChange={() => setLevel(option.value)}
                className="mt-1 accent-[var(--primary)]"
              />
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className="block text-sm text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <Button size="lg" onClick={submit} disabled={pending}>
          {pending ? "Preparando tu curso…" : "Empezar a trastear"}
        </Button>
      </CardContent>
    </Card>
  );
}
