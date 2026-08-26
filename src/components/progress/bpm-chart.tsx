"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BpmPoint {
  exercise_slug: string;
  bpm: number;
  recorded_at: string;
}

export function BpmChart({
  records,
  titles,
}: {
  records: BpmPoint[];
  titles: Record<string, string>;
}) {
  const exercises = useMemo(
    () => [...new Set(records.map((r) => r.exercise_slug))],
    [records],
  );
  const [selected, setSelected] = useState<string | undefined>(exercises[0]);

  const data = useMemo(
    () =>
      records
        .filter((r) => r.exercise_slug === selected)
        .map((r) => ({
          date: new Date(r.recorded_at).toLocaleDateString("es", {
            day: "2-digit",
            month: "2-digit",
          }),
          bpm: r.bpm,
        })),
    [records, selected],
  );

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay registros de bpm. Salen solos al practicar: en los bloques de
        técnica apuntas el bpm alcanzado y aquí aparece la curva.
      </p>
    );
  }

  return (
    <div>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-full max-w-xs" aria-label="Ejercicio">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {exercises.map((slug) => (
            <SelectItem key={slug} value={slug}>
              {titles[slug] ?? slug}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              domain={["dataMin - 10", "dataMax + 10"]}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
              }}
            />
            <Line
              type="monotone"
              dataKey="bpm"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
