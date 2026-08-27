import { heatmapGrid, type DayMinutes, type HeatLevel } from "@/lib/chart/heatmap";

/** clases por nivel; el 0 es el hueco vacío del calendario */
const NIVEL: Record<HeatLevel, string> = {
  0: "fill-muted",
  1: "fill-primary/25",
  2: "fill-primary/50",
  3: "fill-primary/75",
  4: "fill-primary",
};

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
/** días cuya inicial se rotula: con las siete no se lee nada */
const DIAS_VISIBLES = [0, 2, 4];

const LADO = 12;
const HUECO = 3;
const PASO = LADO + HUECO;
const MARGEN_X = 20;
const MARGEN_Y = 14;

export function PracticeHeatmap({
  sessions,
  today,
  weeks = 26,
}: {
  sessions: readonly DayMinutes[];
  /** "YYYY-MM-DD" del día de hoy, decidido por quien renderiza */
  today: string;
  weeks?: number;
}) {
  const grid = heatmapGrid(sessions, { today, weeks });
  const width = MARGEN_X + grid.weeks.length * PASO;
  const height = MARGEN_Y + 7 * PASO;

  const horas = Math.floor(grid.total / 60);
  const minutos = grid.total % 60;
  const tiempo = horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`;

  return (
    <div>
      <p className="text-muted-foreground text-sm">
        {grid.total === 0 ? (
          <>
            Aquí se irá pintando tu calendario. Cada lección completada deja su casilla.
          </>
        ) : (
          <>
            <strong className="text-foreground font-medium">{tiempo}</strong> en{" "}
            {grid.practicedDays} {grid.practicedDays === 1 ? "día" : "días"}
            {grid.streak > 0 && (
              <>
                {" · racha de "}
                <strong className="text-foreground font-medium">
                  {grid.streak} {grid.streak === 1 ? "día" : "días"}
                </strong>
              </>
            )}
            {grid.bestStreak > grid.streak && <> · mejor: {grid.bestStreak} días</>}
          </>
        )}
      </p>

      {/* se desborda a lo ancho en móvil en vez de encoger las casillas */}
      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`Calendario de práctica de las últimas ${weeks} semanas: ${tiempo} en ${grid.practicedDays} días.`}
          className="max-w-none"
        >
          {grid.months.map((m) => (
            <text
              key={`${m.label}-${m.column}`}
              x={MARGEN_X + m.column * PASO}
              y={10}
              fontSize={9}
              className="fill-muted-foreground"
            >
              {m.label}
            </text>
          ))}

          {DIAS_VISIBLES.map((d) => (
            <text
              key={d}
              x={1}
              y={MARGEN_Y + d * PASO + LADO - 2}
              fontSize={9}
              className="fill-muted-foreground"
            >
              {DIAS[d]}
            </text>
          ))}

          {grid.weeks.map((semana, w) =>
            semana.map((cell, d) =>
              cell.inRange ? (
                <rect
                  key={cell.date}
                  x={MARGEN_X + w * PASO}
                  y={MARGEN_Y + d * PASO}
                  width={LADO}
                  height={LADO}
                  rx={2}
                  className={NIVEL[cell.level]}
                >
                  {/* una sola cadena: React no admite `<title>` troceado */}
                  <title>{`${cell.date}: ${cell.minutes === 0 ? "sin práctica" : `${cell.minutes} min`}`}</title>
                </rect>
              ) : null,
            ),
          )}
        </svg>
      </div>

      <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
        <span>Menos</span>
        {([0, 1, 2, 3, 4] as HeatLevel[]).map((n) => (
          <svg key={n} width={LADO} height={LADO} aria-hidden>
            <rect width={LADO} height={LADO} rx={2} className={NIVEL[n]} />
          </svg>
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}
