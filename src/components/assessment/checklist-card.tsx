"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { saveChecklist } from "@/app/actions/assessment";

export function ChecklistCard({
  moduleSlug,
  items,
  initialDone,
  demo,
}: {
  moduleSlug: string;
  items: string[];
  initialDone: string[];
  demo: boolean;
}) {
  const [done, setDone] = useState<Set<string>>(() => new Set(initialDone));
  const [, startTransition] = useTransition();

  const toggle = (item: string, checked: boolean) => {
    const next = new Set(done);
    if (checked) next.add(item);
    else next.delete(item);
    setDone(next);

    if (demo) return;
    startTransition(async () => {
      const result = await saveChecklist({ moduleSlug, done: [...next] });
      if (!result.ok && result.error !== "demo") {
        toast.error(`No se pudo guardar: ${result.error}`);
      }
    });
  };

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const checked = done.has(item);
        const id = `check-${item.slice(0, 20).replace(/\W+/g, "-")}`;
        return (
          <li key={item}>
            <label
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                checked ? "border-success/50 bg-success/5" : "hover:bg-secondary",
              )}
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => toggle(item, value === true)}
                className="mt-0.5"
              />
              <span
                className={cn("text-sm", checked && "text-muted-foreground line-through")}
              >
                {item}
              </span>
            </label>
          </li>
        );
      })}
      <li className="mt-1 text-xs text-muted-foreground">
        {done.size}/{items.length} completados
      </li>
    </ul>
  );
}
